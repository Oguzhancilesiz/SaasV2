import { api } from "./api";

export type UserClaimDto = {
  id?: number;
  userId: string;
  claimType: string;
  claimValue: string;
};

export type UserClaimAddDto = {
  userId: string;
  claimType: string;
  claimValue: string;
};

export async function getUserClaims(userId: string): Promise<UserClaimDto[]> {
  return api<UserClaimDto[]>(`/user-claims/user/${userId}`);
}

export async function createUserClaim(data: UserClaimAddDto): Promise<void> {
  return api<void>("/user-claims", {
    method: "POST",
    json: data,
  });
}

export async function deleteUserClaim(userId: string, claimType: string, claimValue: string): Promise<void> {
  return api<void>(`/user-claims/user/${userId}?claimType=${encodeURIComponent(claimType)}&claimValue=${encodeURIComponent(claimValue)}`, {
    method: "DELETE",
  });
}

