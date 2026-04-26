import { http, PaginationParams, wrapListData, wrapObjectData } from './request';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'MINI_PROGRAM' | 'INTERNAL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED';

export interface NotificationItem {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  type: string;
  title: string;
  content: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface NotificationFilter {
  status?: NotificationStatus;
  channel?: NotificationChannel;
  type?: string;
}

export const notificationsApi = {
  getMy: async (params?: PaginationParams & NotificationFilter, config?: { showLoading?: boolean }) =>
    wrapListData(await http.get<NotificationItem[]>('/notifications/my', params, config), 'notifications'),

  markMyAsRead: async (id: string) =>
    wrapObjectData(await http.patch<NotificationItem>(`/notifications/my/${id}/read`), 'notification'),
};
