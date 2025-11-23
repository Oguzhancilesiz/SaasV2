// Global search service
import { api } from "./api";
import { getFilteredApps } from "./appsService";

export type SearchResult = {
  id: string;
  type: "app" | "plan" | "user" | "subscription";
  title: string;
  subtitle?: string;
  url: string;
  icon?: string;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
};

/**
 * Global arama - tüm entity'lerde arama yapar
 */
export async function globalSearch(query: string, limit: number = 10): Promise<SearchResponse> {
  if (!query || query.trim().length < 2) {
    return { results: [], total: 0 };
  }

  const trimmedQuery = query.trim();
  const results: SearchResult[] = [];

  try {
    // Apps arama
    const appsResponse = await getFilteredApps({
      searchQuery: trimmedQuery,
      page: 1,
      pageSize: limit,
    });

    appsResponse.items.forEach((app) => {
      results.push({
        id: app.id,
        type: "app",
        title: app.name,
        subtitle: app.code,
        url: `/apps/${app.id}`,
        icon: "AppWindow",
      });
    });
  } catch {
    // Silently handle error
  }

  // TODO: Plans, Users, Subscriptions için arama eklenebilir
  // Şimdilik sadece Apps araması yapılıyor

  return {
    results,
    total: results.length,
  };
}

