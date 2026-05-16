import { http, PaginationParams, wrapListData, wrapObjectData } from './request';

// Course interfaces
export interface Course {
  id: string;
  courseCode: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  imageUrl?: string;
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
    avatarUrl?: string;
    bio?: string;
  };
  sessions?: CourseSession[];
}

type BackendCoach = { id: string; name: string; avatar?: string; avatarUrl?: string; bio?: string };
type BackendCourse = Omit<Course, 'maxCapacity' | 'coach'> & { maxCapacity?: number; capacity?: number; coach?: BackendCoach };
type BackendSessionCourse = NonNullable<CourseSession['course']> & { imageUrl?: string };
type BackendCourseSession = Omit<CourseSession, 'coach' | 'course'> & { coach?: BackendCoach; course?: BackendSessionCourse };
type BackendSessionsPayload = BackendCourseSession[] | { sessions?: BackendCourseSession[] };

function normalizeCoach(coach?: BackendCoach) {
  if (!coach) {
    return coach;
  }

  const avatar = coach.avatar || coach.avatarUrl || '';

  return {
    ...coach,
    avatar,
    avatarUrl: coach.avatarUrl || avatar,
  };
}

function normalizeCourse(course: BackendCourse): Course {
  const normalizedCapacity = course.maxCapacity ?? course.capacity ?? 0;
  const coverImageUrl = course.coverImageUrl || course.imageUrl || '';

  return {
    ...course,
    coverImageUrl,
    imageUrl: course.imageUrl || coverImageUrl,
    capacity: course.capacity ?? normalizedCapacity,
    maxCapacity: normalizedCapacity,
    coach: normalizeCoach(course.coach),
  };
}

function normalizeSessionsPayload(payload: BackendSessionsPayload): CourseSession[] {
  const sessions = Array.isArray(payload) ? payload : payload.sessions || [];

  return sessions.map((session) => ({
    ...session,
    coach: normalizeCoach(session.coach),
    course: session.course
      ? {
          ...session.course,
          coverImageUrl: session.course.coverImageUrl || session.course.imageUrl || '',
        }
      : session.course,
  }));
}

export interface CourseSession {
  id: string;
  sessionCode: string;
  courseId: string;
  coachId?: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isActive: boolean;
  coach?: {
    id: string;
    name: string;
    avatar?: string;
    avatarUrl?: string;
  };
  course?: {
    id: string;
    name: string;
    coverImageUrl?: string;
    imageUrl?: string;
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
  getById: async (id: string, config?: { showLoading?: boolean }) => {
    const response = await http.get<BackendCourse>(`/courses/${id}`, undefined, config);
    return wrapObjectData({ ...response, data: normalizeCourse(response.data) }, 'course');
  },

  // Get course sessions
  getSessions: async (courseId: string, params?: { upcoming?: boolean; from?: string; to?: string }, config?: { showLoading?: boolean }) => {
    const response = await http.get<BackendSessionsPayload>(`/courses/${courseId}/sessions`, params, config);
    return wrapListData({ ...response, data: normalizeSessionsPayload(response.data) }, 'sessions');
  },
};

// Course Session APIs
export const courseSessionsApi = {
  // Get all upcoming sessions
  getUpcoming: async (params?: PaginationParams) => {
    const response = await http.get<BackendCourseSession[]>('/course-sessions/upcoming', params);
    return wrapListData({ ...response, data: normalizeSessionsPayload(response.data) }, 'sessions');
  },

  // Get session by ID
  getById: async (id: string) => {
    const response = await http.get<BackendCourseSession>(`/course-sessions/${id}`);
    const [session] = normalizeSessionsPayload([response.data]);
    return wrapObjectData({ ...response, data: session }, 'session');
  },

  // Get available seats
  getAvailableSeats: (id: string) =>
    http.get<{ availableSeats: number }>(`/course-sessions/${id}/available-seats`),
};
