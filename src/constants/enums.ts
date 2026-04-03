// Course Types
export const CourseTypes = [
  { value: 'MAT', label: '垫上课程', color: '#43c7ab' },
  { value: 'REFORMER', label: '核心床', color: '#8b7cff' },
  { value: 'CADILLAC', label: '凯迪拉克', color: '#ffb760' },
  { value: 'CHAIR', label: '稳踏椅', color: '#ff8da8' },
  { value: 'BARREL', label: '梯桶', color: '#6b5fd9' },
  { value: 'PRIVATE', label: '私教', color: '#35a090' },
] as const;

// Course Levels
export const CourseLevels = [
  { value: 'BEGINNER', label: '初级', color: '#43c7ab' },
  { value: 'INTERMEDIATE', label: '中级', color: '#ffb760' },
  { value: 'ADVANCED', label: '高级', color: '#ff8da8' },
  { value: 'ALL_LEVELS', label: '全阶段', color: '#8b7cff' },
] as const;

// Booking Status
export const BookingStatuses = [
  { value: 'PENDING', label: '待确认', color: '#ffb760' },
  { value: 'CONFIRMED', label: '已确认', color: '#43c7ab' },
  { value: 'COMPLETED', label: '已完成', color: '#8b7cff' },
  { value: 'CANCELLED', label: '已取消', color: '#a0aec0' },
  { value: 'NO_SHOW', label: '未签到', color: '#ff4d4f' },
] as const;

// Membership Plan Categories
export const PlanCategories = [
  { value: 'SINGLE', label: '次卡', color: '#43c7ab' },
  { value: 'RECURRING', label: '周期卡', color: '#8b7cff' },
  { value: 'PACKAGE', label: '套餐卡', color: '#ffb760' },
  { value: 'PRIVATE', label: '私教卡', color: '#ff8da8' },
  { value: 'TAILOR', label: '定制卡', color: '#35a090' },
] as const;

// Transaction Status
export const TransactionStatuses = [
  { value: 'PENDING', label: '待处理', color: '#ffb760' },
  { value: 'COMPLETED', label: '已完成', color: '#43c7ab' },
  { value: 'FAILED', label: '失败', color: '#ff4d4f' },
  { value: 'REFUNDED', label: '已退款', color: '#a0aec0' },
] as const;

// Transaction Kind
export const TransactionKinds = [
  { value: 'PLAN_PURCHASE', label: '会员卡购买', color: '#43c7ab' },
  { value: 'PLAN_RENEWAL', label: '会员卡续费', color: '#8b7cff' },
  { value: 'PRIVATE_SESSION', label: '私教课程', color: '#ffb760' },
  { value: 'MERCHANDISE', label: '商品购买', color: '#ff8da8' },
  { value: 'OTHER', label: '其他', color: '#6f8198' },
] as const;

// Payment Methods
export const PaymentMethods = [
  { value: 'CASH', label: '现金' },
  { value: 'CREDIT_CARD', label: '银行卡' },
  { value: 'WECHAT_PAY', label: '微信支付' },
  { value: 'ALIPAY', label: '支付宝' },
  { value: 'TRANSFER', label: '转账' },
] as const;

// Weekdays
export const Weekdays = [
  { value: 0, label: '周日', shortLabel: '日' },
  { value: 1, label: '周一', shortLabel: '一' },
  { value: 2, label: '周二', shortLabel: '二' },
  { value: 3, label: '周三', shortLabel: '三' },
  { value: 4, label: '周四', shortLabel: '四' },
  { value: 5, label: '周五', shortLabel: '五' },
  { value: 6, label: '周六', shortLabel: '六' },
] as const;

// Helper functions
export function getLabelByValue<T extends readonly { value: string | number; label: string }[]>(
  array: T,
  value: string | number
): string {
  const item = array.find((item) => item.value === value);
  return item?.label || String(value);
}

export function getColorByValue<T extends readonly { value: string | number; color?: string }[]>(
  array: T,
  value: string | number
): string {
  const item = array.find((item) => item.value === value);
  return item?.color || '#6f8198';
}
