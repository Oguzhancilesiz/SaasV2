// src/lib/api.ts
import { getApiBaseUrl } from "@/lib/config";

type Options = RequestInit & { json?: unknown };

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const normalizePath = (path: string): string => {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;

  // Eğer zaten /api ile başlıyorsa olduğu gibi döndür
  if (withLeadingSlash === "/api" || withLeadingSlash.startsWith("/api/")) {
    return withLeadingSlash;
  }

  // Diğer tüm path'lere /api prefix'i ekle
  return `/api${withLeadingSlash}`;
};

const getApiUrl = (path: string): string => {
  const normalizedPath = normalizePath(path);

  if (isAbsoluteUrl(normalizedPath)) {
    return normalizedPath;
  }

  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${normalizedPath}`;
};

const buildServerCookieHeader = async (): Promise<string | undefined> => {
  if (typeof window !== "undefined") {
    return undefined;
  }

  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const all = store.getAll();
    
    if (process.env.NODE_ENV === "development") {
      console.log("[API] Cookies found:", all.length, "cookies:", all.map(c => c.name).join(", "));
    }
    
    if (all.length === 0) {
      return undefined;
    }

    // Cookie değerleri zaten encode edilmiş olabilir, bu yüzden encodeURIComponent kullanmıyoruz
    // ASP.NET Core cookie authentication, cookie'leri doğrudan okur
    const cookieHeader = all.map((c) => `${c.name}=${c.value}`).join("; ");
    
    if (process.env.NODE_ENV === "development") {
      const authCookie = all.find(c => c.name.includes("AdminAuth") || c.name.includes("Identity"));
      if (authCookie) {
        console.log("[API] Auth cookie found:", authCookie.name);
      } else {
        console.warn("[API] No auth cookie found in", all.map(c => c.name).join(", "));
      }
    }
    
    return cookieHeader;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[API] Unable to read cookies() on the server request context:", error);
    }
    return undefined;
  }
};

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const url = getApiUrl(path);
  
  // Debug: Development'ta URL'yi logla
  if (process.env.NODE_ENV === 'development') {
    console.log('[API] Request:', opts.method || 'GET', url);
  }
  
  const headers = new Headers({ "Content-Type": "application/json", ...(opts.headers || {}) });

  if (!headers.has("Cookie")) {
    const cookieHeader = await buildServerCookieHeader();
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Cookie header set:', cookieHeader.substring(0, 100) + '...');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[API] No cookie header found for request:', url);
      }
    }
  }

  const init: RequestInit = { 
    ...opts, 
    headers,
    credentials: opts.credentials ?? "include",
  };
  if (opts.json !== undefined && !opts.body) init.body = JSON.stringify(opts.json);

  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Error:', res.status, res.statusText, url, text.substring(0, 200));
      }
      throw new Error(`API ${res.status} ${res.statusText}\n${text}`);
    }
    
    // Response body'yi bir kez oku
    const text = await res.text();
    
    // 204 No Content durumu için undefined döndür
    if (res.status === 204) {
      return undefined as unknown as T;
    }
    
    // Boş body kontrolü
    if (!text || text.trim() === "") {
      // 201 Created için boş body normal
      if (res.status === 201) {
        return undefined as unknown as T;
      }
      // Diğer durumlar için de boş body olabilir
      return undefined as unknown as T;
    }
    
    // JSON parse et
    try {
      return JSON.parse(text) as T;
    } catch (_error) {
      // JSON parse edilemezse, boş body olarak kabul et
      if (res.status === 201 || res.status === 204) {
        return undefined as unknown as T;
      }
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (err) {
    throw err;
  }
}
