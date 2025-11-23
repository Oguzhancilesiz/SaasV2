import { api } from './api';
import type { UsageRecord, UsageRecordAdd } from '../types/usageRecord';

export const usageRecordService = {
  // Get all usage records (optionally filtered)
  getAll: async (appId?: string, userId?: string, featureId?: string) => {
    const params = new URLSearchParams();
    if (appId) params.append('appId', appId);
    if (userId) params.append('userId', userId);
    if (featureId) params.append('featureId', featureId);
    
    const query = params.toString();
    return api.get<UsageRecord[]>(`/usage-records${query ? `?${query}` : ''}`);
  },

  // Get usage record by ID
  getById: async (id: string) => {
    return api.get<UsageRecord>(`/usage-records/${id}`);
  },

  // Get recent usage records
  getRecent: async (appId: string, userId: string, take: number = 100) => {
    return api.get<UsageRecord[]>(`/usage-records/recent/${appId}/${userId}?take=${take}`);
  },

  // Create usage record
  create: async (data: UsageRecordAdd) => {
    return api.post<UsageRecord>('/usage-records', data);
  },
};

