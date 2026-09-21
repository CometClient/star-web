/**
 * Beta token redemption, driven inside the existing `.beta-modal`.
 *
 * intro → token → confirm → done. Verifying is free; confirming spends the
 * token and mints a link that works exactly once.
 */

import {
  BETA_ARCH_OPTIONS,
  BETA_OS_OPTIONS,
  detectArch,
  detectOs,
  pickBuild,
  platformLabel,
  type BetaArch,
  type BetaBuildInfo,
  type BetaOs,
} from "../lib/beta-platforms";

type Step = "intro" | "token" | "confirm" | "done";

interface VerifyResponse {
  ok: true;
  tester: {
    display_name: string;
    mc_username: string | null;
    mc_uuid: string | null;
    render_url: string;
  };
  build: BetaBuildInfo | null;
  builds?: BetaBuildInfo[];
  pinned_build?: boolean;
}

interface ConfirmResponse {
  ok: true;
  url: string;
  expires_at: string;
  build: { filename: string };
}

/** Each `reason` has a different remedy, so spell them out rather than echoing raw errors. */
const REASONS: Record<string, string> = {
  invalid: "That token isn't recognised. Check for typos.",
  expired: "This token has expired. Ask staff for a new one.",
  revoked: "This token was revoked. Ask staff for a new one.",
  already_redeemed: "This token has already been used.",
  inactive: "Beta access isn't active for this account.",
  no_build: "No beta build has been published yet — your token is unspent.",
  missing: "Enter your beta token.",
  platform_required: "Pick the OS and architecture that match your machine.",
};

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

async function readError(res: Response) {
  const body = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
  return (body.reason && REASONS[body.reason]) || body.error || "Something went wrong. Try again.";
}

function chip(label: string, active: boolean): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `beta-chip${active ? " is-active" : ""}`;
  btn.textContent = label;
  return btn;
}

