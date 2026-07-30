import type { APIRoute } from "astro";
import { listNews, upsertNews } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export const GET: APIRoute = async ({ url }) => {
  const all = url.searchParams.get("all") === "1";
  const posts = await listNews(!all);
  return Response.json(posts);
};

export const POST: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const body = await context.request.json();
  const id = body.id || randomUUID();
  const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || id;
  const post = await upsertNews({
    id,
    slug,
    title: body.title,
    excerpt: body.excerpt,
    body_md: body.body_md ?? "",
    cover_url: body.cover_url,
    published: body.published ? 1 : 0,
    published_at: body.published ? body.published_at || new Date().toISOString() : null,
    author: body.author,
    mc_author_username: body.mc_author_username,
    pinned: body.pinned ? 1 : 0,
  });
  return Response.json(post, { status: 201 });
};
