"use server";

import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AppDashboardSummary } from "@/types/app";

// Durum değiştir
export async function toggleAppStatus(id: string, currentStatus: number) {
  const nextStatus = currentStatus === 1 ? 0 : 1;
  await api<void>(`/apps/${id}`, {
    method: "PUT",
    json: { id, status: nextStatus },
  });
  revalidatePath("/apps");
}

// Sil
export async function deleteApp(id: string) {
  await api<void>(`/apps/${id}`, { method: "DELETE" });
  revalidatePath("/apps");
}

// Tek uygulama dashboard verisi
export async function getAppDashboard(id: string) {
  // api/apps/{id}/dashboard
  return await api<AppDashboardSummary>(`/apps/${id}/dashboard`, { cache: "no-store" });
}

// Batch dashboard (ileride grid-virtualize falan yaparsan)
export async function getAppDashboardsBatch(ids: string[]) {
  return await api(`/apps/dashboard/batch`, {
    method: "POST",
    json: { ids },
    cache: "no-store",
  });
}

// Provision (Yeni Uygulama sihirbazında kullanacağız)
export async function provisionApp(json: unknown) {
  const res = await api(`/apps/provision`, { method: "POST", json });
  revalidatePath("/apps");
  redirect("/apps?ok=provisioned");
  return res;
}
