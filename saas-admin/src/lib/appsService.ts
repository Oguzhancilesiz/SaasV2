// src/lib/appsService.ts
// AppsController'daki tüm metodları kullanmak için TypeScript service fonksiyonları

import { api } from "./api";
import type {
  AppDto,
  AppAddDto,
  AppUpdateDto,
  AppDashboardSummary,
  AppProvisionRequest,
  AppProvisionResult,
  DashboardBatchRequest,
  AppFilterRequest,
  AppFilterResponse,
} from "@/types/app";

/**
 * Tüm uygulamaları getir
 * GET /api/apps
 */
export async function getAllApps(): Promise<AppDto[]> {
  return api<AppDto[]>("/apps");
}

/**
 * Filtrelenmiş ve sayfalanmış uygulamaları getir
 * GET /apps/filtered
 */
export async function getFilteredApps(request: AppFilterRequest): Promise<AppFilterResponse> {
  const params = new URLSearchParams();
  if (request.searchQuery) params.set("searchQuery", request.searchQuery);
  if (request.status) params.set("status", request.status);
  if (request.sort) params.set("sort", request.sort);
  params.set("page", String(request.page || 1));
  params.set("pageSize", String(request.pageSize || 10));

  const queryString = params.toString();
  // Backend route: api/apps/filtered (API_BASE_URL zaten base URL'i içeriyor)
  return api<AppFilterResponse>(`/apps/filtered?${queryString}`);
}

/**
 * ID ile uygulama getir
 * GET /api/apps/{id}
 */
export async function getAppById(id: string): Promise<AppDto> {
  return api<AppDto>(`/apps/${id}`);
}

/**
 * Kod ile uygulama getir
 * GET /api/apps/by-code/{code}
 */
export async function getAppByCode(code: string): Promise<AppDto> {
  return api<AppDto>(`/apps/by-code/${encodeURIComponent(code)}`);
}

/**
 * Yeni uygulama oluştur
 * POST /api/apps
 */
export async function createApp(data: AppAddDto): Promise<AppDto> {
  return api<AppDto>("/apps", {
    method: "POST",
    json: data,
  });
}

/**
 * Uygulama güncelle
 * PUT /api/apps/{id}
 */
export async function updateApp(id: string, data: AppUpdateDto): Promise<void> {
  return api<void>(`/apps/${id}`, {
    method: "PUT",
    json: { ...data, id }, // Route id'yi de body'ye ekliyoruz
  });
}

/**
 * Uygulama sil (soft delete)
 * DELETE /api/apps/{id}
 */
export async function deleteApp(id: string): Promise<void> {
  return api<void>(`/apps/${id}`, {
    method: "DELETE",
  });
}

/**
 * Uygulama dashboard özetini getir
 * GET /api/apps/{id}/dashboard
 */
export async function getAppDashboard(id: string): Promise<AppDashboardSummary> {
  return api<AppDashboardSummary>(`/apps/${id}/dashboard`);
}

/**
 * Toplu dashboard özetleri getir
 * POST /api/apps/dashboard/batch
 */
export async function getAppDashboardsBatch(
  ids: string[]
): Promise<AppDashboardSummary[]> {
  const request: DashboardBatchRequest = { ids };
  return api<AppDashboardSummary[]>("/apps/dashboard/batch", {
    method: "POST",
    json: request,
  });
}

/**
 * Uygulama sağlama (provision) - Yeni uygulama, planlar, API key ve webhook oluşturma
 * POST /api/apps/provision
 */
export async function provisionApp(
  data: AppProvisionRequest
): Promise<AppProvisionResult> {
  return api<AppProvisionResult>("/apps/provision", {
    method: "POST",
    json: data,
  });
}
