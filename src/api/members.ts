import { http } from './request';

// Member interfaces
export interface Member {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  birthday?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  isActive: boolean;
  joinedAt: string;
  memberships?: Membership[];
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  planName?: string;
  startDate: string;
  endDate: string;
  totalCredits: number;
  remainingCredits: number;
  isActive: boolean;
}

export interface CreateMemberData {
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  planId?: string;
  startDate?: string;
}

// Member APIs
export const membersApi = {
  // Get current member profile
  getProfile: (config?: { showLoading?: boolean }) =>
    http.get<{ member: Member }>('/members/profile', undefined, config),

  // Get member by ID
  getById: (id: string) =>
    http.get<{ member: Member }>(`/members/${id}`),

  // Update member
  update: (id: string, data: Partial<CreateMemberData>) =>
    http.put<{ member: Member }>(`/members/${id}`, data),

  // Get my memberships
  getMyMemberships: (config?: { showLoading?: boolean }) =>
    http.get<{ memberships: Membership[] }>('/members/my-memberships', undefined, config),
};
