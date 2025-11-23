import { api } from "./api";

export type RoleClaimDto = {
  id?: number;
  roleId: string;
  claimType: string;
  claimValue: string;
};

export type RoleClaimAddDto = {
  roleId: string;
  claimType: string;
  claimValue: string;
};

export async function getRoleClaims(roleId: string): Promise<RoleClaimDto[]> {
  return api<RoleClaimDto[]>(`/role-claims/role/${roleId}`);
}

export async function createRoleClaim(data: RoleClaimAddDto): Promise<void> {
  return api<void>("/role-claims", {
    method: "POST",
    json: data,
  });
}

export async function deleteRoleClaim(roleId: string, claimType: string, claimValue: string): Promise<void> {
  return api<void>(`/role-claims/role/${roleId}?claimType=${encodeURIComponent(claimType)}&claimValue=${encodeURIComponent(claimValue)}`, {
    method: "DELETE",
  });
}

