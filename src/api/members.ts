import { http, wrapObjectData } from './request';

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

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Member APIs
export const membersApi = {
  // Get current member profile
  getProfile: async (config?: { showLoading?: boolean }) =>
    wrapObjectData(await http.get<Member | null>('/members/profile', undefined, config), 'member'),

  // Get member by ID
  getById: async (id: string) =>
    wrapObjectData(await http.get<Member>(`/members/${id}`), 'member'),

  // Update member
  update: async (id: string, data: Partial<CreateMemberData>) =>
    wrapObjectData(await http.put<Member>(`/members/${id}`, data), 'member'),

  // Get my memberships
  getMyMemberships: (config?: { showLoading?: boolean }) =>
    http.get<{ memberships: Membership[] }>('/members/my-memberships', undefined, config),

  // Submit password change request
  changePassword: (data: ChangePasswordData) =>
    http.post<{ submitted: boolean }>('/members/change-password', data),

  // Submit account deletion request
  requestAccountDeletion: () =>
    http.post<{ submitted: boolean }>('/members/delete-request'),
};
