import { http, PaginationParams, ApiResponse } from './request';

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
  getAll: (params?: PaginationParams & CourseFilter) =>
    http.get<{ courses: Course[]; meta: any }>('/courses', params),

  // Get course by ID
  getById: (id: string) =>
    http.get<{ course: Course }>(`/courses/${id}`),

  // Get course sessions
  getSessions: (courseId: string, params?: { upcoming?: boolean; from?: string; to?: string }) =>
    http.get<{ sessions: CourseSession[] }>(`/courses/${courseId}/sessions`, params),
};

// Course Session APIs
export const courseSessionsApi = {
  // Get all upcoming sessions
  getUpcoming: (params?: PaginationParams) =>
    http.get<{ sessions: CourseSession[]; meta: any }>('/course-sessions/upcoming', params),

  // Get session by ID
  getById: (id: string) =>
    http.get<{ session: CourseSession }>(`/course-sessions/${id}`),

  // Get available seats
  getAvailableSeats: (id: string) =>
    http.get<{ availableSeats: number }>(`/course-sessions/${id}/available-seats`),
};
