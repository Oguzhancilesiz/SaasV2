import { api } from "./api";
import type { ActivityLogDto } from "@/types/activityLog";

export async function getAllActivityLogs(): Promise<ActivityLogDto[]> {
  try {
    return await api<ActivityLogDto[]>("/activity-logs");
  } catch {
    return [];
  }
}

export async function getActivityLogById(id: string): Promise<ActivityLogDto> {
  return api<ActivityLogDto>(`/activity-logs/${id}`);
}

export async function getActivityLogsByUser(userId: string): Promise<ActivityLogDto[]> {
  try {
    return await api<ActivityLogDto[]>(`/activity-logs/by-user/${userId}`);
  } catch {
    return [];
  }
}

export async function getActivityLogsByApp(appId: string): Promise<ActivityLogDto[]> {
  try {
    return await api<ActivityLogDto[]>(`/activity-logs/by-app/${appId}`);
  } catch {
    return [];
  }
}

export async function getActivityLogsByEntity(entityType: string, entityId?: string): Promise<ActivityLogDto[]> {
  try {
    const params = entityId ? `?entityId=${entityId}` : "";
    return await api<ActivityLogDto[]>(`/activity-logs/by-entity/${entityType}${params}`);
  } catch {
    return [];
  }
}

export async function getActivityLogsByAction(action: string): Promise<ActivityLogDto[]> {
  try {
    return await api<ActivityLogDto[]>(`/activity-logs/by-action/${action}`);
  } catch {
    return [];
  }
}

export async function getRecentActivityLogs(take: number = 100): Promise<ActivityLogDto[]> {
  try {
    return await api<ActivityLogDto[]>(`/activity-logs/recent?take=${take}`);
  } catch {
    return [];
  }
}

