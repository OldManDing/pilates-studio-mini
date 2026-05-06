import { http } from './request';

export interface KnowledgeFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const knowledgeApi = {
  getFaqs: (params?: { category?: string }, config?: { showLoading?: boolean }) =>
    http.get<KnowledgeFaq[]>('/knowledge/faqs', params, { showLoading: false, skipAuth: true, ...config }),
};
