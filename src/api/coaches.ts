import { http, PaginationParams, wrapListData, wrapObjectData } from './request';

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
  getAll: async (params?: PaginationParams & CoachFilter) =>
    wrapListData(await http.get<Coach[]>('/coaches', params), 'coaches'),

  // Get coach by ID
  getById: async (id: string) =>
    wrapObjectData(await http.get<Coach>(`/coaches/${id}`), 'coach'),

  // Get coach schedule
  getSchedule: async (id: string, params?: { from?: string; to?: string }) =>
    wrapListData(await http.get<import('./courses').CourseSession[]>(`/coaches/${id}/schedule`, params), 'sessions'),
};
