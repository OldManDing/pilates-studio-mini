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

export const settingsApi = {
  getStudio: () => http.get<StudioSettings>('/settings/studio', undefined, { showLoading: false }),
};