export function initBetaRedeem() {
  const sheet = document.getElementById("download-sheet");
  if (!sheet) return;

  const steps = new Map<Step, HTMLElement>();
  sheet.querySelectorAll<HTMLElement>("[data-beta-step]").forEach((el) => {
    steps.set(el.dataset.betaStep as Step, el);
  });
  if (!steps.size) return;

  const $ = <T extends Element>(sel: string) => sheet.querySelector<T>(sel);

  const input = $<HTMLInputElement>("[data-beta-input]");
  const form = $<HTMLFormElement>("[data-beta-form]");
  const submit = $<HTMLButtonElement>("[data-beta-submit]");
  const error = $<HTMLElement>("[data-beta-error]");
  const confirmError = $<HTMLElement>("[data-beta-confirm-error]");
  const confirmBtn = $<HTMLButtonElement>("[data-beta-confirm]");
  const downloadLink = $<HTMLAnchorElement>("[data-beta-download]");
  const countdown = $<HTMLElement>("[data-beta-countdown]");
  const osBox = $<HTMLElement>("[data-beta-os]");
  const archBox = $<HTMLElement>("[data-beta-arch]");
  const picker = $<HTMLElement>("[data-beta-platform-picker]");
  const empty = $<HTMLElement>("[data-beta-platform-empty]");

  let token = "";
  let builds: BetaBuildInfo[] = [];
  let pinned = false;
  let os: BetaOs = detectOs();
  let arch: BetaArch = "arm64";
  let timer: number | undefined;

  void detectArch().then((detected) => {
    arch = detected;
    renderPicker();
  });

  const show = (step: Step) => {
    steps.forEach((el, key) => {
      el.hidden = key !== step;
    });
    if (step === "token") input?.focus();
  };

  const setError = (el: HTMLElement | null, message: string) => {
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
  };

  const busy = (btn: HTMLButtonElement | null, on: boolean, label: string) => {
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = label;
  };

  const selectedBuild = () => pickBuild(builds, os, arch);

  const renderBuild = () => {
    const selected = selectedBuild();
    const buildBox = $<HTMLElement>("[data-beta-build]");
    if (buildBox) buildBox.hidden = !selected;
    if (empty) empty.hidden = Boolean(selected) || builds.length === 0;
    if (selected) {
      const set = (sel: string, value: string) => {
        const el = $<HTMLElement>(sel);
        if (el) el.textContent = value;
      };
      set("[data-beta-build-version]", selected.version);
      set("[data-beta-build-platform]", platformLabel(selected.platform));
      set("[data-beta-build-size]", formatBytes(selected.size_bytes));
    }
    if (confirmBtn) confirmBtn.disabled = !selected;
  };

  const renderPicker = () => {
    if (!osBox || !archBox || !picker) {
      renderBuild();
      return;
    }
    picker.hidden = pinned || builds.length === 0;
    osBox.replaceChildren(
      ...BETA_OS_OPTIONS.map((opt) => {
        const btn = chip(opt.label, os === opt.id);
        btn.addEventListener("click", () => {
          os = opt.id;
          renderPicker();
        });
        return btn;
      }),
    );
    archBox.replaceChildren(
      ...BETA_ARCH_OPTIONS.map((opt) => {
        const btn = chip(opt.label, arch === opt.id);
        btn.title = opt.hint;
        btn.addEventListener("click", () => {
          arch = opt.id;
          renderPicker();
        });
        return btn;
      }),
    );
    renderBuild();
  };

  sheet.querySelectorAll<HTMLElement>("[data-beta-goto]").forEach((el) => {
    el.addEventListener("click", () => {
      setError(error, "");
      setError(confirmError, "");
      show(el.dataset.betaGoto as Step);
    });
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const candidate = input?.value.trim() ?? "";
    if (!candidate) return setError(error, REASONS.missing);

    setError(error, "");
    busy(submit, true, "Verifying…");
    try {
      const res = await fetch("/api/beta/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: candidate }),
      });
      if (!res.ok) return setError(error, await readError(res));

      const data = (await res.json()) as VerifyResponse;
      token = candidate;
      builds = data.builds ?? (data.build ? [data.build] : []);
      pinned = Boolean(data.pinned_build);

      const render = $<HTMLImageElement>("[data-beta-render]");
      if (render) {
        render.src = data.tester.render_url;
        render.alt = data.tester.mc_username ?? "Your Minecraft skin";
      }
      const name = $<HTMLElement>("[data-beta-name]");
      if (name) name.textContent = data.tester.mc_username ?? data.tester.display_name;
      const uuid = $<HTMLElement>("[data-beta-uuid]");
      if (uuid) uuid.textContent = data.tester.mc_uuid ?? "";

      renderPicker();
      show("confirm");
    } catch {
      setError(error, "Couldn't reach the server. Check your connection.");
    } finally {
      busy(submit, false, "Verify token");
    }
  });

  confirmBtn?.addEventListener("click", async () => {
    if (!token) return;
    const selected = selectedBuild();
    if (!selected) return setError(confirmError, REASONS.platform_required);
    setError(confirmError, "");
    busy(confirmBtn, true, "Creating link…");
    try {
      const res = await fetch("/api/beta/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, build_id: selected.id, confirmed: true }),
      });
      if (!res.ok) return setError(confirmError, await readError(res));

      const data = (await res.json()) as ConfirmResponse;
      // The token is spent the moment the link exists — drop it from memory.
      token = "";
      if (input) input.value = "";

      const filename = $<HTMLElement>("[data-beta-filename]");
      if (filename) filename.textContent = data.build.filename;
      if (downloadLink) downloadLink.href = data.url;

      const expiresAt = Date.parse(data.expires_at);
      const tick = () => {
        const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        if (countdown) countdown.textContent = left > 0 ? `Expires in ${left}s` : "Link expired";
        if (left <= 0) {
          window.clearInterval(timer);
          downloadLink?.setAttribute("aria-disabled", "true");
          downloadLink?.classList.add("is-disabled");
        }
      };
      tick();
      timer = window.setInterval(tick, 1000);

      show("done");
    } catch {
      setError(confirmError, "Couldn't reach the server. Check your connection.");
    } finally {
      busy(confirmBtn, false, "That's me — get my download");
    }
  });

  // A token handed out as a link (/beta?token=…) drops straight into the flow.
  const params = new URLSearchParams(window.location.search);
  const preset = params.get("token");
  if (preset && input) {
    input.value = preset;
    show("token");
    document.querySelector<HTMLElement>("[data-download-sheet-open]")?.click();
    // Don't leave the token sitting in the address bar or browser history.
    params.delete("token");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }
}
