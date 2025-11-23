import { api } from './api';
import type { AppUserRegistration, AppUserRegistrationAdd } from '../types/appUserRegistration';

export const appUserRegistrationService = {
  // Get all registrations (optionally filtered)
  getAll: async (appId?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (appId) params.append('appId', appId);
    if (userId) params.append('userId', userId);
    
    const query = params.toString();
    return api.get<AppUserRegistration[]>(`/app-user-registrations${query ? `?${query}` : ''}`);
  },

  // Get registration by ID
  getById: async (id: string) => {
    return api.get<AppUserRegistration>(`/app-user-registrations/${id}`);
  },

  // Create or ensure registration exists
  create: async (data: AppUserRegistrationAdd) => {
    return api.post<AppUserRegistration>('/app-user-registrations', data);
  },
};

