import {
  DOWNLOAD_LINK_TTL_SECONDS,
  type BetaBuild,
  generateBetaToken,
  hashBetaToken,
  resolveUsername,
  sha256Hash,
  skinUrls,
  tokenHint,
} from "./beta";
import {
  betaAnalytics,
  consumeDownload,
  createBuild,
  createToken,
  deleteBuild,
  deleteTester,
  deleteToken,
  getBuild,
  getDownload,
  getLatestBuild,
  getTester,
  getTokenByHash,
  listBuilds,
  listTesters,
  listTokens,
  logEvent,
  redeemToken,
  revokeToken,
  setBuildActive,
  upsertTester,
} from "./beta-queries";
import { normalizeUuid } from "./presence";
import { json } from "./queries";
import { hasR2Creds, presignR2Put } from "./r2-presign";

export interface BetaEnv {
  DB: D1Database;
  BETA_BUILDS?: R2Bucket;
  // R2 S3-API credentials for presigned direct uploads (worker secrets).
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
}

/** Token state, spelled out so the UI can say exactly why a token failed. */
function tokenProblem(
  token: { expires_at: string | null; redeemed_at: string | null; revoked_at: string | null },
  now: Date,
): string | null {
  if (token.revoked_at) return "revoked";
  if (token.redeemed_at) return "already_redeemed";
  if (token.expires_at && Date.parse(token.expires_at) <= now.getTime()) return "expired";
  return null;
}

async function hashIp(request: Request): Promise<string | null> {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return null;
  // Hashed, not stored raw: enough to spot link sharing, not a stored address.
  return (await sha256Hash(ip)).slice(0, 32);
}

/**
 * Public shape of a tester. Email is only included for staff views, so the
 * launcher roster never leaks contact details.
 */
function publicTester(row: Record<string, unknown>, includeEmail: boolean) {
  const username = (row.mc_username as string | null) ?? null;
  const uuid = (row.mc_uuid as string | null) ?? null;
  return {
    id: row.id,
    display_name: row.display_name,
    mc_username: username,
    mc_uuid: uuid,
    status: row.status,
    note: row.note ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...skinUrls(username, uuid),
    ...(includeEmail ? { email: row.email ?? null } : {}),
  };
}

/**
 * Every /beta/* route. Returns null when the path is not a beta route so the
 * main router can fall through to its 404.
 */
