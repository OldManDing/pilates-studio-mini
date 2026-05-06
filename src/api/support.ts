import { http } from './request';

export interface SubmitFeedbackData {
  content: string;
}

export interface SubmitAccountDeletionRequestData {
  reason?: string;
}

export interface AccountDeletionRequestStatus {
  requested?: boolean;
  status?: string;
  requestId?: string;
}

export const supportApi = {
  submitFeedback: (data: SubmitFeedbackData) =>
    http.post<{ submitted: boolean }>('/support/feedback', data),

  getAccountDeletionRequestStatus: () =>
    http.get<AccountDeletionRequestStatus>('/support/account-deletion-request/status', undefined, { showLoading: false }),

  submitAccountDeletionRequest: (data: SubmitAccountDeletionRequestData = {}) =>
    http.post<{ submitted: boolean; requestId?: string }>('/support/account-deletion-request', data),
};
