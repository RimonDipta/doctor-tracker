import "server-only";

import { cookies } from "next/headers";
import type { Admin } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** Server-side session check. Resolves to null for a missing or expired session. */
export async function getCurrentAdmin(): Promise<Admin | null> {
  const store = await cookies();
  const session = store.get("dt_session");
  if (!session) return null;

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { cookie: `dt_session=${session.value}` },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session check failed with ${response.status}`);
  return (await response.json()).data as Admin;
}
