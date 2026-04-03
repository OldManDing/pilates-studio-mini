import { http, PaginationParams } from './request';

// Booking interfaces
export interface Booking {
  id: string;
  bookingCode: string;
  memberId: string;
  sessionId: string;
  bookingTime: string;
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
    };
  };
}

export interface CreateBookingData {
  memberId: string;
  sessionId: string;
  notes?: string;
}

export interface BookingFilter {
  status?: string;
  memberId?: string;
  sessionId?: string;
  from?: string;
  to?: string;
}

// Booking APIs
export const bookingsApi = {
  // Get all bookings
  getAll: (params?: PaginationParams & BookingFilter) =>
    http.get<{ bookings: Booking[]; meta: any }>('/bookings', params),

  // Get my bookings
  getMyBookings: (params?: PaginationParams) =>
    http.get<{ bookings: Booking[]; meta: any }>('/bookings/my', params),

  // Get booking by ID
  getById: (id: string) =>
    http.get<{ booking: Booking }>(`/bookings/${id}`),

  // Create booking
  create: (data: CreateBookingData) =>
    http.post<{ booking: Booking }>('/bookings', data),

  // Cancel booking
  cancel: (id: string, reason?: string) =>
    http.patch<{ booking: Booking }>(`/bookings/${id}/cancel`, { reason }),

  // Check in
  checkIn: (id: string) =>
    http.patch<{ booking: Booking }>(`/bookings/${id}/checkin`),
};
