import type {
  LoginResponse,
  UserProfile,
  PointsBalanceResponse,
  TransactionsResponse,
  VIPStatusResponse,
  RechargeOrderResponse,
  OrderStatusResponse,
  SuccessResponse,
  VoiceResponse,
  VoicesListResponse,
  PredefinedVoicesResponse,
  UploadAudioResponse,
  CreateVoiceRequest,
  TTSTaskResponse,
  TTSTasksListResponse,
  CreateTTSRequest,
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
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new APIError(response.status, errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Authentication APIs
export const authAPI = {
  async login(loginId: string, password: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login_id: loginId, password }),
    });
  },

  async loginWithSMS(phone: string, smsCode: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/auth/login/sms', {
      method: 'POST',
      body: JSON.stringify({ phone, sms_code: smsCode }),
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
      body: JSON.stringify({ email, password, phone, sms_code: smsCode, nickname }),
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

// Voice (音色) APIs
export const voiceAPI = {
  async uploadAudio(file: File): Promise<UploadAudioResponse> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch(`${API_BASE_URL}/upload/audio`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new APIError(response.status, errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async getUploadedFiles(type = 'audio'): Promise<import('../types/api').UploadedFileResponse[]> {
    return fetchAPI<import('../types/api').UploadedFileResponse[]>(`/upload/audio?type=${type}`);
  },

  async deleteUploadedFile(id: number): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>(`/upload/audio/${id}`, {
      method: 'DELETE',
    });
  },

  async create(data: CreateVoiceRequest): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>('/voices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getList(page = 1, pageSize = 20): Promise<VoicesListResponse> {
    return fetchAPI<VoicesListResponse>(`/voices?page=${page}&pageSize=${pageSize}`);
  },

  async get(id: number): Promise<VoiceResponse> {
    return fetchAPI<VoiceResponse>(`/voices/${id}`);
  },

  async getStatus(id: number): Promise<VoiceResponse> {
    return fetchAPI<VoiceResponse>(`/voices/${id}/status`);
  },

  async update(id: number, data: { isPinned?: boolean }): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>(`/voices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>(`/voices/${id}`, {
      method: 'DELETE',
    });
  },

  async getPredefined(): Promise<PredefinedVoicesResponse> {
    return fetchAPI<PredefinedVoicesResponse>('/voices/predefined');
  },
};

// TTS APIs
export const ttsAPI = {
  async create(data: CreateTTSRequest): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>('/tts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getList(page = 1, pageSize = 20): Promise<TTSTasksListResponse> {
    return fetchAPI<TTSTasksListResponse>(`/tts?page=${page}&pageSize=${pageSize}`);
  },

  async get(id: number): Promise<TTSTaskResponse> {
    return fetchAPI<TTSTaskResponse>(`/tts/${id}`);
  },

  async getStatus(id: number): Promise<TTSTaskResponse> {
    return fetchAPI<TTSTaskResponse>(`/tts/${id}/status`);
  },

  async delete(id: number): Promise<SuccessResponse> {
    return fetchAPI<SuccessResponse>(`/tts/${id}`, {
      method: 'DELETE',
    });
  },
};

// Export all APIs
export const api = {
  auth: authAPI,
  user: userAPI,
  points: pointsAPI,
  vip: vipAPI,
  voice: voiceAPI,
  tts: ttsAPI,
};

export { APIError };
