import { api } from "./api";
import type { UserDto } from "@/types/user";

export async function getAllUsers(): Promise<UserDto[]> {
  return api<UserDto[]>("/users");
}

export async function getUserById(id: string): Promise<UserDto> {
  return api<UserDto>(`/users/${id}`);
}

export async function getUserByName(userName: string): Promise<UserDto> {
  return api<UserDto>(`/users/by-name/${encodeURIComponent(userName)}`);
}

export async function getUserRoles(id: string): Promise<string[]> {
  return api<string[]>(`/users/${id}/roles`);
}

export async function addUserRoles(id: string, roles: string[]): Promise<void> {
  return api<void>(`/users/${id}/roles`, {
    method: "POST",
    json: roles,
  });
}

export async function activateUser(id: string): Promise<void> {
  return api<void>(`/users/${id}/activate`, {
    method: "POST",
  });
}

export async function unapproveUser(id: string): Promise<void> {
  return api<void>(`/users/${id}/unapprove`, {
    method: "POST",
  });
}

export async function deleteUser(id: string): Promise<void> {
  return api<void>(`/users/${id}`, {
    method: "DELETE",
  });
}

