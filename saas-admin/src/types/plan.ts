import { Status, BillingPeriod } from "./app";

export enum RenewalPolicy {
  None = 0,
  Manual = 1,
  Auto = 2,
}

export type PlanDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  name: string;
  code: string;
  description: string | null;
  isPublic: boolean;
  isFree: boolean;
  trialDays: number;
  billingPeriod: BillingPeriod;
  renewalPolicy: RenewalPolicy;
};

export type PlanAddDto = {
  appId: string;
  name: string;
  code: string;
  description?: string | null;
  isPublic?: boolean;
  isFree?: boolean;
  trialDays?: number;
  billingPeriod?: BillingPeriod;
  renewalPolicy?: RenewalPolicy;
};

export type PlanUpdateDto = {
  id: string;
  appId: string;
  name: string;
  code: string;
  description?: string | null;
  isPublic: boolean;
  isFree: boolean;
  trialDays: number;
  billingPeriod: BillingPeriod;
  renewalPolicy: RenewalPolicy;
};

