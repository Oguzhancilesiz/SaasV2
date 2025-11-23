import { api } from './api';

export interface PlanPrice {
  id: string;
  planId: string;
  currency: number; // CurrencyCode enum
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isCurrent: boolean;
  status: number;
}

export const planPriceService = {
  // Get all plan prices (optionally filtered by planId)
  getAll: async (planId?: string) => {
    const params = new URLSearchParams();
    if (planId) params.append('planId', planId);
    
    const query = params.toString();
    return api.get<PlanPrice[]>(`/plan-prices${query ? `?${query}` : ''}`);
  },

  // Get plan price by ID
  getById: async (id: string) => {
    return api.get<PlanPrice>(`/plan-prices/${id}`);
  },

  // Get current price for a plan
  getCurrentPrice: async (planId: string): Promise<PlanPrice | null> => {
    const response = await planPriceService.getAll(planId)
    if (response.error || !response.data) {
      return null
    }
    
    const now = new Date()
    // Aktif ve current olan, geçerli tarih aralığında olan fiyatı bul
    const currentPrice = response.data
      .filter(price => 
        price.isCurrent && 
        price.status === 1 && // Active
        new Date(price.effectiveFrom) <= now &&
        (!price.effectiveTo || new Date(price.effectiveTo) >= now)
      )
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0]
    
    return currentPrice || null
  },
};

