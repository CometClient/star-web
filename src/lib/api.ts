const DEFAULT_API = "https://comet-db-proxy.mrrpmeowfurry.dev";

/** Base URL for the Comet DB proxy (no trailing slash). Empty string = same-origin `/api`. */
export function getApiBase(): string {
  const env = import.meta.env.PUBLIC_API_URL;
  if (env !== undefined && env !== "") return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return "";
  return DEFAULT_API;
}

export function apiUrl(path: string, params?: Record<string, string | undefined>): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = base ? `${base}${normalized}` : normalized;
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, v);
  }
  const q = qs.toString();
  return q ? `${url}?${q}` : url;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return [] as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(text.slice(0, 200) || "Invalid JSON", res.status);
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const res = await fetch(apiUrl(path, params));
  if (res.status === 404) return [] as T;
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return parseJson<T>(res);
}

export async function apiGetOne<T>(path: string, params?: Record<string, string | undefined>): Promise<T | null> {
  const rows = await apiGet<T[]>(path, params);
  if (Array.isArray(rows)) return rows[0] ?? null;
  return rows as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return parseJson<T>(res);
}

// --- Types ---

export interface LauncherAnnouncement {
  id: number;
  announcement: string;
  redirect_url: string | null;
  is_active: number | boolean;
  published_at: string;
}

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  type: string;
  rarity: string;
  image_url: string | null;
  published: boolean;
  sort_order: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
  mc_author_username: string | null;
  mc_author_uuid: string | null;
  read_minutes: number | null;
  tags: string[] | null;
  category: string | null;
  body?: string | null;
  published?: boolean;
}

export interface ServiceStatus {
  id: string;
  service_name: string;
  status: string;
  message?: string | null;
  updated_at?: string;
  sla_target?: number | null;
  region?: string | null;
  description?: string | null;
}

export interface StatusIncident {
  id: string;
  title: string;
  body: string;
  status: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  service_id: string | null;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  status: string;
  body: string;
  created_at: string;
}

export interface SupportCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface SupportArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body?: string | null;
  category_id: string | null;
  published?: boolean;
  sort_order?: number;
}

export interface Job {
  id: string;
  title: string;
  team: string | null;
  location: string | null;
  description: string | null;
  apply_url: string | null;
  sort_order?: number;
}

export interface LauncherVersion {
  id: string;
  version: string;
  channel: string;
  notes: string | null;
  published_at: string | null;
  published?: boolean;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  updated_at: string;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_staff: boolean;
  created_at: string;
}

export interface AuthSession {
  token: string;
  user: { id: string; email: string };
}

// --- Normalizers ---

function truthy(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

function normalizeProduct(row: Record<string, unknown>): StoreProduct {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    price_cents: Number(row.price_cents ?? 0),
    currency: String(row.currency ?? "USD"),
    type: String(row.type ?? ""),
    rarity: String(row.rarity ?? "common"),
    image_url: (row.image_url as string | null) ?? null,
    published: truthy(row.published),
    sort_order: Number(row.sort_order ?? 0),
  };
}

function normalizeBlogPost(row: Record<string, unknown>): BlogPost {
  let tags = row.tags as string[] | null;
  if (typeof row.tags === "string") {
    try {
      tags = JSON.parse(row.tags);
    } catch {
      tags = null;
    }
  }
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: (row.excerpt as string | null) ?? null,
    cover_url: (row.cover_url as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    mc_author_username: (row.mc_author_username as string | null) ?? null,
    mc_author_uuid: (row.mc_author_uuid as string | null) ?? null,
    read_minutes: row.read_minutes != null ? Number(row.read_minutes) : null,
    tags,
    category: (row.category as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    published: row.published === undefined ? true : truthy(row.published),
  };
}

function asRows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data as Record<string, unknown>[];
}

// --- API methods ---

export async function getLauncherAnnouncements(): Promise<LauncherAnnouncement[]> {
  const rows = await apiGet<LauncherAnnouncement[]>("/api/launcher/announcements");
  return asRows(rows)
    .map((r) => ({
      id: Number(r.id),
      announcement: String(r.announcement ?? ""),
      redirect_url: (r.redirect_url as string | null) ?? null,
      is_active: r.is_active as number | boolean,
      published_at: String(r.published_at ?? ""),
    }))
    .filter((a) => truthy(a.is_active));
}

export async function getProducts(opts?: { slug?: string }): Promise<StoreProduct[]> {
  const params: Record<string, string | undefined> = {};
  if (opts?.slug) params.slug = opts.slug;
  const rows = await apiGet<unknown[]>("/api/products", params);
  return asRows(rows)
    .map(normalizeProduct)
    .filter((p) => p.published)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const products = await getProducts({ slug });
  return products.find((p) => p.slug === slug) ?? products[0] ?? null;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const rows = await apiGet<unknown[]>("/api/blog_posts");
  return asRows(rows)
    .map(normalizeBlogPost)
    .filter((p) => p.published !== false)
    .sort((a, b) => {
      const ta = a.published_at ? Date.parse(a.published_at) : 0;
      const tb = b.published_at ? Date.parse(b.published_at) : 0;
      return tb - ta;
    });
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const one = await apiGetOne<Record<string, unknown>>("/api/blog_posts", { slug });
  if (one) {
    const post = normalizeBlogPost(one);
    return post.published !== false ? post : null;
  }
  return (await getBlogPosts()).find((p) => p.slug === slug) ?? null;
}

