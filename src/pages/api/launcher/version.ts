import type { APIRoute } from "astro";
import { getLatestLauncherVersion, listLauncherVersions } from "@/lib/db";

export const GET: APIRoute = async ({ url }) => {
  try {
    const all = url.searchParams.get("all");

    if (all === "1" || all === "true") {
      const versions = await listLauncherVersions(true);
      return new Response(JSON.stringify(versions), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const latest = await getLatestLauncherVersion();
    if (!latest) {
      return new Response(JSON.stringify({ error: "No published version" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(latest), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
