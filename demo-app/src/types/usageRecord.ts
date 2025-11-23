// Usage Record Types
export interface UsageRecord {
  id: string;
  appId: string;
  userId: string;
  featureId: string;
  quantity: number;
  recordedAt: string;
  correlationId: string;
  metadataJson: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
}

export interface UsageRecordAdd {
  appId: string;
  userId: string;
  featureId: string;
  quantity: number;
  recordedAt?: string;
  correlationId: string;
  metadataJson: string;
}

