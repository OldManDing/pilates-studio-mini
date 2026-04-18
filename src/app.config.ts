const NAVIGATION_BAR_BACKGROUND_COLOR = '#FFFDF9';
const TAB_BAR_TEXT_COLOR = '#D0CCC6';
const TAB_BAR_SELECTED_COLOR = '#1A1A1A';
const TAB_BAR_BACKGROUND_COLOR = '#FFFFFF';

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/courses/index',
    'pages/course-detail/index',
    'pages/coaches/index',
    'pages/coach-detail/index',
    'pages/membership/index',
    'pages/my-bookings/index',
    'pages/profile/index',
    'pages/notifications/index',
    'pages/help/index',
    'pages/settings/index',
    'pages/transactions/index',
  ],
  tabBar: {
    custom: true,
    color: TAB_BAR_TEXT_COLOR,
    selectedColor: TAB_BAR_SELECTED_COLOR,
    backgroundColor: TAB_BAR_BACKGROUND_COLOR,
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/courses/index',
        text: '预约',
        iconPath: 'assets/tabbar/course.png',
        selectedIconPath: 'assets/tabbar/course-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: NAVIGATION_BAR_BACKGROUND_COLOR,
    navigationBarTitleText: 'Pilates Studio',
    navigationBarTextStyle: 'black',
    navigationStyle: 'default'
  },
  usingComponents: {}
});
