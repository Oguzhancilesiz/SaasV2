import { api } from "./api";

export type RoleDto = {
  id: string;
  name: string;
  status: number;
  cratedDate: string; // Typo in backend DTO
};

export type RoleAddDto = {
  name: string;
};

export async function getAllRoles(): Promise<RoleDto[]> {
  return api<RoleDto[]>("/roles");
}

export async function getRoleById(id: string): Promise<RoleDto> {
  return api<RoleDto>(`/roles/${id}`);
}

export async function createRole(data: RoleAddDto): Promise<void> {
  return api<void>("/roles", {
    method: "POST",
    json: data,
  });
}

export async function renameRole(id: string, newName: string): Promise<void> {
  return api<void>(`/roles/${id}/rename`, {
    method: "PUT",
    json: { newName },
  });
}

export async function restoreRole(id: string): Promise<void> {
  return api<void>(`/roles/${id}/restore`, {
    method: "POST",
  });
}

export async function deleteRole(id: string): Promise<void> {
  return api<void>(`/roles/${id}`, {
    method: "DELETE",
  });
}

