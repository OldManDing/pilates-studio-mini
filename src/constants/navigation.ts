export type TabIconName = 'home' | 'calendar' | 'user';

export interface TabNavigationItem {
  pagePath: `pages/${string}`;
  text: string;
  iconPath: string;
  selectedIconPath: string;
  iconName: TabIconName;
}

export const TAB_NAV_ITEMS = [
  {
    pagePath: 'pages/index/index',
    text: '首页',
    iconPath: 'assets/tabbar/home.png',
    selectedIconPath: 'assets/tabbar/home-active.png',
    iconName: 'home',
  },
  {
    pagePath: 'pages/courses/index',
    text: '预约',
    iconPath: 'assets/tabbar/course.png',
    selectedIconPath: 'assets/tabbar/course-active.png',
    iconName: 'calendar',
  },
  {
    pagePath: 'pages/profile/index',
    text: '我的',
    iconPath: 'assets/tabbar/profile.png',
    selectedIconPath: 'assets/tabbar/profile-active.png',
    iconName: 'user',
  },
] as const satisfies ReadonlyArray<TabNavigationItem>;

export function toTabPageUrl(pagePath: string) {
  return pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
}

export function getDefaultTabPageUrl() {
  return toTabPageUrl(TAB_NAV_ITEMS[0]?.pagePath ?? 'pages/index/index');
}
