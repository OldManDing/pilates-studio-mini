export type HomeAccent = 'mint' | 'violet' | 'orange' | 'pink';

/** Future mapping: membersApi.getProfile() */
export interface HomeHeroData {
  eyebrow: string;
  dateLabel: string;
  badgeLabel: string;
  title: string;
  subtitle: string;
  profileCta: string;
}

/** Future mapping: membersApi.getMyMemberships() */
export interface HomeMembershipData {
  label: string;
  status: string;
  planName: string;
  description: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  progressLabel: string;
  progressValue: string;
  primaryAction: string;
  secondaryAction: string;
}

/** Future mapping: bookingsApi.getMyBookings() */
export interface HomeTodayCourseData {
  label: string;
  status: string;
  timeRange: string;
  duration: string;
  title: string;
  meta: string;
  note: string;
  primaryAction: string;
  secondaryAction: string;
}

export interface HomeServiceItemData {
  key: 'booking' | 'membership' | 'records' | 'courses';
  accent: HomeAccent;
  label: string;
  subtitle: string;
  description: string;
}

/** Future mapping: bookingsApi.getMyBookings() monthly aggregation */
export interface HomeMonthlySummaryData {
  label: string;
  value: string;
  unit: string;
  description: string;
  progressText: string;
  sideItems: Array<{
    key: string;
    label: string;
    value: string;
    unit: string;
    detail: string;
  }>;
}

/** Future mapping: coursesApi.getAll() */
export interface HomeCuratedData {
  eyebrow: string;
  caption: string;
  title: string;
  description: string;
  meta: string;
  cta: string;
  monogram: string;
}

/** Future mapping: bookingsApi.getMyBookings() upcoming items */
export interface HomeUpcomingItemData {
  key: string;
  day: string;
  weekday: string;
  label: string;
  title: string;
  description: string;
  meta: string;
}

/** Future mapping: profile or studio settings payload */
export interface HomeStudioData {
  label: string;
  name: string;
  address: string;
  hours: string;
  note: string;
  actionLabel: string;
}
