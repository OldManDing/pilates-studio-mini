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
  getAll: async (params?: PaginationParams & CourseFilter, config?: { showLoading?: boolean }) =>
    wrapListData(await http.get<Course[]>('/courses', params, config), 'courses'),

  // Get course by ID
  getById: async (id: string) =>
    wrapObjectData(await http.get<Course>(`/courses/${id}`), 'course'),

  // Get course sessions
  getSessions: async (courseId: string, params?: { upcoming?: boolean; from?: string; to?: string }) =>
    wrapListData(await http.get<CourseSession[]>(`/courses/${courseId}/sessions`, params), 'sessions'),
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
