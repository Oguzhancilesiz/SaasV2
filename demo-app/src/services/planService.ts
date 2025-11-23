import { api } from './api';

export interface Plan {
  id: string;
  appId: string;
  name: string;
  code: string;
  description?: string;
  isPublic: boolean;
  isFree: boolean;
  trialDays: number;
  billingPeriod: number; // BillingPeriod enum
  renewalPolicy: number; // RenewalPolicy enum
  status: number;
  createdDate: string;
  modifiedDate: string;
  price?: {
    amount: number;
    currency: string;
  };
}

export interface PlanPrice {
  id: string;
  planId: string;
  currency: string;
  amount: number;
  isCurrent: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export const planService = {
  // Get all plans (optionally filtered by appId)
  getAll: async (appId?: string) => {
    const params = new URLSearchParams();
    if (appId) params.append('appId', appId);
    
    const query = params.toString();
    return api.get<Plan[]>(`/plans${query ? `?${query}` : ''}`);
  },

  // Get plan by ID
  getById: async (id: string) => {
    return api.get<Plan>(`/plans/${id}`);
  },

  // Get plan by code
  getByCode: async (appId: string, code: string) => {
    return api.get<Plan>(`/plans/by-code/${appId}/${code}`);
  },
};

