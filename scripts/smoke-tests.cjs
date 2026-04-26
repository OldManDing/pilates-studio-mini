const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(file, expected) {
  const content = read(file);
  assert(content.includes(expected), `${file} 缺少: ${expected}`);
}

function assertNotIncludes(file, forbidden) {
  const content = read(file);
  assert(!content.includes(forbidden), `${file} 不应包含: ${forbidden}`);
}

const appConfig = read('src/app.config.ts');
const taroConfig = read('config/index.js');
const envExample = read('.env.example');
const projectConfig = JSON.parse(read('project.config.json'));
const packageJson = JSON.parse(read('package.json'));

assertIncludes('config/index.js', "fallbackApiBaseUrl = process.env.NODE_ENV === 'production'");
assertIncludes('config/index.js', "outputRoot: 'dist'");
assertIncludes('config/index.js', "MINI_OPEN_ID: JSON.stringify(process.env.MINI_OPEN_ID || '')");
assertIncludes('.env.example', 'API_BASE_URL=http://127.0.0.1:3000/api');
assertIncludes('.env.example', 'MINI_OPEN_ID=');
assertNotIncludes('config/index.js', 'api.example.com');
assertNotIncludes('.env.example', 'api.example.com');
assert(projectConfig.miniprogramRoot === 'dist/', `project.config.json miniprogramRoot 异常: ${projectConfig.miniprogramRoot}`);
assert(packageJson.scripts.test === 'npm run verify', 'package.json test 应执行完整 verify');
assert(packageJson.scripts['test:api'] === 'node scripts/api-smoke.cjs', 'package.json 缺少 test:api 脚本');

const registeredPages = appConfig.match(/'pages\/[a-z-]+\/index'/g) || [];
assert(registeredPages.length === 18, `app.config.ts 页面数量异常: ${registeredPages.length}`);
assertIncludes('src/app.config.ts', 'custom: true');
assertIncludes('src/constants/navigation.ts', "pagePath: 'pages/index/index'");
assertIncludes('src/constants/navigation.ts', "pagePath: 'pages/courses/index'");
assertIncludes('src/constants/navigation.ts', "pagePath: 'pages/profile/index'");

[
  'pages/index/index',
  'pages/courses/index',
  'pages/course-detail/index',
  'pages/coaches/index',
  'pages/coach-detail/index',
  'pages/membership/index',
  'pages/training-records/index',
  'pages/my-coaches/index',
  'pages/membership-renew/index',
  'pages/my-bookings/index',
  'pages/profile/index',
  'pages/notifications/index',
  'pages/help/index',
  'pages/settings/index',
  'pages/account-security/index',
  'pages/agreement/index',
  'pages/privacy/index',
  'pages/transactions/index',
].forEach((pagePath) => assert(appConfig.includes(pagePath), `app.config.ts 未注册 ${pagePath}`));

