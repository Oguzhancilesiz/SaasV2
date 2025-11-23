import { api } from './api';

export interface LoginRequest {
  userName: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  userName: string;
  password: string;
  email: string;
  phone?: string;
}

export interface SendCodeRequest {
  userName: string;
  email: string;
  password: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
  userName: string;
  password: string;
}

export interface AuthUserResponse {
  userId: string;
  userName: string;
  email?: string;
  roles: string[];
}

// Auth service - Note: Auth endpoints don't require API key
async function authApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const { API_CONFIG } = await import('../config/api');
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const status = response.status;

    // Response body'yi bir kere oku (text olarak)
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP ${status}`;
      // Text'i JSON'a parse etmeye çalış
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // JSON değilse text olarak kullan
          errorMessage = responseText || errorMessage;
        }
      }
      return {
        status,
        error: errorMessage,
      };
    }

    // 204 No Content
    if (status === 204) {
      return { status, data: undefined as T };
    }

    // Response text'i JSON'a parse et
    let data: T;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        // JSON değilse, text'i data olarak kullan (eğer T string ise)
        data = responseText as unknown as T;
      }
    } else {
      data = undefined as unknown as T;
    }

    return { status, data };
  } catch (error) {
    return {
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export const authService = {
  // Login
  login: async (request: LoginRequest) => {
    return authApiCall<AuthUserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Send verification code
  sendVerificationCode: async (request: SendCodeRequest) => {
    return authApiCall<{ message: string }>('/auth/register/send-code', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Verify code and complete registration
  verifyCode: async (request: VerifyCodeRequest) => {
    return authApiCall<{ message: string; userId?: string; userName?: string; email?: string }>('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Register - Legacy endpoint (deprecated)
  register: async (request: RegisterRequest) => {
    return authApiCall<AuthUserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Logout
  logout: async () => {
    return authApiCall('/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return authApiCall<AuthUserResponse>('/auth/me');
  },

  // Health check
  health: async () => {
    return authApiCall<{ status: string; message: string; timestamp: string }>('/auth/health');
  },
};

