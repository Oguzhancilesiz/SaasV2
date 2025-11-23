import { Status } from "./app";

export type SubscriptionItemDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  subscriptionId: string;
  featureId: string;
  allotted: number | null;
  used: number;
  resetsAt: string | null;
};

export type SubscriptionItemWithFeatureDto = SubscriptionItemDto & {
  featureName: string;
  featureKey: string;
  featureUnit: string;
};

