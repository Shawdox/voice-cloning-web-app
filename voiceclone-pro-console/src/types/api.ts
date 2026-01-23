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
