export interface MembershipCredits {
  planName?: string | null;
  totalCredits: number;
  remainingCredits: number;
}

function normalizeCredit(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export function formatMembershipCredits(membership: MembershipCredits) {
  const totalCredits = normalizeCredit(membership.totalCredits);
  const remainingCredits = normalizeCredit(membership.remainingCredits);

  if (totalCredits <= 0) {
    return '无限次';
  }

  if (remainingCredits > totalCredits) {
    return `${remainingCredits}次`;
  }

  return `${remainingCredits}/${totalCredits}次`;
}

export function formatMembershipCreditsWithUnit(membership: MembershipCredits) {
  const totalCredits = normalizeCredit(membership.totalCredits);
  const remainingCredits = normalizeCredit(membership.remainingCredits);

  if (totalCredits <= 0) {
    return '无限次权益';
  }

  if (remainingCredits > totalCredits) {
    return `剩余 ${remainingCredits} 次`;
  }

  return `剩余 ${remainingCredits}/${totalCredits} 次`;
}

export function formatMembershipDescription(membership: MembershipCredits, fallbackName = '会员卡') {
  const planName = membership.planName || fallbackName;
  const totalCredits = normalizeCredit(membership.totalCredits);
  const remainingCredits = normalizeCredit(membership.remainingCredits);

  if (totalCredits <= 0) {
    return `${planName} 当前权益为无限次，可继续安排训练。`;
  }

  if (remainingCredits > totalCredits) {
    return `${planName} 当前剩余 ${remainingCredits} 次，可继续安排训练。`;
  }

  return `${planName} 当前剩余 ${remainingCredits}/${totalCredits} 次，可继续安排训练。`;
}

export function getUsedMembershipCredits(membership: MembershipCredits) {
  const totalCredits = normalizeCredit(membership.totalCredits);
  const remainingCredits = normalizeCredit(membership.remainingCredits);

  if (totalCredits <= 0) {
    return 0;
  }

  return Math.max(0, totalCredits - Math.min(remainingCredits, totalCredits));
}
