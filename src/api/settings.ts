import { http } from './request';

export interface StudioSettings {
  id?: string;
  studioName: string;
  phone?: string;
  email?: string;
  businessHours?: string;
  address?: string;
  imageUrl?: string;
}

export type MiniPageImageKey =
  | 'home'
  | 'courses'
  | 'profile'
  | 'coaches'
  | 'membership'
  | 'membershipRenew'
  | 'myBookings'
  | 'trainingRecords'
  | 'myCoaches'
  | 'notifications'
  | 'help'
  | 'settings'
  | 'accountSecurity'
  | 'agreement'
  | 'privacy'
  | 'transactions';

export interface MiniPageImageSetting {
  pageKey: MiniPageImageKey;
  label: string;
  path: string;
  defaultImageUrl: string;
  imageUrl?: string;
  isDefault: boolean;
  updatedAt?: string;
}

export const settingsApi = {
  getStudio: () => http.get<StudioSettings>('/settings/studio', undefined, { showLoading: false }),
  getMiniPageImages: () => http.get<MiniPageImageSetting[]>('/settings/mini-page-images', undefined, {
    showLoading: false,
    skipAuth: true,
  }),
};
