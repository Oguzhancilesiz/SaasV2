import { Status } from "./app";

export type ActivityLogDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  appId: string | null;
  appName: string | null;
  appCode: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
};

