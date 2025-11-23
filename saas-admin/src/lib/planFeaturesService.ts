import { api } from "./api";

export type PlanFeatureDto = {
  id: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  planId: string;
  featureId: string;
  limit: number | null;
  resetInterval: number;
  allowOverage: boolean;
  overusePrice: number | null;
};

export type PlanFeatureAddDto = {
  planId: string;
  featureId: string;
  limit?: number | null;
  resetInterval?: number;
  allowOverage?: boolean;
  overusePrice?: number | null;
};

export type PlanFeatureUpdateDto = {
  id: string;
  planId: string;
  featureId: string;
  limit?: number | null;
  resetInterval: number;
  allowOverage: boolean;
  overusePrice?: number | null;
};

export async function getAllPlanFeatures(planId?: string, featureId?: string): Promise<PlanFeatureDto[]> {
  const params = new URLSearchParams();
  if (planId) params.set("planId", planId);
  if (featureId) params.set("featureId", featureId);
  const queryString = params.toString();
  return api<PlanFeatureDto[]>(`/plan-features${queryString ? `?${queryString}` : ""}`);
}

export async function getPlanFeatureById(id: string): Promise<PlanFeatureDto> {
  return api<PlanFeatureDto>(`/plan-features/${id}`);
}

export async function createPlanFeature(data: PlanFeatureAddDto): Promise<void> {
  await api("/plan-features", {
    method: "POST",
    json: data,
  });
}

export async function updatePlanFeature(id: string, data: PlanFeatureUpdateDto): Promise<void> {
  return api<void>(`/plan-features/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deletePlanFeature(id: string): Promise<void> {
  return api<void>(`/plan-features/${id}`, {
    method: "DELETE",
  });
}

