import type { APIRoute } from "astro";
import { getNewsBySlug, upsertNews, deleteNews } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  const post = await getNewsBySlug(slug);
  if (!post || !post.published) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  return Response.json(post);
};

export const PUT: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const slug = context.params.slug!;
  const existing = await getNewsBySlug(slug);
  const body = await context.request.json();
  const id = body.id || existing?.id;
  if (!id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const post = await upsertNews({
    id,
    slug: body.slug || slug,
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
  return Response.json(post);
};

export const DELETE: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const slug = context.params.slug!;
  const existing = await getNewsBySlug(slug);
  if (!existing) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  await deleteNews(existing.id, slug);
  return new Response(null, { status: 204 });
};
