// API Response Types

export interface UserProfile {
  id: number;
  email: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  points: number;
  vipLevel: number;
  vipExpiresAt?: string;
  createdAt: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface PointsBalanceResponse {
  points: number;
}

export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  orderNo?: string;
  createdAt: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
}

export interface VIPStatusResponse {
  isVip: boolean;
  vipLevel: number;
  vipExpiresAt?: string;
  benefits: string[];
}

export interface RechargeOrderResponse {
  orderNo: string;
  amount: number;
  points: number;
  qrCodeUrl: string;
  expiresAt: string;
  paymentType: string;
}

export interface OrderStatusResponse {
  orderNo: string;
  status: string;
  amount: number;
  points: number;
  paidAt?: string;
}

export interface ErrorResponse {
  message: string;
}

export interface SuccessResponse {
  message: string;
  data?: any;
}

// Voice (音色) Types
export interface VoiceResponse {
  id: number;
  name: string;
  status: 'training' | 'ready' | 'failed';
  progress?: number;
  audioFileUrl: string;
  audioFileName?: string;
  withTranscript: boolean;
  transcript?: string;
  isPinned: boolean;
  errorMsg?: string;
  createdAt: string;
  completedAt?: string;
}

export interface VoicesListResponse {
  data: VoiceResponse[];
  total: number;
}

export interface UploadAudioResponse {
  message: string;
  file_url: string;
  filename: string;
  size: number;
}

export interface CreateVoiceRequest {
  name: string;
  audioFileUrl: string;
  audioFileName?: string;
  withTranscript?: boolean;
}

// TTS Types
export interface TTSTaskResponse {
  id: number;
  voiceId: number;
  voiceName: string;
  text: string;
  emotion?: string;
  format?: string; // mp3, wav, pcm, opus
  textLength: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  audioDuration?: number;
  errorMsg?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TTSTasksListResponse {
  data: TTSTaskResponse[];
  total: number;
}

export interface CreateTTSRequest {
  voiceId: number;
  text: string;
  emotion?: string;
  speed?: number;
  format?: string; // 音频格式: mp3, wav, pcm, opus
}
