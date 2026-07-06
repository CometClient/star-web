import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type NewsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string;
  cover_url: string | null;
  published: number;
  published_at: string | null;
  author: string | null;
  mc_author_username: string | null;
  pinned: number;
};

type StaffMember = {
  id: string;
  display_name: string;
  mc_username: string | null;
  mc_uuid: string | null;
  role: string;
  role_tier: string;
  bio: string | null;
  avatar_url: string | null;
  sort_order: number;
  published: number;
};

type Tab = "news" | "staff";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-pink-400/40";
const labelClass = "mb-1 block text-xs uppercase tracking-wider text-white/40";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function NewsEditor({
  post,
  onSave,
  onCancel,
}: {
  post: Partial<NewsPost> & { title: string };
  onSave: (p: Partial<NewsPost> & { title: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(post);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const insert = (before: string, after = "") => {
    const ta = document.getElementById("body-editor") as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = draft.body_md ?? "";
    const selected = text.slice(start, end);
    const next = text.slice(0, start) + before + selected + after + text.slice(end);
    setDraft({ ...draft, body_md: next });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Title</label>
          <input
            className={inputClass}
            value={draft.title}
            onChange={(e) =>
              setDraft({
                ...draft,
                title: e.target.value,
                slug: draft.slug || slugify(e.target.value),
              })
            }
          />
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <input
            className={inputClass}
            value={draft.slug ?? ""}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Excerpt</label>
          <input
            className={inputClass}
            value={draft.excerpt ?? ""}
            onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Author display</label>
          <input
            className={inputClass}
            value={draft.author ?? ""}
            onChange={(e) => setDraft({ ...draft, author: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>MC username (avatar)</label>
          <input
            className={inputClass}
            placeholder="MHF_Alex"
            value={draft.mc_author_username ?? ""}
            onChange={(e) => setDraft({ ...draft, mc_author_username: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Cover image URL</label>
          <input
            className={inputClass}
            placeholder="https://..."
            value={draft.cover_url ?? ""}
            onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-end gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={!!draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked ? 1 : 0 })}
            />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={!!draft.pinned}
              onChange={(e) => setDraft({ ...draft, pinned: e.target.checked ? 1 : 0 })}
            />
            Pinned
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button type="button" className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/5" onClick={() => insert("**", "**")}>Bold</button>
          <button type="button" className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/5" onClick={() => insert("*", "*")}>Italic</button>
          <button type="button" className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/5" onClick={() => insert("## ", "")}>H2</button>
          <button type="button" className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/5" onClick={() => insert("[", "](url)")}>Link</button>
          <button type="button" className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/5" onClick={() => insert("![alt](", ")")}>Image</button>
          <button type="button" className="ml-auto rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/5" onClick={() => setPreview(!preview)}>
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="prose prose-invert min-h-[240px] max-w-none rounded-lg border border-white/10 bg-black/30 p-4 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.body_md ?? ""}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="body-editor"
            className={`${inputClass} min-h-[280px] font-mono`}
            value={draft.body_md ?? ""}
            onChange={(e) => setDraft({ ...draft, body_md: e.target.value })}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          className="rounded-lg bg-pink-300/90 px-4 py-2 text-sm font-medium text-black hover:bg-pink-200 disabled:opacity-50"
          onClick={async () => {
            setSaving(true);
            await onSave(draft);
            setSaving(false);
          }}
        >
          {saving ? "Saving…" : "Save post"}
        </button>
        <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function StaffEditor({
  member,
  onSave,
  onCancel,
}: {
  member: Partial<StaffMember> & { display_name: string; role: string };
  onSave: (m: Partial<StaffMember> & { display_name: string; role: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(member);
  const [saving, setSaving] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Display name</label>
        <input className={inputClass} value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
      </div>
      <div>
        <label className={labelClass}>Role title</label>
        <input className={inputClass} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
      </div>
      <div>
        <label className={labelClass}>MC username</label>
        <input className={inputClass} value={draft.mc_username ?? ""} onChange={(e) => setDraft({ ...draft, mc_username: e.target.value })} />
      </div>
      <div>
        <label className={labelClass}>MC UUID</label>
        <input className={inputClass} value={draft.mc_uuid ?? ""} onChange={(e) => setDraft({ ...draft, mc_uuid: e.target.value })} />
      </div>
      <div>
        <label className={labelClass}>Tier</label>
        <select className={inputClass} value={draft.role_tier ?? "team"} onChange={(e) => setDraft({ ...draft, role_tier: e.target.value })}>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="developer">Developer</option>
          <option value="admin">Admin</option>
          <option value="support">Support</option>
          <option value="team">Team</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Sort order</label>
        <input type="number" className={inputClass} value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Bio</label>
        <textarea className={`${inputClass} min-h-[80px]`} value={draft.bio ?? ""} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={draft.published !== 0} onChange={(e) => setDraft({ ...draft, published: e.target.checked ? 1 : 0 })} />
          Visible on /staff
        </label>
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="button"
          disabled={saving}
          className="rounded-lg bg-pink-300/90 px-4 py-2 text-sm font-medium text-black hover:bg-pink-200"
          onClick={async () => {
            setSaving(true);
            await onSave(draft);
            setSaving(false);
          }}
        >
          Save member
        </button>
        <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function StaffAdmin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("news");
  const [news, setNews] = useState<NewsPost[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [editingNews, setEditingNews] = useState<(Partial<NewsPost> & { title: string }) | null>(null);
  const [editingStaff, setEditingStaff] = useState<(Partial<StaffMember> & { display_name: string; role: string }) | null>(null);

  const checkSession = useCallback(async () => {
    const res = await fetch("/api/local/auth/session");
    const data = await res.json();
    setAuthed(!!data.authenticated);
  }, []);

  const loadNews = useCallback(async () => {
    const res = await fetch("/api/news?all=1");
    setNews(await res.json());
  }, []);

  const loadStaff = useCallback(async () => {
    const res = await fetch("/api/staff?all=1");
    setStaff(await res.json());
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authed) {
      loadNews();
      loadStaff();
    }
  }, [authed, loadNews, loadStaff]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/local/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError("Invalid email or password");
      return;
    }
    setAuthed(true);
  };

  const logout = async () => {
    await fetch("/api/local/auth/logout", { method: "POST" });
    setAuthed(false);
  };

  const saveNews = async (post: Partial<NewsPost> & { title: string }) => {
    const method = post.id && news.some((n) => n.id === post.id) ? "PUT" : "POST";
    const url = method === "PUT" ? `/api/news/${post.slug}` : "/api/news";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    setEditingNews(null);
    await loadNews();
  };

  const saveStaffMember = async (member: Partial<StaffMember> & { display_name: string; role: string }) => {
    const isNew = !member.id || !staff.some((s) => s.id === member.id);
    if (isNew) {
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
    } else {
      await fetch(`/api/staff/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
    }
    setEditingStaff(null);
    await loadStaff();
  };

  const shellClass = "min-h-screen bg-[#09090c] text-white";

  if (authed === null) {
    return <div className={`${shellClass} flex items-center justify-center text-white/40`}>Loading…</div>;
  }

  if (!authed) {
    return (
      <div className={`${shellClass} flex items-center justify-center px-4`}>
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <img src="/comet-logo.png" alt="" className="mx-auto mb-4 h-12 w-12" />
          <h1 className="mb-6 text-center font-[Fastelar] text-xl tracking-wide">Staff login</h1>
          {error && <p className="mb-4 text-center text-sm text-red-400">{error}</p>}
          <label className={labelClass}>Email</label>
          <input className={`${inputClass} mb-4`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className={labelClass}>Password</label>
          <input className={`${inputClass} mb-6`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full rounded-lg bg-pink-300/90 py-2.5 text-sm font-medium text-black hover:bg-pink-200">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <header className="border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/comet-logo.png" alt="" className="h-8 w-8" />
            <span className="font-[Fastelar] text-lg">Comet CMS</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-white/45 hover:text-white">View site</a>
            <button type="button" onClick={logout} className="text-sm text-white/45 hover:text-white">
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="mb-8 flex gap-2">
          {(["news", "staff"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setEditingNews(null);
                setEditingStaff(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm capitalize ${tab === t ? "bg-white/10 text-white" : "text-white/45 hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "news" && (
          <div>
            {editingNews ? (
              <NewsEditor post={editingNews} onSave={saveNews} onCancel={() => setEditingNews(null)} />
            ) : (
              <>
                <div className="mb-4 flex justify-between">
                  <h2 className="font-[Fastelar] text-xl">News posts</h2>
                  <button
                    type="button"
                    className="rounded-lg bg-pink-300/90 px-3 py-1.5 text-sm font-medium text-black"
                    onClick={() => setEditingNews({ title: "", slug: "", body_md: "", published: 0 })}
                  >
                    New post
                  </button>
                </div>
                <div className="space-y-2">
                  {news.map((post) => (
                    <div key={post.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-xs text-white/35">/{post.slug} · {post.published ? "published" : "draft"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="text-sm text-pink-300/80 hover:text-pink-200" onClick={() => setEditingNews(post)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm text-red-400/70 hover:text-red-300"
                          onClick={async () => {
                            if (!confirm("Delete this post?")) return;
                            await fetch(`/api/news/${post.slug}`, { method: "DELETE" });
                            loadNews();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "staff" && (
          <div>
            {editingStaff ? (
              <StaffEditor member={editingStaff} onSave={saveStaffMember} onCancel={() => setEditingStaff(null)} />
            ) : (
              <>
                <div className="mb-4 flex justify-between">
                  <h2 className="font-[Fastelar] text-xl">Staff members</h2>
                  <button
                    type="button"
                    className="rounded-lg bg-pink-300/90 px-3 py-1.5 text-sm font-medium text-black"
                    onClick={() => setEditingStaff({ display_name: "", role: "", role_tier: "team", published: 1 })}
                  >
                    Add member
                  </button>
                </div>
                <div className="space-y-2">
                  {staff.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div>
                        <p className="font-medium">{m.display_name}</p>
                        <p className="text-xs text-white/35">{m.role} · {m.role_tier}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="text-sm text-pink-300/80" onClick={() => setEditingStaff(m)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm text-red-400/70"
                          onClick={async () => {
                            if (!confirm("Remove this member?")) return;
                            await fetch(`/api/staff/${m.id}`, { method: "DELETE" });
                            loadStaff();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
