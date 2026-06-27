import { useEffect, useState } from "react";
import type { AuthSession } from "@/lib/api";
import { login as apiLogin } from "@/lib/api";

const SESSION_KEY = "comet_session";

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setLoading(false);
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}

export async function signIn(email: string, password: string) {
  const session = await apiLogin(email, password);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function useRoles(_userId?: string) {
  return { roles: [] as string[], loading: false, isStaff: false, isAdmin: false };
}
