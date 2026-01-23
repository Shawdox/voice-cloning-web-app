import type {
  LoginResponse,
  UserProfile,
  PointsBalanceResponse,
  TransactionsResponse,
  VIPStatusResponse,
  RechargeOrderResponse,
  OrderStatusResponse,
  SuccessResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to make authenticated requests
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new APIError(response.status, errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Authentication APIs
export const authAPI = {
  async login(loginId: string, password: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    });
  },

  async loginWithSMS(phone: string, smsCode: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/auth/login/sms', {
      method: 'POST',
      body: JSON.stringify({ phone, smsCode }),
    });
  },

  async register(
    email: string,
    password: string,
    phone?: string,
    smsCode?: string,
    nickname?: string
  ): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, phone, smsCode, nickname }),
    });
  },

  async sendSMS(phone: string): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>('/auth/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
};

// User Profile APIs
export const userAPI = {
  async getProfile(): Promise<UserProfile> {
    return fetchAPI<UserProfile>('/profile');
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>('/profile/password', {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },
};

// Points/Credits APIs
export const pointsAPI = {
  async getBalance(): Promise<PointsBalanceResponse> {
    return fetchAPI<PointsBalanceResponse>('/credits/balance');
  },

  async getTransactions(): Promise<TransactionsResponse> {
    return fetchAPI<TransactionsResponse>('/credits/transactions');
  },

  async createRechargeOrder(points: number, paymentType: string): Promise<RechargeOrderResponse> {
    return fetchAPI<RechargeOrderResponse>('/credits/recharge', {
      method: 'POST',
      body: JSON.stringify({ points, paymentType }),
    });
  },

  async checkOrderStatus(orderNo: string): Promise<OrderStatusResponse> {
    return fetchAPI<OrderStatusResponse>(`/credits/orders/${orderNo}`);
  },
};

// VIP APIs
export const vipAPI = {
  async getStatus(): Promise<VIPStatusResponse> {
    return fetchAPI<VIPStatusResponse>('/vip/status');
  },

  async upgrade(level: number, months: number, paymentType: string): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>('/vip/upgrade', {
      method: 'POST',
      body: JSON.stringify({ level, months, paymentType }),
    });
  },
};

// Export all APIs
export const api = {
  auth: authAPI,
  user: userAPI,
  points: pointsAPI,
  vip: vipAPI,
};

export { APIError };
