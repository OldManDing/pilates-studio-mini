import { http, wrapListData, wrapObjectData } from './request';

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
  getActive: async () =>
    wrapListData(await http.get<MembershipPlan[]>('/membership-plans/active'), 'plans'),

  // Get plan by ID
  getById: async (id: string) =>
    wrapObjectData(await http.get<MembershipPlan>(`/membership-plans/${id}`), 'plan'),

  // Submit renewal request for selected plan
  requestRenewal: (planId: string) =>
    http.post<{ submitted: boolean }>('/membership-renewals', { planId }),
};
