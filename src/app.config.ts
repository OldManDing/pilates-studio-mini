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
    color: '#6f8198',
    selectedColor: '#43c7ab',
    backgroundColor: '#ffffff',
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
        text: '课程',
        iconPath: 'assets/tabbar/course.png',
        selectedIconPath: 'assets/tabbar/course-active.png'
      },
      {
        pagePath: 'pages/coaches/index',
        text: '教练',
        iconPath: 'assets/tabbar/coach.png',
        selectedIconPath: 'assets/tabbar/coach-active.png'
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
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'Pilates Studio',
    navigationBarTextStyle: 'black',
    navigationStyle: 'default'
  },
  usingComponents: {}
});
