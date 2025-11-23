import { api } from './api';
import type { Subscription, SubscriptionItem } from '../types/subscription';

export const subscriptionService = {
  // Get all subscriptions (optionally filtered by appId/userId)
  getAll: async (appId?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (appId) params.append('appId', appId);
    if (userId) params.append('userId', userId);
    
    const query = params.toString();
    return api.get<Subscription[]>(`/subscriptions${query ? `?${query}` : ''}`);
  },

  // Get subscription by ID
  getById: async (id: string) => {
    return api.get<Subscription>(`/subscriptions/${id}`);
  },

  // Get active subscription for app and user
  getActive: async (appId: string, userId: string) => {
    return api.get<Subscription>(`/subscriptions/active/${appId}/${userId}`);
  },

  // Get subscriptions by user
  getByUser: async (userId: string) => {
    return api.get<Subscription[]>(`/subscriptions/by-user/${userId}`);
  },

  // Get subscriptions by app
  getByApp: async (appId: string) => {
    return api.get<Subscription[]>(`/subscriptions/by-app/${appId}`);
  },

  // Get subscription items
  getItems: async (subscriptionId: string) => {
    return api.get<SubscriptionItem[]>(`/subscriptions/${subscriptionId}/items`);
  },

  // Get subscription change history
  getChanges: async (subscriptionId: string) => {
    return api.get<any[]>(`/subscriptions/${subscriptionId}/changes`);
  },

  // Create/Start a new subscription
  create: async (data: {
    appId: string;
    userId: string;
    planId: string;
    startAt?: string;
    endAt?: string;
    renewAt?: string;
    renewalPolicy?: number;
    externalPaymentRef?: string;
  }) => {
    return api.post<Subscription>('/subscriptions', {
      appId: data.appId,
      userId: data.userId,
      planId: data.planId,
      startAt: data.startAt || new Date().toISOString(),
      endAt: data.endAt,
      renewAt: data.renewAt,
      renewalPolicy: data.renewalPolicy || 0, // Auto
      externalPaymentRef: data.externalPaymentRef,
    });
  },
};

