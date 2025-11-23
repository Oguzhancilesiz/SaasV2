import { Status } from "./app";

export type ApiKeyDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  name: string;
  prefix: string;
  hash: string;
  scopes: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

export type ApiKeyAddDto = {
  appId: string;
  name: string;
  prefix: string;
  hash?: string;
  scopes?: string;
  expiresAt?: string | null;
};

export type ApiKeyUpdateDto = {
  id: string;
  name: string;
  scopes: string;
  expiresAt?: string | null;
};

