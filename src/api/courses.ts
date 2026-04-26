import { http, PaginationParams, wrapListData, wrapObjectData } from './request';

// Course interfaces
export interface Course {
  id: string;
  courseCode: string;
  name: string;
  description: string;
  type: string;
  level: string;
  durationMinutes: number;
  capacity?: number;
  maxCapacity: number;
  isActive: boolean;
  coachId?: string;
  coach?: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  sessions?: CourseSession[];
}

type BackendCourse = Omit<Course, 'maxCapacity'> & { maxCapacity?: number; capacity?: number };
type BackendSessionsPayload = CourseSession[] | { sessions?: CourseSession[] };

function normalizeCourse(course: BackendCourse): Course {
  const normalizedCapacity = course.maxCapacity ?? course.capacity ?? 0;

  return {
    ...course,
    capacity: course.capacity ?? normalizedCapacity,
    maxCapacity: normalizedCapacity,
  };
}

function normalizeSessionsPayload(payload: BackendSessionsPayload): CourseSession[] {
  return Array.isArray(payload) ? payload : payload.sessions || [];
}

export interface CourseSession {
  id: string;
  sessionCode: string;
  courseId: string;
  coachId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isActive: boolean;
  coach?: {
    id: string;
    name: string;
    avatar?: string;
  };
  course?: {
    id: string;
    name: string;
    type: string;
    level: string;
    durationMinutes: number;
  };
  bookedCount?: number;
}

export interface CourseFilter {
  type?: string;
  level?: string;
  isActive?: boolean;
}

// Course APIs
export const coursesApi = {
  // Get all courses
  getAll: async (params?: PaginationParams & CourseFilter, config?: { showLoading?: boolean }) => {
    const response = await http.get<BackendCourse[]>('/courses', params, config);
    return wrapListData({ ...response, data: response.data.map(normalizeCourse) }, 'courses');
  },

  // Get course by ID
  getById: async (id: string) => {
    const response = await http.get<BackendCourse>(`/courses/${id}`);
    return wrapObjectData({ ...response, data: normalizeCourse(response.data) }, 'course');
  },

  // Get course sessions
  getSessions: async (courseId: string, params?: { upcoming?: boolean; from?: string; to?: string }) => {
    const response = await http.get<BackendSessionsPayload>(`/courses/${courseId}/sessions`, params);
    return wrapListData({ ...response, data: normalizeSessionsPayload(response.data) }, 'sessions');
  },
};

// Course Session APIs
export const courseSessionsApi = {
  // Get all upcoming sessions
  getUpcoming: async (params?: PaginationParams) =>
    wrapListData(await http.get<CourseSession[]>('/course-sessions/upcoming', params), 'sessions'),

  // Get session by ID
  getById: async (id: string) =>
    wrapObjectData(await http.get<CourseSession>(`/course-sessions/${id}`), 'session'),

  // Get available seats
  getAvailableSeats: (id: string) =>
    http.get<{ availableSeats: number }>(`/course-sessions/${id}/available-seats`),
};
