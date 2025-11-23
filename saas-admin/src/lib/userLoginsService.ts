import { api } from "./api";

export type UserLoginDto = {
  loginProvider: string;
  providerKey: string;
  providerDisplayName?: string | null;
  userId: string;
};

export async function getUserLogins(userId: string): Promise<UserLoginDto[]> {
  return api<UserLoginDto[]>(`/user-logins/user/${userId}`);
}

export async function deleteUserLogin(userId: string, loginProvider: string, providerKey: string): Promise<void> {
  return api<void>(`/user-logins/user/${userId}?loginProvider=${encodeURIComponent(loginProvider)}&providerKey=${encodeURIComponent(providerKey)}`, {
    method: "DELETE",
  });
}

