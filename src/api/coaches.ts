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

type RawCoachTag = string | { value?: string };

interface RawCoach extends Omit<Coach, 'specialties' | 'certifications' | 'isActive'> {
  status?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  specialties?: RawCoachTag[];
  certificates?: RawCoachTag[];
  certifications?: RawCoachTag[];
  isActive?: boolean;
}

function normalizeTagList(items?: RawCoachTag[]) {
  return (items || [])
    .map((item) => (typeof item === 'string' ? item : item.value || ''))
    .filter(Boolean);
}

function mapCoach(raw: RawCoach): Coach {
  return {
    ...raw,
    specialties: normalizeTagList(raw.specialties),
    certifications: normalizeTagList(raw.certifications || raw.certificates),
    isActive: raw.isActive ?? raw.status === 'ACTIVE',
  };
}

// Coach APIs
export const coachesApi = {
  // Get all coaches
  getAll: async (params?: PaginationParams & CoachFilter) =>
    wrapListData(
      await http.get<RawCoach[]>('/coaches/active', { page: params?.page, limit: params?.limit }, { showLoading: false })
        .then((response) => ({
          ...response,
          data: response.data.map(mapCoach),
        })),
      'coaches',
    ),

  // Get coach by ID
  getById: async (id: string) =>
    wrapObjectData(
      await http.get<RawCoach>(`/coaches/${id}`).then((response) => ({
        ...response,
        data: mapCoach(response.data),
      })),
      'coach',
    ),

  // Get coach schedule
  getSchedule: async (id: string, params?: { from?: string; to?: string }) =>
    wrapListData(await http.get<import('./courses').CourseSession[]>(`/coaches/${id}/schedule`, params), 'sessions'),
};
