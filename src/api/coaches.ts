import { http, PaginationParams, wrapListData, wrapObjectData } from './request';
import type { CourseSession } from './courses';

// Coach interfaces
export interface Coach {
  id: string;
  coachCode: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  avatarUrl?: string;
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

export interface MyCoachSummary {
  coach: Coach;
  bookingCount: number;
  completedCount: number;
  upcomingCount: number;
  lastBookingAt?: string | null;
  lastCourseName?: string | null;
}

type RawCoachTag = string | { value?: string };
type BackendCoachSchedulePayload = CourseSession[] | { sessions?: CourseSession[] };
type BackendMyCoachesPayload = { coaches?: RawMyCoachSummary[] };

interface RawCoach extends Omit<Coach, 'specialties' | 'certifications' | 'isActive'> {
  status?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  avatarUrl?: string;
  specialties?: RawCoachTag[];
  certificates?: RawCoachTag[];
  certifications?: RawCoachTag[];
  isActive?: boolean;
}

interface RawMyCoachSummary extends Omit<MyCoachSummary, 'coach'> {
  coach: RawCoach;
}

function normalizeTagList(items?: RawCoachTag[]) {
  return (items || [])
    .map((item) => (typeof item === 'string' ? item : item.value || ''))
    .filter(Boolean);
}

function mapCoach(raw: RawCoach): Coach {
  const avatar = raw.avatar || raw.avatarUrl || '';

  return {
    ...raw,
    avatar,
    avatarUrl: raw.avatarUrl || avatar,
    specialties: normalizeTagList(raw.specialties),
    certifications: normalizeTagList(raw.certifications || raw.certificates),
    isActive: raw.isActive ?? raw.status === 'ACTIVE',
  };
}

function normalizeCoachSchedulePayload(payload: BackendCoachSchedulePayload): CourseSession[] {
  return Array.isArray(payload) ? payload : payload.sessions || [];
}

function mapMyCoachSummary(raw: RawMyCoachSummary): MyCoachSummary {
  return {
    ...raw,
    coach: mapCoach(raw.coach),
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

  // Get my coach relationship summaries
  getMine: async () =>
    http.get<BackendMyCoachesPayload>('/coaches/my', undefined, { showLoading: false })
      .then((response) => ({
        ...response,
        data: {
          coaches: (response.data.coaches || []).map(mapMyCoachSummary),
        },
      })),

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
  getSchedule: async (id: string, params?: { from?: string; to?: string }) => {
    const response = await http.get<BackendCoachSchedulePayload>(`/coaches/${id}/schedule`, params);
    return wrapListData({ ...response, data: normalizeCoachSchedulePayload(response.data) }, 'sessions');
  },
};