export async function getServiceStatus(): Promise<ServiceStatus[]> {
  const rows = await apiGet<unknown[]>("/api/service_status");
  return asRows(rows).map((r) => ({
    id: String(r.id),
    service_name: String(r.service_name),
    status: String(r.status),
    message: (r.message as string | null) ?? null,
    updated_at: r.updated_at as string | undefined,
    sla_target: r.sla_target != null ? Number(r.sla_target) : null,
    region: (r.region as string | null) ?? null,
    description: (r.description as string | null) ?? null,
  }));
}

export async function getStatusIncidents(): Promise<StatusIncident[]> {
  const rows = await apiGet<unknown[]>("/api/status_incidents");
  return asRows(rows) as unknown as StatusIncident[];
}

export async function getIncidentUpdates(): Promise<IncidentUpdate[]> {
  const rows = await apiGet<unknown[]>("/api/incident_updates");
  return asRows(rows) as unknown as IncidentUpdate[];
}

export async function getSupportCategories(): Promise<SupportCategory[]> {
  const rows = await apiGet<unknown[]>("/api/support_categories");
  return asRows(rows) as unknown as SupportCategory[];
}

export async function getSupportArticles(): Promise<SupportArticle[]> {
  const rows = await apiGet<unknown[]>("/api/support_articles");
  return asRows(rows)
    .map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      excerpt: (r.excerpt as string | null) ?? null,
      body: (r.body as string | null) ?? null,
      category_id: (r.category_id as string | null) ?? null,
      published: r.published === undefined ? true : truthy(r.published),
      sort_order: r.sort_order != null ? Number(r.sort_order) : 0,
    }))
    .filter((a) => a.published)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function getSupportArticleBySlug(slug: string): Promise<SupportArticle | null> {
  const one = await apiGetOne<Record<string, unknown>>("/api/support_articles", { slug });
  if (one) {
    const article = {
      id: String(one.id),
      slug: String(one.slug),
      title: String(one.title),
      excerpt: (one.excerpt as string | null) ?? null,
      body: (one.body as string | null) ?? (one.body_md as string | null) ?? null,
      category_id: (one.category_id as string | null) ?? null,
      published: one.published === undefined ? true : truthy(one.published),
      sort_order: one.sort_order != null ? Number(one.sort_order) : 0,
    };
    return article.published ? article : null;
  }
  return (await getSupportArticles()).find((a) => a.slug === slug) ?? null;
}

export async function getJobs(): Promise<Job[]> {
  const rows = await apiGet<unknown[]>("/api/jobs");
  return asRows(rows) as unknown as Job[];
}

export async function getJobsSettings(): Promise<{ intro?: string; form_url?: string } | null> {
  const row = await apiGetOne<{ key?: string; value?: { intro?: string; form_url?: string } }>("/api/site_settings", {
    key: "jobs",
  });
  if (row?.value) return row.value;
  const rows = await apiGet<{ key: string; value: { intro?: string; form_url?: string } }[]>("/api/site_settings");
  const jobs = Array.isArray(rows) ? rows.find((r) => r.key === "jobs") : null;
  return jobs?.value ?? null;
}

export async function getLauncherVersions(): Promise<LauncherVersion[]> {
  const rows = await apiGet<unknown[]>("/api/launcher_versions");
  return asRows(rows)
    .map((r) => ({
      id: String(r.id),
      version: String(r.version),
      channel: String(r.channel ?? "stable"),
      notes: (r.notes as string | null) ?? null,
      published_at: (r.published_at as string | null) ?? null,
      published: r.published === undefined ? true : truthy(r.published),
    }))
    .filter((v) => v.published)
    .sort((a, b) => {
      const ta = a.published_at ? Date.parse(a.published_at) : 0;
      const tb = b.published_at ? Date.parse(b.published_at) : 0;
      return tb - ta;
    });
}

export async function getStats(): Promise<{ players?: number; cosmetics?: number; posts?: number }> {
  try {
    return await apiGet("/api/stats");
  } catch {
    return {};
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  return apiPost<AuthSession>("/api/auth/login", { email, password });
}

export async function verifyBetaToken(email: string, token: string): Promise<boolean> {
  try {
    await apiPost("/api/beta/verify", { email, token });
    return true;
  } catch {
    return false;
  }
}

export async function requestBetaDownload(body: {
  email: string;
  token: string;
  version: string;
  platform: string;
}): Promise<{ url: string; expires_in?: number }> {
  return apiPost("/api/beta/download", body);
}

export async function createTicket(body: {
  subject: string;
  body: string;
  priority: string;
  category: string;
  user_id?: string;
}): Promise<Ticket> {
  return apiPost<Ticket>("/api/tickets", { ...body, status: "open" });
}

export async function getTickets(userId: string): Promise<Ticket[]> {
  return apiGet<Ticket[]>("/api/tickets", { user_id: userId });
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  return apiGet<TicketMessage[]>("/api/ticket_messages", { ticket_id: ticketId });
}

export async function postTicketMessage(body: {
  ticket_id: string;
  author_id: string;
  body: string;
  is_staff: boolean;
}): Promise<TicketMessage> {
  return apiPost<TicketMessage>("/api/ticket_messages", body);
}

export async function updateTicket(id: string, patch: Partial<Ticket>): Promise<void> {
  await apiPost("/api/tickets/update", { id, ...patch });
}

export async function createStoreOrder(body: {
  user_id?: string | null;
  product_id: string;
  mc_username: string;
  mc_uuid: string | null;
  amount_cents: number;
  currency: string;
  status: string;
}): Promise<void> {
  await apiPost("/api/orders", body);
}
