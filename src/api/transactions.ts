import { http, PaginationParams, wrapListData, wrapObjectData } from './request';

// Transaction interfaces
export interface Transaction {
  id: string;
  transactionCode: string;
  memberId: string;
  membershipId?: string;
  kind: 'PLAN_PURCHASE' | 'PLAN_RENEWAL' | 'PRIVATE_SESSION' | 'MERCHANDISE' | 'OTHER';
  amountCents: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'WECHAT_PAY' | 'ALIPAY' | 'TRANSFER';
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
  notes?: string;
  createdAt: string;
  member?: {
    id: string;
    name: string;
  };
}

export interface TransactionFilter {
  kind?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface TransactionSummary {
  totalRevenue: number;
  transactionCount: number;
  byKind: Record<string, { count: number; total: number }>;
  byStatus: Record<string, { count: number; total: number }>;
}

// Transaction APIs
export const transactionsApi = {
  // Get my transactions
  getMyTransactions: async (params?: PaginationParams) =>
    wrapListData(await http.get<Transaction[]>('/transactions/my', params), 'transactions'),

  // Get transaction by ID
  getById: async (id: string) =>
    wrapObjectData(await http.get<Transaction>(`/transactions/${id}`), 'transaction'),

  // Get my transaction summary
  getMySummary: (params?: { from?: string; to?: string }) =>
    http.get<TransactionSummary>('/transactions/my-summary', params),
};