export async function handleBetaRoute(
  request: Request,
  env: BetaEnv,
  path: string,
  url: URL,
): Promise<Response | null> {
  if (!path.startsWith("/beta")) return null;
  const method = request.method;
  const now = new Date();
  const nowIso = now.toISOString();

  // --- Roster + tester CRUD ---

  if (path === "/beta/testers" && method === "GET") {
    const includeEmail = url.searchParams.get("full") === "1";
    const [testers, tokens] = await Promise.all([listTesters(env.DB), listTokens(env.DB)]);
    return json(
      testers.map((t) => {
        const mine = tokens.filter((tok) => tok.tester_id === t.id);
        return {
          ...publicTester(t as unknown as Record<string, unknown>, includeEmail),
          tokens_issued: mine.length,
          tokens_active: mine.filter((tok) => !tok.redeemed_at && !tok.revoked_at).length,
          last_token_at: mine[0]?.created_at ?? null,
        };
      }),
    );
  }

  if (path === "/beta/testers" && method === "POST") {
    const body = (await request.json()) as Record<string, unknown>;
    const displayName = String(body.display_name ?? body.mc_username ?? "").trim();
    if (!displayName) return json({ error: "display_name is required" }, 400);

    const id = String(body.id || crypto.randomUUID());
    const existing = await getTester(env.DB, id);
    const uuid = normalizeUuid(body.mc_uuid);
    if (body.mc_uuid && !uuid) return json({ error: "Malformed mc_uuid" }, 400);

    // Fill the username in from the UUID so staff only have to paste one field.
    let username = typeof body.mc_username === "string" ? body.mc_username.trim() : "";
    if (!username && uuid) username = (await resolveUsername(uuid)) ?? "";

    const tester = await upsertTester(env.DB, {
      id,
      display_name: displayName,
      mc_username: username || null,
      mc_uuid: uuid,
      email: typeof body.email === "string" ? body.email.trim().toLowerCase() || null : null,
      note: typeof body.note === "string" ? body.note : null,
      status: typeof body.status === "string" ? body.status : (existing?.status ?? "active"),
      created_at: existing?.created_at ?? nowIso,
      updated_at: nowIso,
    });
    await logEvent(env.DB, { kind: existing ? "tester_updated" : "tester_added", tester_id: id }, nowIso);
    return json(publicTester(tester as unknown as Record<string, unknown>, true), existing ? 200 : 201);
  }

  const testerId = path.match(/^\/beta\/testers\/([^/]+)$/);
  if (testerId && method === "DELETE") {
    const id = decodeURIComponent(testerId[1]);
    await deleteTester(env.DB, id);
    await logEvent(env.DB, { kind: "tester_removed", tester_id: id }, nowIso);
    return new Response(null, { status: 204 });
  }

  // --- Access tokens ---

  if (path === "/beta/tokens" && method === "GET") {
    const testerParam = url.searchParams.get("tester_id") ?? undefined;
    const tokens = await listTokens(env.DB, testerParam);
    return json(
      tokens.map(({ token_hash: _hash, ...rest }) => ({
        ...rest,
        state: tokenProblem(rest, now) ?? "active",
      })),
    );
  }

  if (path === "/beta/tokens" && method === "POST") {
    const body = (await request.json()) as Record<string, unknown>;
    const tester = await getTester(env.DB, String(body.tester_id ?? ""));
    if (!tester) return json({ error: "Unknown tester" }, 404);
    if (tester.status !== "active") return json({ error: "Tester is not active" }, 409);

    const plaintext = generateBetaToken();
    const created = await createToken(env.DB, {
      id: crypto.randomUUID(),
      tester_id: tester.id,
      token_hash: await hashBetaToken(plaintext),
      token_hint: tokenHint(plaintext),
      label: typeof body.label === "string" ? body.label : null,
      build_id: typeof body.build_id === "string" && body.build_id ? body.build_id : null,
      created_at: nowIso,
      expires_at: typeof body.expires_at === "string" && body.expires_at ? body.expires_at : null,
      redeemed_at: null,
      revoked_at: null,
    });
    await logEvent(env.DB, { kind: "token_issued", tester_id: tester.id, token_id: created?.id }, nowIso);

    // The only time the plaintext ever leaves this worker.
    const { token_hash: _hash, ...safe } = created ?? ({} as Record<string, unknown>);
    return json({ ...safe, token: plaintext, state: "active" }, 201);
  }

  const tokenId = path.match(/^\/beta\/tokens\/([^/]+)$/);
  if (tokenId && method === "DELETE") {
    const id = decodeURIComponent(tokenId[1]);
    if (url.searchParams.get("hard") === "1") {
      await deleteToken(env.DB, id);
    } else {
      await revokeToken(env.DB, id, nowIso);
    }
    await logEvent(env.DB, { kind: "token_revoked", token_id: id }, nowIso);
    return new Response(null, { status: 204 });
  }

  // --- Builds ---

  if (path === "/beta/builds" && method === "GET") {
    return json(await listBuilds(env.DB, url.searchParams.get("active") === "1"));
  }

  // Step 1 of a direct upload: mint a presigned R2 PUT URL so the browser sends
  // the (potentially large) file straight to the bucket, never through a Worker.
  if (path === "/beta/builds/presign" && method === "POST") {
    if (!hasR2Creds(env)) {
      return json(
        { error: "Direct upload not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY on the worker" },
        501,
      );
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const filename = String(body.filename ?? "").trim();
    if (!filename) return json({ error: "filename is required" }, 400);
    const id = crypto.randomUUID();
    // Keep the name but strip path separators a browser might send.
    const safeName = filename.replace(/[/\\]/g, "_");
    const storageKey = `builds/${id}/${safeName}`;
    const uploadUrl = await presignR2Put(env, storageKey, 3600);
    return json({ id, storage_key: storageKey, upload_url: uploadUrl, expires_in: 3600 });
  }

  if (path === "/beta/builds" && method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";

    // Step 2 of a direct upload: the file is already in R2, just record the row.
    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const version = String(body.version ?? "").trim();
      if (!version) return json({ error: "version is required" }, 400);
      const storageKey = String(body.storage_key ?? "").trim();
      if (!storageKey) return json({ error: "storage_key is required" }, 400);
      const id = String(body.id ?? crypto.randomUUID());

      // Confirm the upload actually landed, and trust R2 for the real size.
      let sizeBytes = Number(body.size_bytes ?? 0);
      if (env.BETA_BUILDS) {
        const head = await env.BETA_BUILDS.head(storageKey);
        if (!head) return json({ error: "Upload not found in storage — did the PUT succeed?" }, 400);
        sizeBytes = head.size;
      }

      const platform = String(body.platform ?? "universal").trim() || "universal";
      const build = await createBuild(env.DB, {
        id,
        version,
        platform,
        filename: String(body.filename ?? storageKey.split("/").pop() ?? "build"),
        content_type: body.content_type ? String(body.content_type) : "application/octet-stream",
        size_bytes: sizeBytes,
        sha256: body.sha256 ? String(body.sha256) : null,
        storage_key: storageKey,
        notes: String(body.notes ?? "") || null,
        is_active: body.is_active === false || body.is_active === 0 ? 0 : 1,
        created_at: nowIso,
      });
      await logEvent(env.DB, { kind: "build_uploaded", build_id: id, detail: `${version} · ${platform}` }, nowIso);
      return json(build, 201);
    }

    // Legacy inline multipart upload — small builds, or when R2 creds aren't set.
    // Bounded by the Worker request-body limit; the presigned path above is the
    // one that handles large files.
    if (!env.BETA_BUILDS) {
      return json({ error: "Build storage (R2 binding BETA_BUILDS) is not configured" }, 501);
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Missing file" }, 400);

    const version = String(form.get("version") ?? "").trim();
    if (!version) return json({ error: "version is required" }, 400);
    const platform = String(form.get("platform") ?? "universal").trim() || "universal";

    const bytes = await file.arrayBuffer();
    const id = crypto.randomUUID();
    const storageKey = `builds/${id}/${file.name}`;
    await env.BETA_BUILDS.put(storageKey, bytes, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    const build = await createBuild(env.DB, {
      id,
      version,
      platform,
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      size_bytes: bytes.byteLength,
      sha256: await sha256Hash(bytes),
      storage_key: storageKey,
      notes: String(form.get("notes") ?? "") || null,
      is_active: form.get("is_active") === "0" ? 0 : 1,
      created_at: nowIso,
    });
    await logEvent(env.DB, { kind: "build_uploaded", build_id: id, detail: `${version} · ${platform}` }, nowIso);
    return json(build, 201);
  }

  const buildId = path.match(/^\/beta\/builds\/([^/]+)$/);
  if (buildId && method === "PATCH") {
    const body = (await request.json()) as Record<string, unknown>;
    const build = await setBuildActive(env.DB, decodeURIComponent(buildId[1]), body.is_active !== false && body.is_active !== 0);
    if (!build) return json({ error: "Not found" }, 404);
    return json(build);
  }

  if (buildId && method === "DELETE") {
    const id = decodeURIComponent(buildId[1]);
    const build = await getBuild(env.DB, id);
    if (build && env.BETA_BUILDS) await env.BETA_BUILDS.delete(build.storage_key);
    await deleteBuild(env.DB, id);
    await logEvent(env.DB, { kind: "build_deleted", build_id: id }, nowIso);
    return new Response(null, { status: 204 });
  }

  // --- Redemption flow ---

  /** Step 1: is this token good, and who does it belong to? Nothing is burned. */
  if (path === "/beta/verify" && method === "POST") {
    const body = (await request.json()) as Record<string, unknown>;
    const raw = typeof body.token === "string" ? body.token.trim() : "";
    if (!raw) return json({ error: "Missing token", reason: "missing" }, 400);

    const token = await getTokenByHash(env.DB, await hashBetaToken(raw));
    if (!token) {
      await logEvent(env.DB, { kind: "verify_fail", detail: "unknown_token" }, nowIso);
      return json({ error: "Invalid token", reason: "invalid" }, 401);
    }

    const problem = tokenProblem(token, now);
    if (problem) {
      await logEvent(env.DB, { kind: "verify_fail", token_id: token.id, detail: problem }, nowIso);
      return json({ error: `Token ${problem.replace(/_/g, " ")}`, reason: problem }, 401);
    }

    const tester = await getTester(env.DB, token.tester_id);
    if (!tester || tester.status !== "active") {
      await logEvent(env.DB, { kind: "verify_fail", token_id: token.id, detail: "tester_inactive" }, nowIso);
      return json({ error: "Beta access is not active for this account", reason: "inactive" }, 403);
    }

    // Refresh the name from Mojang so the confirmation screen shows what the
    // player is actually called today, not whatever staff typed weeks ago.
    let username = tester.mc_username;
    if (tester.mc_uuid) username = (await resolveUsername(tester.mc_uuid)) ?? username;

    const build = token.build_id ? await getBuild(env.DB, token.build_id) : await getLatestBuild(env.DB);
    await logEvent(env.DB, { kind: "verify_ok", tester_id: tester.id, token_id: token.id }, nowIso);

    return json({
      ok: true,
      token_id: token.id,
      tester: {
        id: tester.id,
        display_name: tester.display_name,
        mc_username: username,
        mc_uuid: tester.mc_uuid,
        ...skinUrls(username, tester.mc_uuid),
      },
      build: build
        ? {
            id: build.id,
            version: build.version,
            platform: build.platform,
            filename: build.filename,
            size_bytes: build.size_bytes,
            sha256: build.sha256,
            notes: build.notes,
          }
        : null,
      link_ttl_seconds: DOWNLOAD_LINK_TTL_SECONDS,
    });
  }

  /** Step 2: the player confirmed it's them — burn the token, mint the link. */
  if (path === "/beta/confirm" && method === "POST") {
    const body = (await request.json()) as Record<string, unknown>;
    const raw = typeof body.token === "string" ? body.token.trim() : "";
    if (!raw) return json({ error: "Missing token", reason: "missing" }, 400);

    const token = await getTokenByHash(env.DB, await hashBetaToken(raw));
    if (!token) return json({ error: "Invalid token", reason: "invalid" }, 401);

    const problem = tokenProblem(token, now);
    if (problem) {
      // Spending an already-spent token is a conflict, not an auth failure —
      // and it is the one case the launcher must never retry.
      return json(
        { error: `Token ${problem.replace(/_/g, " ")}`, reason: problem },
        problem === "already_redeemed" ? 409 : 401,
      );
    }

    const tester = await getTester(env.DB, token.tester_id);
    if (!tester || tester.status !== "active") {
      return json({ error: "Beta access is not active", reason: "inactive" }, 403);
    }

    const build: BetaBuild | null = token.build_id
      ? await getBuild(env.DB, token.build_id)
      : await getLatestBuild(env.DB);
    if (!build) return json({ error: "No beta build is available yet", reason: "no_build" }, 404);

    const downloadId = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const claimed = await redeemToken(
      env.DB,
      token,
      {
        id: downloadId,
        token_id: token.id,
        tester_id: tester.id,
        build_id: build.id,
        created_at: nowIso,
        expires_at: new Date(now.getTime() + DOWNLOAD_LINK_TTL_SECONDS * 1000).toISOString(),
        used_at: null,
        ip_hash: await hashIp(request),
        user_agent: request.headers.get("User-Agent"),
      },
      nowIso,
    );
    if (!claimed) return json({ error: "Token already redeemed", reason: "already_redeemed" }, 409);

    await logEvent(
      env.DB,
      { kind: "link_minted", tester_id: tester.id, token_id: token.id, build_id: build.id },
      nowIso,
    );
    return json({
      ok: true,
      download_id: downloadId,
      expires_in: DOWNLOAD_LINK_TTL_SECONDS,
      expires_at: new Date(now.getTime() + DOWNLOAD_LINK_TTL_SECONDS * 1000).toISOString(),
      build: { id: build.id, version: build.version, platform: build.platform, filename: build.filename, size_bytes: build.size_bytes },
    });
  }

  /** Step 3: single-use fetch of the actual file. */
  const downloadMatch = path.match(/^\/beta\/download\/([A-Za-z0-9_-]+)$/);
  if (downloadMatch && method === "GET") {
    const id = downloadMatch[1];
    const record = await getDownload(env.DB, id);
    if (!record) return json({ error: "Unknown or expired link", reason: "invalid" }, 404);
    if (record.used_at) return json({ error: "This link has already been used", reason: "used" }, 410);
    if (Date.parse(record.expires_at) <= now.getTime()) {
      return json({ error: "This link has expired", reason: "expired" }, 410);
    }
    if (!env.BETA_BUILDS) return json({ error: "Build storage is not configured" }, 501);

    const build = await getBuild(env.DB, record.build_id);
    if (!build) return json({ error: "Build no longer available", reason: "missing_build" }, 404);

    // Claim the link before streaming so a torn download can't be replayed.
    if (!(await consumeDownload(env.DB, id, nowIso))) {
      return json({ error: "This link has already been used", reason: "used" }, 410);
    }

    const object = await env.BETA_BUILDS.get(build.storage_key);
    if (!object) return json({ error: "Build file is missing from storage" }, 404);

    await logEvent(
      env.DB,
      { kind: "download", tester_id: record.tester_id, token_id: record.token_id, build_id: build.id },
      nowIso,
    );
    return new Response(object.body, {
      headers: {
        "Content-Type": build.content_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${build.filename.replace(/"/g, "")}"`,
        "Content-Length": String(build.size_bytes),
        "Cache-Control": "no-store",
      },
    });
  }

  // --- Analytics ---

  if (path === "/beta/analytics" && method === "GET") {
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") ?? 30) || 30));
    const since = new Date(now.getTime() - days * 86400000).toISOString();
    return json({ ...(await betaAnalytics(env.DB, since)), days });
  }

  return null;
}
