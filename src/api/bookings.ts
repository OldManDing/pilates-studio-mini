import { http, PaginationParams, wrapListData, wrapObjectData } from './request';

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
  getAll: async (params?: PaginationParams & BookingFilter) =>
    wrapListData(await http.get<Booking[]>('/bookings', params), 'bookings'),

  // Get my bookings
  getMyBookings: async (params?: PaginationParams & BookingFilter, config?: { showLoading?: boolean }) =>
    wrapListData(await http.get<Booking[]>('/bookings/my', params, config), 'bookings'),

  // Get booking by ID
  getById: async (id: string) =>
    wrapObjectData(await http.get<Booking>(`/bookings/${id}`), 'booking'),

  // Create booking
  create: async (data: CreateBookingData) =>
    wrapObjectData(await http.post<Booking>('/bookings', data), 'booking'),

  // Cancel booking
  cancel: async (id: string, reason?: string) =>
    wrapObjectData(await http.patch<Booking>(`/bookings/${id}/cancel`, { reason }), 'booking'),

  // Check in
  checkIn: async (id: string) =>
    wrapObjectData(await http.patch<Booking>(`/bookings/${id}/checkin`), 'booking'),
};
