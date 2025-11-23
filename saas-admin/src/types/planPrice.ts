import { Status, CurrencyCode } from "./app";

export type PlanPriceDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  planId: string;
  currency: CurrencyCode;
  amount: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isCurrent: boolean;
};

export type PlanPriceAddDto = {
  planId: string;
  currency: CurrencyCode;
  amount: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isCurrent?: boolean;
};

export type PlanPriceUpdateDto = {
  id: string;
  planId: string;
  currency: CurrencyCode;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isCurrent: boolean;
};

