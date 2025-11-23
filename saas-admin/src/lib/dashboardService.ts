import { api } from "./api";
import type { GlobalDashboardDto, UserDashboardDto, AppDashboardDto } from "@/types/dashboard";

export async function getGlobalDashboard(): Promise<GlobalDashboardDto> {
  return api<GlobalDashboardDto>("/dashboard/global");
}

export async function getUserDashboard(userId: string): Promise<UserDashboardDto> {
  return api<UserDashboardDto>(`/dashboard/user/${userId}`);
}

export async function getUserDashboardByEmail(email: string): Promise<UserDashboardDto> {
  return api<UserDashboardDto>(`/dashboard/user/by-email/${encodeURIComponent(email)}`);
}

export async function getAppDashboard(appId: string): Promise<AppDashboardDto> {
  return api<AppDashboardDto>(`/dashboard/app/${appId}`);
}

