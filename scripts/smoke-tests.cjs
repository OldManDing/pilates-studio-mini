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

function assertFileExists(relativePath) {
  assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} is missing`);
}

const appConfig = read('src/app.config.ts');
const homePageConfig = read('src/pages/index/index.config.ts');
const navigation = read('src/constants/navigation.ts');
const taroConfig = read('config/index.js');
const envExample = read('.env.example');
const projectConfig = JSON.parse(read('project.config.json'));
const packageJson = JSON.parse(read('package.json'));
const registeredPagePaths = Array.from(appConfig.matchAll(/'pages\/[a-z-]+\/index'/g)).map((match) => match[0].slice(1, -1));

assertIncludes('config/index.js', "isProductionRelease = process.env.APP_ENV === 'production'");
assertIncludes('config/index.js', 'loadLocalEnv();');
assertIncludes('config/index.js', "path.resolve(__dirname, '../.env')");
assertIncludes('config/index.js', "process.env.MINI_RELEASE === 'true'");
assertIncludes('config/index.js', "process.env.CI === 'true' && process.env.NODE_ENV === 'production'");
assertIncludes('config/index.js', 'requiredProductionEnvKeys');
assertIncludes('config/index.js', 'localApiPattern');
assertIncludes('config/index.js', '生产发布 API_BASE_URL 不能使用 localhost 或 127.0.0.1');
assertIncludes('config/index.js', "outputRoot: 'dist'");
assertIncludes('config/index.js', "MINI_OPEN_ID: JSON.stringify(process.env.MINI_OPEN_ID || '')");
assertIncludes('config/index.js', 'DEVTOOLS_API_BASE_URL');
assertIncludes('config/index.js', 'ALLOW_INSECURE_REAL_DEVICE_API');
assertIncludes('config/index.js', 'USE_MINI_OPEN_ID_LOGIN');
assertIncludes('.gitignore', '.env');
assertIncludes('.env.example', 'API_BASE_URL=http://127.0.0.1:3000/api');
assertIncludes('.env.example', 'DEVTOOLS_API_BASE_URL=http://127.0.0.1:3000/api');
assertIncludes('.env.example', 'ALLOW_INSECURE_REAL_DEVICE_API=false');
assertIncludes('.env.example', 'USE_MINI_OPEN_ID_LOGIN=false');
assertIncludes('.env.example', 'APP_ENV=development');
assertIncludes('.env.example', 'SUPPORT_PHONE=');
assertIncludes('.env.example', 'SUPPORT_EMAIL=');
assertIncludes('.env.example', 'MINI_OPEN_ID=');
assertNotIncludes('config/index.js', 'api.example.com');
assertNotIncludes('.env.example', 'api.example.com');
assert(projectConfig.miniprogramRoot === 'dist/', `project.config.json miniprogramRoot 异常: ${projectConfig.miniprogramRoot}`);
assert(packageJson.scripts.test === 'npm run verify', 'package.json test 应执行完整 verify');
assert(packageJson.scripts['test:api'] === 'node scripts/api-smoke.cjs', 'package.json 缺少 test:api 脚本');

assert(packageJson.scripts.lint === 'eslint src', 'package.json missing lint script');
assert(packageJson.scripts.verify.includes('npm run lint'), 'package.json verify must include lint');
assert(packageJson.scripts['clean:dist'] === 'node scripts/clean-dist.cjs', 'package.json missing clean:dist script');
assert(packageJson.scripts['prebuild:weapp'] === 'npm run clean:dist', 'package.json build:weapp must clean dist first');
assertFileExists('src/index.html');

const registeredPages = appConfig.match(/'pages\/[a-z-]+\/index'/g) || [];
assert(registeredPages.length === 18, `app.config.ts 页面数量异常: ${registeredPages.length}`);
registeredPagePaths.forEach((pagePath) => {
  assertFileExists(`src/${pagePath}.tsx`);
  assertFileExists(`src/${pagePath}.scss`);
});

const pageDirectories = fs.readdirSync(path.join(root, 'src/pages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `pages/${entry.name}/index`)
  .sort();
assert(
  JSON.stringify(pageDirectories) === JSON.stringify([...registeredPagePaths].sort()),
  'src/pages directories and app.config.ts pages are out of sync',
);

Array.from(navigation.matchAll(/pagePath: '([^']+)'/g)).forEach((match) => {
  const pagePath = match[1];
  assert(registeredPagePaths.includes(pagePath), `navigation pagePath is not registered: ${pagePath}`);
});

Array.from(navigation.matchAll(/(?:iconPath|selectedIconPath): '([^']+)'/g)).forEach((match) => {
  assertFileExists(`src/${match[1]}`);
});

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
].forEach((pagePath) => {
  assert(appConfig.includes(pagePath), `app.config.ts 未注册 ${pagePath}`);
});
assertIncludes('src/pages/settings/index.tsx', 'clearAuthState');
assertIncludes('src/api/request.ts', 'clearAuthState');
assertIncludes('src/utils/storage.ts', "Taro.removeStorageSync('token')");
assertIncludes('src/api/request.ts', '登录已过期，请重新登录');
assertIncludes('src/pages/settings/index.tsx', '提交注销申请');
assertIncludes('src/pages/settings/index.tsx', 'supportApi.submitAccountDeletionRequest');
assertNotIncludes('src/pages/settings/index.tsx', 'membersApi.requestAccountDeletion');
assertNotIncludes('src/pages/settings/index.tsx', '深色模式');
assertNotIncludes('src/pages/settings/index.tsx', 'darkMode');
assertNotIncludes('src/pages/settings/index.tsx', "label: '偏好'");
assertNotIncludes('src/pages/settings/index.tsx', "title: '语言'");
assertNotIncludes('src/pages/settings/index.tsx', '简体中文');
assertNotIncludes('src/pages/settings/index.tsx', 'Taro.setNavigationBarColor');
assertNotIncludes('src/pages/settings/index.tsx', 'Taro.setBackgroundColor');
assertIncludes('src/pages/settings/index.tsx', "Taro.switchTab({ url: '/pages/index/index' })");
assertNotIncludes('src/pages/settings/index.tsx', 'Taro.clearStorageSync');
assertIncludes('src/pages/my-bookings/index.tsx', "fetchAllBookingsByStatuses(['PENDING', 'CONFIRMED'])");
assertIncludes('src/pages/my-bookings/index.tsx', "fetchAllBookingsByStatuses(['CANCELLED', 'NO_SHOW'])");
assertIncludes('src/pages/my-bookings/index.tsx', '取消失败，请稍后重试');
assertIncludes('src/utils/membership.ts', '当前权益为无限次');
assertIncludes('src/utils/membership.ts', '无限次权益');
assertIncludes('src/utils/membership.ts', 'remainingCredits > totalCredits');
assertIncludes('src/pages/courses/index.tsx', 'handleCourseItemClick');
assertIncludes('src/pages/courses/index.tsx', 'formatDateKey(date) === selectedDate?.dateValue');
assertIncludes('src/pages/courses/index.tsx', "['MAT', 'REFORMER', 'CADILLAC', 'CHAIR', 'BARREL']");
assertIncludes('src/pages/courses/index.tsx', 'courseSessionsApi.getUpcoming');
assertNotIncludes('src/pages/courses/index.tsx', 'coursesApi.getAll');
assertIncludes('src/pages/course-detail/index.tsx', 'profileLoadFailed');
assertIncludes('src/pages/course-detail/index.tsx', 'sessionPickerOpen');
assertIncludes('src/pages/course-detail/index.tsx', '选择预约场次');
assertIncludes('src/pages/course-detail/index.tsx', 'requestBookingSubscribeAuthorization');
assertIncludes('src/utils/wechatSubscribe.ts', 'requestSubscribeMessage');
assertIncludes('config/index.js', 'WECHAT_SUBSCRIBE_TEMPLATE_IDS');
assertNotIncludes('src/pages/course-detail/index.tsx', 'showActionSheet');
assertIncludes('src/pages/membership-renew/index.tsx', 'membershipPlansApi.createRenewalPayment');
assertIncludes('src/pages/membership-renew/index.tsx', 'membershipPlansApi.completeMockRenewalPayment');
assertIncludes('src/pages/membership-renew/index.tsx', 'Taro.requestPayment');
assertIncludes('src/pages/membership-renew/index.tsx', 'submittedPlanId');
assertIncludes('src/pages/account-security/index.tsx', '手机号由门店会员档案同步');
assertNotIncludes('src/pages/account-security/index.tsx', '更换手机号');
assertNotIncludes('src/pages/account-security/index.tsx', '解除绑定');
assertNotIncludes('src/pages/account-security/index.tsx', 'showPhoneManageNotice');
assertNotIncludes('src/pages/account-security/index.tsx', 'membersApi.changePassword');
assertIncludes('src/pages/account-security/index.tsx', 'writeStorage(STORAGE_KEYS.settings');
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
assertIncludes('src/api/notifications.ts', '/notifications/my');
assertIncludes('src/api/notifications.ts', '/notifications/my/${id}/read');
assertIncludes('src/pages/notifications/index.tsx', 'notificationsApi.getMy');
assertIncludes('src/pages/notifications/index.tsx', '消息加载失败');
assertIncludes('src/pages/index/index.tsx', "progressValue: activeMembership ? getRemainingDays(activeMembership.endDate) : '待开通'");
assertIncludes('src/pages/index/index.tsx', 'progressPercent: activeMembership ? getMembershipProgressPercent(activeMembership) : 0');
assertIncludes('src/pages/index/index.tsx', '页面刷新提示');
assertIncludes('src/pages/index/index.tsx', '首页支持下拉刷新');
assertIncludes('src/constants/storage.ts', 'homeRefreshGuideShown');
assertIncludes('src/pages/index/index.config.ts', 'enablePullDownRefresh: true');
assertIncludes('src/custom-tab-bar/index.scss', 'font-size: $figma-small');
assert(homePageConfig.includes("backgroundColor: '#FAFAFA'"), '首页下拉刷新背景色未配置');
assertIncludes('src/pages/my-coaches/index.tsx', "loadFailed ? '--' : summaries.length");
assertIncludes('src/pages/my-coaches/index.tsx', 'coachesApi.getMine');
assertIncludes('src/api/coaches.ts', 'avatarUrl: raw.avatarUrl || avatar');
assertIncludes('src/api/courses.ts', 'avatarUrl: coach.avatarUrl || avatar');
assertIncludes('src/api/bookings.ts', 'avatarUrl: coach.avatarUrl || coachAvatar');
assertIncludes('src/pages/my-coaches/index.tsx', 'my-coaches-list__avatar-image');
assertIncludes('src/pages/index/index.tsx', 'home-page__section home-page__section--upcoming');
assertIncludes('src/pages/index/index.scss', '&__section--upcoming .section-title-block__action');
assertIncludes('src/pages/training-records/index.tsx', 'bookingsApi.getMyTrainingRecords');
assertIncludes('src/api/bookings.ts', '/bookings/my/training-records');
assertIncludes('src/api/transactions.ts', 'completedRevenue');
assertIncludes('src/pages/transactions/index.tsx', 'summary?.completedRevenue');
assertIncludes('src/pages/coaches/index.tsx', '/pages/coach-detail/index?id=');
assertIncludes('src/pages/coach-detail/index.tsx', "if (options?.id)");
assertIncludes('src/pages/coach-detail/index.tsx', 'coachesApi.getById(id)');
assertIncludes('src/pages/coach-detail/index.tsx', 'courseSummaryMap');
assertIncludes('src/pages/coach-detail/index.tsx', 'loadFailed');
assertIncludes('src/pages/coach-detail/index.tsx', '教练加载失败');
assertIncludes('src/pages/coach-detail/index.tsx', '教练不存在');
assertIncludes('src/api/coaches.ts', 'type BackendCoachSchedulePayload');
assertIncludes('src/api/coaches.ts', 'normalizeCoachSchedulePayload(response.data)');
assertIncludes('src/api/request.ts', 'ApiBusinessError');
assertIncludes('src/api/request.ts', 'normalizedParams.pageSize = value');
assertIncludes('src/api/request.ts', 'wrapListData');
assertIncludes('src/api/request.ts', 'wrapObjectData');
assertIncludes('src/api/support.ts', '/support/feedback');
assertIncludes('src/api/support.ts', '/support/account-deletion-request');
assertIncludes('src/api/miniAuth.ts', '/mini-auth/login');
assertIncludes('src/api/miniAuth.ts', "Taro.setStorageSync('token'");
assertIncludes('src/api/auth.ts', 'ensureMiniProgramAuth');
assertIncludes('src/api/auth.ts', 'getRuntimeApiBaseUrl');
assertIncludes('src/api/auth.ts', 'DEVTOOLS_API_BASE_URL');
assertIncludes('src/api/auth.ts', 'AUTH_FAILURE_COOLDOWN_MS = 5000');
assertIncludes('src/api/auth.ts', '接口地址未配置，无法完成小程序登录');
assertIncludes('src/api/auth.ts', '真机无法访问本地接口地址');
assertIncludes('src/api/auth.ts', '真机请求必须使用 HTTPS 合法域名');
assertIncludes('src/api/auth.ts', 'if (ALLOW_INSECURE_REAL_DEVICE_API)');
assertIncludes('src/api/auth.ts', 'shouldUseForcedMiniOpenIdLogin');
assertIncludes('src/api/auth.ts', "data: { openId: MINI_OPEN_ID }");
assertIncludes('src/api/auth.ts', "platform === 'devtools'");
assertIncludes('src/api/request.ts', 'getRuntimeApiBaseUrl()');
assertIncludes('src/api/auth.ts', 'Taro.login().catch');
assertIncludes('src/api/auth.ts', 'confirmLoginAuthorization');
assertIncludes('src/api/auth.ts', 'if (options.interactive && !forceMiniOpenIdLogin)');
assertIncludes('src/api/auth.ts', '授权登录');
assertIncludes('src/api/auth.ts', 'getUserProfile');
assertIncludes('src/api/request.ts', 'ensureMiniProgramAuth({ interactive: true })');
assertIncludes('src/pages/privacy/index.tsx', '保存期限');
assertIncludes('src/pages/privacy/index.tsx', '联系我们');
assertIncludes('src/pages/agreement/index.tsx', '费用与退款');
assertIncludes('src/pages/agreement/index.tsx', '争议与联系');
assertIncludes('src/pages/profile/index.tsx', 'requiresLogin: !member');
assertIncludes('src/pages/profile/components/ProfileMenuSection.tsx', '登录后查看');
assertIncludes('src/pages/coach-detail/index.tsx', 'Taro.makePhoneCall');
assertIncludes('src/pages/coach-detail/index.tsx', 'Taro.setClipboardData');
assertIncludes('src/api/request.ts', "url !== '/mini-auth/login'");
assertIncludes('scripts/api-smoke.cjs', '/mini-auth/login');
assertIncludes('scripts/api-smoke.cjs', '/members/profile');
assertIncludes('scripts/api-smoke.cjs', '/course-sessions/upcoming?page=1&pageSize=5');
assertIncludes('scripts/api-smoke.cjs', 'API_SMOKE_MUTATIONS');
assertIncludes('../pilates-studio-admin/backend/package.json', 'node dist/src/main.js');
assertIncludes('../pilates-studio-admin/backend/src/modules/mini-auth/mini-auth.service.ts', "configService.get<string>('wechat.appId')");
assertIncludes('../pilates-studio-admin/backend/src/modules/bookings/bookings.service.ts', 'Cannot create booking for another member');
assertIncludes('../pilates-studio-admin/backend/src/modules/bookings/bookings.service.ts', 'bookingCode: result.bookingCode');
assertIncludes('../pilates-studio-admin/backend/src/modules/notifications/notification-delivery.service.ts', 'buildWeChatTemplateData');
assertIncludes('../pilates-studio-admin/backend/src/modules/notifications/notification-delivery.service.ts', 'notifications.templateFields');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.controller.ts', "@Controller('membership-renewals')");
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.service.ts', 'MEMBERSHIP_RENEWAL');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.service.ts', 'TransactionStatus.PENDING');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.service.ts', 'createPendingRenewalTransaction');
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.controller.ts', "@Post('pay')");
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.controller.ts', "@Post('wechat/notify')");
assertIncludes('../pilates-studio-admin/backend/src/modules/membership-renewals/membership-renewals.controller.ts', "@Post(':transactionId/mock-complete')");
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
assertIncludes('src/utils/membership.ts', 'formatMembershipCreditsWithUnit');
assertIncludes('src/pages/index/index.tsx', 'formatMembershipDescription(membership)');
assertIncludes('src/pages/profile/index.tsx', 'formatMembershipCreditsWithUnit(activeMembership)');
assertIncludes('src/pages/membership/index.tsx', 'formatMembershipCredits(currentMembership)');
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
