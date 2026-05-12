import { http, PaginationMeta, PaginationParams, wrapListData, wrapObjectData } from './request';

// Booking interfaces
export interface Booking {
  id: string;
  bookingCode: string;
  memberId: string;
  sessionId: string;
  bookingTime?: string;
  bookedAt?: string;
  checkInTime?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  member?: {
    id: string;
    name: string;
    phone: string;
  };
  session?: {
    id: string;
    sessionCode: string;
    startsAt: string;
    endsAt: string;
    course?: {
      id: string;
      name: string;
      type: string;
      level: string;
    };
    coach?: {
      id: string;
      name: string;
      avatar?: string;
      avatarUrl?: string;
    };
  };
}

function normalizeBooking(booking: Booking): Booking {
  const bookingTime = booking.bookingTime || booking.bookedAt || '';
  const coach = booking.session?.coach;
  const coachAvatar = coach?.avatar || coach?.avatarUrl || '';

  return {
    ...booking,
    bookingTime,
    bookedAt: booking.bookedAt || bookingTime,
    session: booking.session
      ? {
          ...booking.session,
          coach: coach
            ? {
                ...coach,
                avatar: coachAvatar,
                avatarUrl: coach.avatarUrl || coachAvatar,
              }
            : coach,
        }
      : booking.session,
  };
}

export interface CreateBookingData {
  memberId: string;
  sessionId: string;
  source?: 'ADMIN' | 'MINI_PROGRAM';
  notes?: string;
}

export interface BookingFilter {
  status?: string;
  memberId?: string;
  sessionId?: string;
  from?: string;
  to?: string;
}

export interface TrainingRecordSummary {
  sessions: number;
  totalMinutes: number;
  totalHours: number;
  coachCount: number;
}

export interface TrainingRecordsPayload {
  summary: TrainingRecordSummary;
  records: Booking[];
  meta?: PaginationMeta;
}

// Booking APIs
export const bookingsApi = {
  // Get all bookings
  getAll: async (params?: PaginationParams & BookingFilter) => {
    const response = await http.get<Booking[]>('/bookings', params);
    return wrapListData({ ...response, data: response.data.map(normalizeBooking) }, 'bookings');
  },

  // Get my bookings
  getMyBookings: async (params?: PaginationParams & BookingFilter, config?: { showLoading?: boolean }) => {
    const response = await http.get<Booking[]>('/bookings/my', params, config);
    return wrapListData({ ...response, data: response.data.map(normalizeBooking) }, 'bookings');
  },

  // Get my completed training records and aggregate summary
  getMyTrainingRecords: async (params?: PaginationParams, config?: { showLoading?: boolean }) => {
    const response = await http.get<TrainingRecordsPayload>('/bookings/my/training-records', params, config);
    return {
      ...response,
      data: {
        ...response.data,
        records: response.data.records.map(normalizeBooking),
      },
    };
  },

  // Get booking by ID
  getById: async (id: string) => {
    const response = await http.get<Booking>(`/bookings/${id}`);
    return wrapObjectData({ ...response, data: normalizeBooking(response.data) }, 'booking');
  },

  // Create booking
  create: async (data: CreateBookingData, config?: { showLoading?: boolean }) => {
    const response = await http.post<Booking>('/bookings', data, config);
    return wrapObjectData({ ...response, data: normalizeBooking(response.data) }, 'booking');
  },

  // Cancel booking
  cancel: async (id: string, reason?: string) => {
    const response = await http.patch<Booking>(`/bookings/${id}/cancel`, { reason });
    return wrapObjectData({ ...response, data: normalizeBooking(response.data) }, 'booking');
  },
};
