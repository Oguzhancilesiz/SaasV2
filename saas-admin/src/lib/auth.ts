import { cookies } from "next/headers";
import type { AuthUser } from "@/types/auth";
import { getApiBaseUrl } from "@/lib/config";

const API_BASE_URL = getApiBaseUrl();

const buildCookieHeader = async () => {
  const store = await cookies();
  const all = store.getAll();
  if (all.length === 0) {
    return "";
  }

  return all.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieHeader = await buildCookieHeader();

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      console.error("Auth check failed:", response.status, await response.text().catch(() => ""));
      return null;
    }

    const data = (await response.json()) as AuthUser | null;
    return data ?? null;
  } catch (error) {
    console.error("Auth check error:", error);
    return null;
  }
}

