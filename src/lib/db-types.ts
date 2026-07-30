export interface NewsPost {
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
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
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
  created_at: string;
  updated_at: string;
}

export interface LauncherAnnouncement {
  id: number;
  announcement: string;
  redirect_url: string | null;
  is_active: number;
  published_at: string;
}

export interface LauncherVersion {
  id: string;
  version: string;
  channel: string;
  download_url: string | null;
  notes: string | null;
  published: number;
  published_at: string | null;
}
