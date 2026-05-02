import { http } from './request';

export interface SubmitFeedbackData {
  content: string;
}

export interface SubmitAccountDeletionRequestData {
  reason?: string;
}

export const supportApi = {
  submitFeedback: (data: SubmitFeedbackData) =>
    http.post<{ submitted: boolean }>('/support/feedback', data),

  submitAccountDeletionRequest: (data: SubmitAccountDeletionRequestData = {}) =>
    http.post<{ submitted: boolean; requestId?: string }>('/support/account-deletion-request', data),
};
