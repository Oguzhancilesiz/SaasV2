import { api } from "./api";

export type AppSettingDto = {
  id: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  key: string;
  value: string;
  description?: string | null;
  category: string;
};

export type AppSettingsBatchUpdate = {
  category: string;
  settings: Record<string, string>;
};

export async function getAllSettings(): Promise<AppSettingDto[]> {
  try {
    return await api<AppSettingDto[]>("/settings");
  } catch {
    return [];
  }
}

export async function getSettingsByCategory(category: string): Promise<AppSettingDto[]> {
  try {
    return await api<AppSettingDto[]>(`/settings/category/${category}`);
  } catch {
    return [];
  }
}

export async function getSettingByKey(key: string): Promise<AppSettingDto | null> {
  try {
    return await api<AppSettingDto>(`/settings/key/${key}`);
  } catch {
    return null;
  }
}

export async function updateSetting(key: string, value: string): Promise<void> {
  return api<void>(`/settings/key/${key}`, {
    method: "PUT",
    json: value,
  });
}

export async function updateSettingsBatch(category: string, settings: Record<string, string>): Promise<void> {
  return api<void>("/settings/batch", {
    method: "PUT",
    json: { category, settings } as AppSettingsBatchUpdate,
  });
}

export async function getConnectionStringMasked(): Promise<string> {
  return api<string>("/settings/database/connection-string");
}

export async function testDatabaseConnection(): Promise<boolean> {
  return api<boolean>("/settings/database/test");
}








