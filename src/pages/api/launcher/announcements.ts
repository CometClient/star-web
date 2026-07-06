import type { APIRoute } from "astro";
import { listLauncherAnnouncements } from "@/lib/db";

export const GET: APIRoute = async () => {
  try {
    const announcements = listLauncherAnnouncements(true);
    return new Response(JSON.stringify(announcements), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
