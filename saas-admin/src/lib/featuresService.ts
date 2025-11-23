import { api } from "./api";
import type { FeatureDto } from "@/types/feature";

export async function getAllFeatures(): Promise<FeatureDto[]> {
  try {
    return await api<FeatureDto[]>("/features");
  } catch {
    return [];
  }
}

export async function getFeatureById(id: string): Promise<FeatureDto> {
  return api<FeatureDto>(`/features/${id}`);
}

export async function getFeaturesByApp(appId: string): Promise<FeatureDto[]> {
  try {
    return await api<FeatureDto[]>(`/features/by-app/${appId}`);
  } catch {
    return [];
  }
}

export async function createFeature(data: {
  appId: string;
  key: string;
  name: string;
  unit: string;
  description?: string;
}): Promise<void> {
  await api("/features", {
    method: "POST",
    json: data,
  });
}

export type FeatureUpdateDto = {
  id: string;
  appId: string;
  key: string;
  name: string;
  unit: string;
  description: string;
};

export async function updateFeature(id: string, data: FeatureUpdateDto): Promise<void> {
  return api<void>(`/features/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deleteFeature(id: string): Promise<void> {
  return api<void>(`/features/${id}`, {
    method: "DELETE",
  });
}

