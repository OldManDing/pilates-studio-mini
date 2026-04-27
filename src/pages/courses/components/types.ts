export interface BookingHeroData {
  eyebrow: string;
  title: string;
  subtitle: string;
  actionLabel: string;
}

export interface BookingDateItemData {
  key: string;
  weekday: string;
  day: string;
  dateValue: string;
  label?: string;
  active?: boolean;
  disabled?: boolean;
}

export interface BookingCategoryItemData {
  key: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

export interface BookingCourseCardData {
  key: string;
  courseId?: string;
  title: string;
  time: string;
  duration: string;
  instructor: string;
  location: string;
  spotsText: string;
  imageKind: 'yoga' | 'pilates' | 'meditation' | 'dark';
  full?: boolean;
}
