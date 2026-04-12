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
    'pages/transactions/index',
  ],
  tabBar: {
    custom: false,
    color: '#D0CCC6',
    selectedColor: '#1A1A1A',
    backgroundColor: '#FFFDF9',
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
    navigationBarBackgroundColor: '#FFFDF9',
    navigationBarTitleText: 'Pilates Studio',
    navigationBarTextStyle: 'black',
    navigationStyle: 'default'
  },
  usingComponents: {}
});
