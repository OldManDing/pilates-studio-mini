export type ProfileMenuIcon = 'bookings' | 'records' | 'membership' | 'notifications' | 'support' | 'settings';

/** Future mapping: membersApi.getProfile() */
export interface ProfileStatData {
  key: string;
  value: string;
  unit: string;
  label: string;
}

/** Future mapping: membersApi.getProfile() */
export interface ProfileAccountCardData {
  avatarText: string;
  avatarUrl?: string;
  name: string;
  badgeLabel: string;
  phone: string;
  membershipLabel: string;
  membershipTitle: string;
  membershipDescription: string;
  stats: ProfileStatData[];
}

/** Future mapping: page-level account service configuration */
export interface ProfileMenuItemData {
  key: string;
  icon: ProfileMenuIcon;
  label: string;
  description: string;
  route?: string;
  requiresLogin?: boolean;
}

/** Future mapping: account navigation groups */
export interface ProfileMenuSectionData {
  key: string;
  label: string;
  items: ProfileMenuItemData[];
}

/** Future mapping: auth/session presenter */
export interface ProfileSignOutData {
  label: string;
}
