import { http } from './request';

// Membership Plan interfaces
export interface MembershipPlan {
  id: string;
  planCode: string;
  name: string;
  description?: string;
  category: 'SINGLE' | 'RECURRING' | 'PACKAGE' | 'PRIVATE' | 'TAILOR';
  totalCredits: number;
  validityDays: number;
  priceCents: number;
  isActive: boolean;
}

// Membership Plan APIs
export const membershipPlansApi = {
  // Get all active plans
  getActive: () =>
    http.get<{ plans: MembershipPlan[] }>('/membership-plans/active'),

  // Get plan by ID
  getById: (id: string) =>
    http.get<{ plan: MembershipPlan }>(`/membership-plans/${id}`),
};
