import { api } from "./api";
import type { PlanDto, PlanAddDto, PlanUpdateDto } from "@/types/plan";

export async function getAllPlans(appId?: string): Promise<PlanDto[]> {
  const params = appId ? `?appId=${appId}` : "";
  return api<PlanDto[]>(`/plans${params}`);
}

export async function getPlanById(id: string): Promise<PlanDto> {
  return api<PlanDto>(`/plans/${id}`);
}

export async function getPlanByCode(appId: string, code: string): Promise<PlanDto> {
  return api<PlanDto>(`/plans/by-code/${appId}/${encodeURIComponent(code)}`);
}

export async function createPlan(data: PlanAddDto): Promise<PlanDto> {
  return api<PlanDto>("/plans", {
    method: "POST",
    json: data,
  });
}

export async function updatePlan(id: string, data: PlanUpdateDto): Promise<void> {
  return api<void>(`/plans/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deletePlan(id: string): Promise<void> {
  return api<void>(`/plans/${id}`, {
    method: "DELETE",
  });
}

export async function togglePlanVisibility(id: string, isPublic: boolean): Promise<void> {
  return api<void>(`/plans/${id}/toggle-visibility`, {
    method: "PATCH",
    json: isPublic,
  });
}

export async function setPlanFree(id: string, isFree: boolean): Promise<void> {
  return api<void>(`/plans/${id}/set-free`, {
    method: "PATCH",
    json: isFree,
  });
}

