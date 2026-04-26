import { http } from './request';

export interface SubmitFeedbackData {
  content: string;
}

export const supportApi = {
  submitFeedback: (data: SubmitFeedbackData) =>
    http.post<{ submitted: boolean }>('/support/feedback', data),
};
