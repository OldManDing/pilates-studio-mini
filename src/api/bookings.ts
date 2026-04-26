import { http, PaginationParams, wrapListData, wrapObjectData } from './request';

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
    };
  };
}

function normalizeBooking(booking: Booking): Booking {
  const bookingTime = booking.bookingTime || booking.bookedAt || '';

  return {
    ...booking,
    bookingTime,
    bookedAt: booking.bookedAt || bookingTime,
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
  getAll: async (params?: PaginationParams & BookingFilter) => {
    const response = await http.get<Booking[]>('/bookings', params);
    return wrapListData({ ...response, data: response.data.map(normalizeBooking) }, 'bookings');
  },

  // Get my bookings
  getMyBookings: async (params?: PaginationParams & BookingFilter, config?: { showLoading?: boolean }) => {
    const response = await http.get<Booking[]>('/bookings/my', params, config);
    return wrapListData({ ...response, data: response.data.map(normalizeBooking) }, 'bookings');
  },

  // Get booking by ID
  getById: async (id: string) => {
    const response = await http.get<Booking>(`/bookings/${id}`);
    return wrapObjectData({ ...response, data: normalizeBooking(response.data) }, 'booking');
  },

  // Create booking
  create: async (data: CreateBookingData) => {
    const response = await http.post<Booking>('/bookings', data);
    return wrapObjectData({ ...response, data: normalizeBooking(response.data) }, 'booking');
  },

  // Cancel booking
  cancel: async (id: string, reason?: string) => {
    const response = await http.patch<Booking>(`/bookings/${id}/cancel`, { reason });
    return wrapObjectData({ ...response, data: normalizeBooking(response.data) }, 'booking');
  },

  // Check in
  checkIn: async (id: string) => {
    const response = await http.patch<Booking>(`/bookings/${id}/checkin`);
    return wrapObjectData({ ...response, data: normalizeBooking(response.data) }, 'booking');
  },
};
