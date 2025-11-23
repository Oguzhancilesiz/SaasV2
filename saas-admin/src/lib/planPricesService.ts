import { api } from "./api";
import type { PlanPriceDto, PlanPriceAddDto, PlanPriceUpdateDto } from "@/types/planPrice";

export async function getAllPlanPrices(planId?: string): Promise<PlanPriceDto[]> {
  const params = planId ? `?planId=${planId}` : "";
  return api<PlanPriceDto[]>(`/plan-prices${params}`);
}

export async function getPlanPriceById(id: string): Promise<PlanPriceDto> {
  return api<PlanPriceDto>(`/plan-prices/${id}`);
}

export async function createPlanPrice(data: PlanPriceAddDto): Promise<PlanPriceDto> {
  return api<PlanPriceDto>("/plan-prices", {
    method: "POST",
    json: data,
  });
}

export async function updatePlanPrice(id: string, data: PlanPriceUpdateDto): Promise<void> {
  return api<void>(`/plan-prices/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deletePlanPrice(id: string): Promise<void> {
  return api<void>(`/plan-prices/${id}`, {
    method: "DELETE",
  });
}

