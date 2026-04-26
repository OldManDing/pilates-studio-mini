import { TAB_NAV_ITEMS } from './constants/navigation';

const NAVIGATION_BAR_BACKGROUND_COLOR = '#FFFDF9';
const TAB_BAR_TEXT_COLOR = '#D0CCC6';
const TAB_BAR_SELECTED_COLOR = '#1A1A1A';
const TAB_BAR_BACKGROUND_COLOR = '#FAFAFA';
const APP_TAB_BAR_LIST = TAB_NAV_ITEMS.map(({ pagePath, text, iconPath, selectedIconPath }) => ({
  pagePath,
  text,
  iconPath,
  selectedIconPath,
}));

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/courses/index',
    'pages/course-detail/index',
    'pages/coaches/index',
    'pages/coach-detail/index',
    'pages/membership/index',
    'pages/membership-renew/index',
    'pages/my-bookings/index',
    'pages/training-records/index',
    'pages/my-coaches/index',
    'pages/profile/index',
    'pages/notifications/index',
    'pages/help/index',
    'pages/settings/index',
    'pages/account-security/index',
    'pages/agreement/index',
    'pages/privacy/index',
    'pages/transactions/index',
  ],
  tabBar: {
    custom: true,
    color: TAB_BAR_TEXT_COLOR,
    selectedColor: TAB_BAR_SELECTED_COLOR,
    backgroundColor: TAB_BAR_BACKGROUND_COLOR,
    borderStyle: 'white',
    list: APP_TAB_BAR_LIST,
  },
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: NAVIGATION_BAR_BACKGROUND_COLOR,
    navigationBarTitleText: 'Pilates Studio',
    navigationBarTextStyle: 'black',
    navigationStyle: 'default'
  },
  networkTimeout: {
    request: 30000,
    connectSocket: 30000,
    uploadFile: 30000,
    downloadFile: 30000,
  },
  usingComponents: {}
});
