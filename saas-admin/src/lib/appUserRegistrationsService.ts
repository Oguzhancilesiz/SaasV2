import { api } from "./api";

export type AppUserRegistrationDto = {
  id: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  userId: string;
  registeredAt: string;
  provider?: string | null;
  externalId?: string | null;
};

export type AppUserRegistrationAddDto = {
  appId: string;
  userId: string;
  registeredAt?: string | null;
  provider?: string | null;
  externalId?: string | null;
};

export type AppUserRegistrationUpdateDto = {
  id: string;
  appId: string;
  userId: string;
  registeredAt: string;
  provider?: string | null;
  externalId?: string | null;
};

export async function getAllAppUserRegistrations(appId?: string, userId?: string): Promise<AppUserRegistrationDto[]> {
  const params = new URLSearchParams();
  if (appId) params.append("appId", appId);
  if (userId) params.append("userId", userId);
  const query = params.toString();
  return api<AppUserRegistrationDto[]>(`/app-user-registrations${query ? `?${query}` : ""}`);
}

export async function getAppUserRegistrationById(id: string): Promise<AppUserRegistrationDto> {
  return api<AppUserRegistrationDto>(`/app-user-registrations/${id}`);
}

export async function createAppUserRegistration(data: AppUserRegistrationAddDto): Promise<void> {
  return api<void>("/app-user-registrations", {
    method: "POST",
    json: data,
  });
}

export async function updateAppUserRegistration(id: string, data: AppUserRegistrationUpdateDto): Promise<void> {
  return api<void>(`/app-user-registrations/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deleteAppUserRegistration(id: string): Promise<void> {
  return api<void>(`/app-user-registrations/${id}`, {
    method: "DELETE",
  });
}

