import { http, PaginationParams } from './request';

// Coach interfaces
export interface Coach {
  id: string;
  coachCode: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  isActive: boolean;
  courses?: {
    id: string;
    name: string;
    type: string;
  }[];
}

export interface CoachFilter {
  isActive?: boolean;
}

// Coach APIs
export const coachesApi = {
  // Get all coaches
  getAll: (params?: PaginationParams & CoachFilter) =>
    http.get<{ coaches: Coach[]; meta: any }>('/coaches', params),

  // Get coach by ID
  getById: (id: string) =>
    http.get<{ coach: Coach }>(`/coaches/${id}`),

  // Get coach schedule
  getSchedule: (id: string, params?: { from?: string; to?: string }) =>
    http.get<{ sessions: any[] }>(`/coaches/${id}/schedule`, params),
};
