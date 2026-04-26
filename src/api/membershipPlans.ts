import { http, wrapListData, wrapObjectData } from './request';

// Membership Plan interfaces
export interface MembershipPlan {
  id: string;
  code?: string;
  planCode: string;
  name: string;
  description?: string;
  category: 'TIME_CARD' | 'PERIOD_CARD' | 'PRIVATE_PACKAGE';
  totalCredits: number;
  durationDays?: number | null;
  validityDays: number;
  priceCents: number;
  isActive: boolean;
}

type BackendMembershipPlan = Omit<MembershipPlan, 'planCode' | 'validityDays'> & {
  code?: string;
  planCode?: string;
  durationDays?: number | null;
  validityDays?: number;
};

function normalizePlan(plan: BackendMembershipPlan): MembershipPlan {
  const validityDays = plan.validityDays ?? plan.durationDays ?? 0;
  const planCode = plan.planCode || plan.code || plan.id;

  return {
    ...plan,
    code: plan.code || planCode,
    planCode,
    durationDays: plan.durationDays ?? validityDays,
    validityDays,
  };
}

// Membership Plan APIs
export const membershipPlansApi = {
  // Get all active plans
  getActive: async () => {
    const response = await http.get<BackendMembershipPlan[]>('/membership-plans/active');
    return wrapListData({ ...response, data: response.data.map(normalizePlan) }, 'plans');
  },

  // Get plan by ID
  getById: async (id: string) => {
    const response = await http.get<BackendMembershipPlan>(`/membership-plans/${id}`);
    return wrapObjectData({ ...response, data: normalizePlan(response.data) }, 'plan');
  },

  // Submit renewal request for selected plan
  requestRenewal: (planId: string) =>
    http.post<{ submitted: boolean }>('/membership-renewals', { planId }),
};