assertIncludes('src/pages/settings/index.tsx', "Taro.removeStorageSync('token')");
assertIncludes('src/api/request.ts', "Taro.removeStorageSync('token')");
assertIncludes('src/api/request.ts', '登录已过期，请重新登录');
assertIncludes('src/pages/settings/index.tsx', 'membersApi.requestAccountDeletion');
assertIncludes('src/pages/settings/index.tsx', 'Taro.setNavigationBarColor');
assertIncludes('src/pages/settings/index.tsx', "Taro.switchTab({ url: '/pages/index/index' })");
assertNotIncludes('src/pages/settings/index.tsx', 'Taro.clearStorageSync');
assertIncludes('src/pages/my-bookings/index.tsx', "status: 'PENDING'");
assertIncludes('src/pages/my-bookings/index.tsx', "status: 'CONFIRMED'");
assertIncludes('src/pages/my-bookings/index.tsx', '取消失败，请稍后重试');
assertIncludes('src/pages/membership/index.tsx', 'membership.totalCredits <= 0');
assertIncludes('src/pages/index/index.tsx', '当前权益为无限次');
assertIncludes('src/pages/profile/index.tsx', '无限次权益');
assertIncludes('src/pages/courses/index.tsx', 'handleCourseItemClick');
assertIncludes('src/pages/courses/index.tsx', 'formatDateKey(date) === selectedDate?.dateValue');
assertIncludes('src/pages/courses/index.tsx', "['MAT', 'REFORMER', 'CADILLAC', 'CHAIR', 'BARREL']");
assertIncludes('src/pages/courses/index.tsx', 'courseSessionsApi.getUpcoming');
assertNotIncludes('src/pages/courses/index.tsx', 'coursesApi.getAll');
assertIncludes('src/pages/course-detail/index.tsx', 'profileLoadFailed');
assertIncludes('src/pages/membership-renew/index.tsx', 'membershipPlansApi.requestRenewal');
assertIncludes('src/pages/account-security/index.tsx', 'membersApi.changePassword');
assertIncludes('src/pages/help/index.tsx', 'supportApi.submitFeedback');
assertIncludes('src/pages/help/index.tsx', 'submittingFeedback');
assertNotIncludes('src/pages/help/index.tsx', '选择「修改手机号」');
assertIncludes('src/pages/help/index.tsx', 'Taro.makePhoneCall');
assertIncludes('src/pages/help/index.tsx', 'Taro.setClipboardData');
assertIncludes('src/pages/courses/index.tsx', 'loadFailed');
assertIncludes('src/pages/courses/index.tsx', '课程加载失败');
assertIncludes('src/pages/my-bookings/index.tsx', 'loadingMore');
assertIncludes('src/pages/my-bookings/index.tsx', '预约加载失败');
assertIncludes('src/pages/transactions/index.tsx', 'loadingMore');
assertIncludes('src/pages/transactions/index.tsx', '消费记录加载失败');
assertIncludes('src/pages/coaches/index.tsx', 'loadingMore');
assertIncludes('src/pages/coaches/index.tsx', '教练加载失败');
assertIncludes('src/pages/training-records/index.tsx', '训练记录加载失败');
assertIncludes('src/pages/membership-renew/index.tsx', '会员方案加载失败');
assertIncludes('src/pages/notifications/index.tsx', 'readStorage(STORAGE_KEYS.notifications');
assertIncludes('src/pages/notifications/index.tsx', 'writeStorage(STORAGE_KEYS.notifications');
assertIncludes('src/pages/training-records/index.tsx', "status: 'COMPLETED'");
assertIncludes('src/pages/training-records/index.tsx', 'currentPage += 1');
assertIncludes('src/pages/coaches/index.tsx', '/pages/coach-detail/index?id=');
assertIncludes('src/pages/coach-detail/index.tsx', "if (options?.id)");
assertIncludes('src/pages/coach-detail/index.tsx', "Empty title='教练不存在'");
assertIncludes('src/api/request.ts', 'ApiBusinessError');
assertIncludes('src/api/request.ts', 'normalizedParams.pageSize = value');
assertIncludes('src/api/request.ts', 'wrapListData');
assertIncludes('src/api/request.ts', 'wrapObjectData');
assertIncludes('src/api/support.ts', '/support/feedback');
assertIncludes('src/api/miniAuth.ts', '/mini-auth/login');
assertIncludes('src/api/miniAuth.ts', "Taro.setStorageSync('token'");
assertIncludes('src/api/auth.ts', 'ensureMiniProgramAuth');
assertIncludes('src/api/auth.ts', "url: `${API_BASE_URL}/mini-auth/login`");
assertIncludes('src/api/auth.ts', 'AUTH_FAILURE_COOLDOWN_MS = 5000');
assertIncludes('src/api/auth.ts', 'API_BASE_URL 未配置，无法完成小程序登录');
assertIncludes('src/app.tsx', 'ensureMiniProgramAuth().catch');
assertIncludes('src/api/request.ts', "url !== '/mini-auth/login'");
assertIncludes('scripts/api-smoke.cjs', '/mini-auth/login');
assertIncludes('scripts/api-smoke.cjs', '/members/profile');
assertIncludes('scripts/api-smoke.cjs', '/course-sessions/upcoming?page=1&pageSize=5');
assertIncludes('scripts/api-smoke.cjs', 'API_SMOKE_MUTATIONS');
assertIncludes('../pilates-studio-admin/backend/package.json', 'node dist/src/main.js');
assertIncludes('../pilates-studio-admin/backend/src/modules/mini-auth/mini-auth.service.ts', "configService.get<string>('wechat.appId')");
assertIncludes('../pilates-studio-admin/backend/src/modules/bookings/bookings.service.ts', 'Cannot create booking for another member');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.controller.ts', "@Controller('membership-renewals')");
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.service.ts', 'MEMBERSHIP_RENEWAL');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.service.ts', 'TransactionStatus.PENDING');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.service.ts', 'Math.random()');
assertNotIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/dto/create-membership-renewal.dto.ts', 'IsUUID');
assertNotIncludes('../pilates-studio-admin/backend/src/modules/bookings/dto/create-booking.dto.ts', 'IsUUID');
assertIncludes('../pilates-studio-admin/backend/src/modules/support/support.controller.ts', "@Post('feedback')");
assertIncludes('../pilates-studio-admin/backend/src/modules/support/support.service.ts', 'MINI_PROGRAM_FEEDBACK');
assertIncludes('../pilates-studio-admin/backend/src/modules/support/support.service.ts', 'Feedback content is required');
assertIncludes('../pilates-studio-admin/backend/src/modules/bookings/bookings.controller.ts', "@Patch(':id/checkin')");
assertIncludes('../pilates-studio-admin/backend/src/modules/bookings/bookings.service.ts', 'Cannot check in another member booking');
assertIncludes('../pilates-studio-admin/backend/src/modules/course-sessions/course-sessions.controller.ts', '@AllowMiniUser()');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-plans/membership-plans.controller.ts', '@AllowMiniUser()');
assertIncludes('../pilates-studio-admin/backend/src/modules/courses/courses.controller.ts', '@AllowMiniUser()');
assertIncludes('../pilates-studio-admin/backend/src/modules/coaches/coaches.controller.ts', '@AllowMiniUser()');
assertIncludes('src/api/transactions.ts', '/transactions/my');
assertIncludes('src/api/transactions.ts', '/transactions/my-summary');
assertIncludes('src/utils/storage.ts', "value === '' || value === undefined || value === null ? fallback : value");
assertNotIncludes('src/pages/courses/index.tsx', 'static-demo');
assertNotIncludes('src/pages/index/index.tsx', '静态壳阶段');
assertNotIncludes('src/api/request.ts', ': any');
assertNotIncludes('src/api/request.ts', '<T = any>');
assertNotIncludes('src/constants/storage.ts', 'renewalRequests');
assertNotIncludes('src/constants/storage.ts', 'passwordRequests');
assertNotIncludes('src/constants/storage.ts', 'feedback:');
assertNotIncludes('src/pages/course-detail/index.tsx', 'https://images.unsplash.com');
assertNotIncludes('src/pages/settings/index.tsx', '暂不可用');

console.log('Smoke tests passed');
