import type { APIRoute } from "astro";
import { getLauncherAnnouncements } from "@/lib/api";

export const GET: APIRoute = async () => {
  try {
    const announcements = await getLauncherAnnouncements();
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
