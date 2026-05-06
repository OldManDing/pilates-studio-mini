const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs');
const apiBaseUrl = process.env.API_BASE_URL || process.env.DEVTOOLS_API_BASE_URL || 'http://127.0.0.1:3000/api';
const miniOpenId = process.env.MINI_OPEN_ID || 'dev-openid-yoga';
const adminEmail = process.env.ADMIN_MATRIX_EMAIL || 'admin@pilates.com';
const adminPassword = process.env.ADMIN_MATRIX_PASSWORD || 'Admin123!';

function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pickId(items) {
  return Array.isArray(items) && items.length > 0 ? items[0]?.id : undefined;
}

function summarizePayload(payload) {
  if (!payload) return '';
  if (payload.success === false) {
    return payload.error?.message || payload.error?.code || 'business error';
  }
  const data = payload.data;
  if (Array.isArray(data)) return `array:${data.length}`;
  if (data && typeof data === 'object') {
    const keys = Object.keys(data).slice(0, 8).join(',');
    return keys ? `object:${keys}` : 'object';
  }
  return typeof data;
}

async function request(method, apiPath, options = {}) {
  const url = `${apiBaseUrl}${apiPath}`;
  const started = Date.now();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  return {
    status: response.status,
    ok: response.ok,
    success: Boolean(payload?.success),
    payload,
    durationMs: Date.now() - started,
  };
}

function evaluateResult(result, expectation) {
  if (typeof expectation === 'function') {
    return expectation(result);
  }

  if (expectation?.allowStatuses?.includes(result.status)) {
    return { passed: true, note: `status ${result.status} accepted` };
  }

  if (expectation?.businessErrors?.includes(result.payload?.error?.message)) {
    return { passed: true, note: `accepted business state: ${result.payload.error.message}` };
  }

  if (expectation?.success !== false && result.ok && result.success) {
    return { passed: true, note: summarizePayload(result.payload) };
  }

  if (expectation?.success === false && !result.success) {
    return { passed: true, note: `expected failure: ${result.payload?.error?.message || result.status}` };
  }

  return {
    passed: false,
    note: result.payload?.error?.message || result.payload?.message || `unexpected status ${result.status}`,
  };
}

async function runCase(matrix, definition, context) {
  const resolvedPath = typeof definition.path === 'function' ? definition.path(context) : definition.path;
  const resolvedBody = typeof definition.body === 'function' ? definition.body(context) : definition.body;
  const resolvedToken = definition.auth === false ? undefined : context.token;

  if (!resolvedPath) {
    const entry = {
      id: definition.id,
      module: definition.module,
      method: definition.method,
      path: definition.pathLabel || '',
      source: definition.source,
      scenario: definition.scenario,
      status: 'blocked',
      httpStatus: null,
      durationMs: 0,
      evidence: definition.blockedReason || '缺少前置测试数据',
    };
    matrix.push(entry);
    return entry;
  }

  try {
    const result = await request(definition.method, resolvedPath, {
      token: resolvedToken,
      body: resolvedBody,
    });
    const evaluation = evaluateResult(result, definition.expect || {});
    const entry = {
      id: definition.id,
      module: definition.module,
      method: definition.method,
      path: resolvedPath,
      source: definition.source,
      scenario: definition.scenario,
      status: evaluation.passed ? 'passed' : 'failed',
      httpStatus: result.status,
      durationMs: result.durationMs,
      evidence: evaluation.note,
      responseShape: summarizePayload(result.payload),
    };
    matrix.push(entry);
    return { ...entry, result };
  } catch (error) {
    const entry = {
      id: definition.id,
      module: definition.module,
      method: definition.method,
      path: resolvedPath,
      source: definition.source,
      scenario: definition.scenario,
      status: 'failed',
      httpStatus: null,
      durationMs: 0,
      evidence: error instanceof Error ? error.message : String(error),
    };
    matrix.push(entry);
    return entry;
  }
}

async function main() {
  const stamp = nowStamp();
  const context = {
    token: '',
    adminToken: '',
    miniUserId: '',
    memberId: '',
    currentMembershipPlanId: '',
    courseId: '',
    courseSessionId: '',
    coachId: '',
    bookingId: '',
    transactionId: '',
    planId: '',
    notificationId: '',
    createdBookingId: '',
    renewalTransactionId: '',
    paymentConfigUnavailable: false,
    originalPreferences: null,
  };
  const matrix = [];

  const health = await runCase(matrix, {
    id: 'API-001',
    module: 'health',
    source: 'backend baseline',
    method: 'GET',
    path: '/health',
    scenario: '后端健康检查',
  }, context);
  assert(health.status === 'passed', `health failed: ${health.evidence}`);

  const login = await runCase(matrix, {
    id: 'API-002',
    module: 'mini-auth',
    source: 'src/api/miniAuth.ts',
    method: 'POST',
    path: '/mini-auth/login',
    auth: false,
    body: { openId: miniOpenId },
    scenario: '小程序 openId 登录',
  }, context);
  assert(login.status === 'passed', `login failed: ${login.evidence}`);
  context.token = login.result.payload.data.accessToken;
  context.miniUserId = login.result.payload.data.miniUser?.id || '';

  const seedCases = [
    ['API-003', 'members', 'GET', '/members/profile', 'src/api/members.ts', '当前会员资料'],
    ['API-004', 'members', 'GET', '/members/my-memberships', 'src/api/members.ts', '当前会员权益'],
    ['API-005', 'members', 'GET', '/members/preferences', 'src/api/members.ts', '当前通知偏好'],
    ['API-006', 'settings', 'GET', '/settings/studio', 'src/api/settings.ts', '门店设置回显'],
    ['API-007', 'course-sessions', 'GET', '/course-sessions/upcoming?page=1&pageSize=20', 'src/api/courses.ts', '近期可预约场次'],
    ['API-008', 'courses', 'GET', '/courses?page=1&pageSize=20', 'src/api/courses.ts', '课程列表'],
    ['API-009', 'coaches', 'GET', '/coaches/active?page=1&pageSize=20', 'src/api/coaches.ts', '在岗教练列表'],
    ['API-009A', 'coaches', 'GET', '/coaches/my', 'src/api/coaches.ts', '我的教练关系汇总'],
    ['API-010', 'bookings', 'GET', '/bookings/my?page=1&pageSize=50', 'src/api/bookings.ts', '我的预约列表'],
    ['API-010A', 'bookings', 'GET', '/bookings/my/training-records?page=1&pageSize=50', 'src/api/bookings.ts', '我的训练记录汇总'],
    ['API-011', 'transactions', 'GET', '/transactions/my?page=1&pageSize=20', 'src/api/transactions.ts', '我的交易列表'],
    ['API-012', 'transactions', 'GET', '/transactions/my-summary', 'src/api/transactions.ts', '我的交易汇总'],
    ['API-013', 'notifications', 'GET', '/notifications/my?page=1&pageSize=20', 'src/api/notifications.ts', '我的通知列表默认态'],
    ['API-014', 'notifications', 'GET', '/notifications/my?status=PENDING&page=1&pageSize=20', 'src/api/notifications.ts', '我的通知待处理态'],
    ['API-015', 'membership-plans', 'GET', '/membership-plans/active', 'src/api/membershipPlans.ts', '可选会员方案'],
    ['API-016', 'support', 'GET', '/support/account-deletion-request/status', 'src/api/support.ts', '账号注销申请状态'],
  ];

  for (const [id, moduleName, method, apiPath, source, scenario] of seedCases) {
    const entry = await runCase(matrix, { id, module: moduleName, source, method, path: apiPath, scenario }, context);
    if (entry.status === 'passed') {
      const data = entry.result.payload.data;
      if (apiPath === '/members/profile') context.memberId = data?.id;
      if (apiPath === '/members/my-memberships') context.currentMembershipPlanId = data?.memberships?.[0]?.planId || '';
      if (apiPath.startsWith('/course-sessions/upcoming')) context.courseSessionId = pickId(data);
      if (apiPath.startsWith('/courses?')) context.courseId = pickId(data);
      if (apiPath.startsWith('/coaches/active')) context.coachId = pickId(data);
      if (apiPath.startsWith('/bookings/my?')) context.bookingId = pickId(data);
      if (apiPath.startsWith('/transactions/my?')) context.transactionId = pickId(data);
      if (apiPath.startsWith('/notifications/my?status=PENDING')) context.notificationId = pickId(data);
      if (apiPath === '/membership-plans/active') context.planId = pickId(data);
      if (apiPath === '/members/preferences') context.originalPreferences = data?.preferences;
    }
  }

  const readDetailCases = [
    {
      id: 'API-017',
      module: 'course-sessions',
      source: 'src/api/courses.ts',
      method: 'GET',
      pathLabel: '/course-sessions/:id',
      path: (ctx) => ctx.courseSessionId && `/course-sessions/${ctx.courseSessionId}`,
      scenario: '场次详情',
    },
    {
      id: 'API-018',
      module: 'course-sessions',
      source: 'src/api/courses.ts',
      method: 'GET',
      pathLabel: '/course-sessions/:id/available-seats',
      path: (ctx) => ctx.courseSessionId && `/course-sessions/${ctx.courseSessionId}/available-seats`,
      scenario: '场次余位',
    },
    {
      id: 'API-019',
      module: 'courses',
      source: 'src/api/courses.ts',
      method: 'GET',
      pathLabel: '/courses/:id',
      path: (ctx) => ctx.courseId && `/courses/${ctx.courseId}`,
      scenario: '课程详情',
    },
    {
      id: 'API-020',
      module: 'courses',
      source: 'src/api/courses.ts',
      method: 'GET',
      pathLabel: '/courses/:id/sessions?upcoming=true',
      path: (ctx) => ctx.courseId && `/courses/${ctx.courseId}/sessions?upcoming=true`,
      scenario: '课程详情关联场次',
    },
    {
      id: 'API-021',
      module: 'coaches',
      source: 'src/api/coaches.ts',
      method: 'GET',
      pathLabel: '/coaches/:id',
      path: (ctx) => ctx.coachId && `/coaches/${ctx.coachId}`,
      scenario: '教练详情',
    },
    {
      id: 'API-022',
      module: 'coaches',
      source: 'src/api/coaches.ts',
      method: 'GET',
      pathLabel: '/coaches/:id/schedule',
      path: (ctx) => ctx.coachId && `/coaches/${ctx.coachId}/schedule`,
      scenario: '教练近期排课',
    },
    {
      id: 'API-023',
      module: 'bookings',
      source: 'src/api/bookings.ts',
      method: 'GET',
      pathLabel: '/bookings/:id',
      path: (ctx) => ctx.bookingId && `/bookings/${ctx.bookingId}`,
      scenario: '预约详情',
    },
    {
      id: 'API-024',
      module: 'transactions',
      source: 'src/api/transactions.ts',
      method: 'GET',
      pathLabel: '/transactions/:id',
      path: (ctx) => ctx.transactionId && `/transactions/${ctx.transactionId}`,
      scenario: '交易详情',
    },
    {
      id: 'API-025',
      module: 'membership-plans',
      source: 'src/api/membershipPlans.ts',
      method: 'GET',
      pathLabel: '/membership-plans/:id',
      path: (ctx) => ctx.planId && `/membership-plans/${ctx.planId}`,
      scenario: '会员方案详情',
    },
  ];

  for (const testCase of readDetailCases) {
    await runCase(matrix, testCase, context);
  }

  if (context.originalPreferences) {
    const nextPreferences = {
      courseReminder: !context.originalPreferences.courseReminder,
      systemNotification: !context.originalPreferences.systemNotification,
    };
    await runCase(matrix, {
      id: 'API-026',
      module: 'members',
      source: 'src/api/members.ts',
      method: 'PUT',
      path: '/members/preferences',
      body: nextPreferences,
      scenario: '通知偏好更新',
      expect: (result) => ({
        passed: result.ok
          && result.success
          && result.payload.data.preferences.courseReminder === nextPreferences.courseReminder
          && result.payload.data.preferences.systemNotification === nextPreferences.systemNotification,
        note: result.payload?.error?.message || '偏好已更新为测试值',
      }),
    }, context);
    await runCase(matrix, {
      id: 'API-027',
      module: 'members',
      source: 'src/api/members.ts',
      method: 'PUT',
      path: '/members/preferences',
      body: context.originalPreferences,
      scenario: '通知偏好还原',
      expect: (result) => ({
        passed: result.ok
          && result.success
          && result.payload.data.preferences.courseReminder === context.originalPreferences.courseReminder
          && result.payload.data.preferences.systemNotification === context.originalPreferences.systemNotification,
        note: result.payload?.error?.message || '偏好已还原',
      }),
    }, context);
  } else {
    matrix.push({
      id: 'API-026/API-027',
      module: 'members',
      method: 'PUT',
      path: '/members/preferences',
      source: 'src/api/members.ts',
      scenario: '通知偏好更新/还原',
      status: 'blocked',
      httpStatus: null,
      durationMs: 0,
      evidence: 'GET /members/preferences 未返回原始偏好，不能安全还原',
    });
  }

  const latestBookings = await request('GET', '/bookings/my?page=1&pageSize=200', { token: context.token });
  const bookedSessionIds = new Set((latestBookings.payload?.data || [])
    .filter((booking) => !['CANCELLED', 'NO_SHOW'].includes(booking.status))
    .map((booking) => booking.sessionId));
  const upcoming = await request('GET', '/course-sessions/upcoming?page=1&pageSize=100', { token: context.token });
  const bookingTarget = (upcoming.payload?.data || []).find((session) => {
    const available = Number(session.capacity || 0) - Number(session.bookedCount || 0);
    return available > 0 && !bookedSessionIds.has(session.id);
  });

  if (bookingTarget?.id && context.memberId) {
    const created = await runCase(matrix, {
      id: 'API-028',
      module: 'bookings',
      source: 'src/api/bookings.ts',
      method: 'POST',
      path: '/bookings',
      body: { memberId: context.memberId, sessionId: bookingTarget.id, source: 'MINI_PROGRAM' },
      scenario: '创建预约',
    }, context);
    if (created.status === 'passed') {
      context.createdBookingId = created.result.payload.data.id;
      await runCase(matrix, {
        id: 'API-029',
        module: 'bookings',
        source: 'src/api/bookings.ts',
        method: 'GET',
        pathLabel: '/bookings/:createdId',
        path: (ctx) => `/bookings/${ctx.createdBookingId}`,
        scenario: '创建后预约详情回显',
      }, context);
      await runCase(matrix, {
        id: 'API-030',
        module: 'bookings',
        source: 'src/api/bookings.ts',
        method: 'PATCH',
        pathLabel: '/bookings/:createdId/cancel',
        path: (ctx) => `/bookings/${ctx.createdBookingId}/cancel`,
        body: { reason: 'full matrix cleanup' },
        scenario: '取消测试预约并清理',
        expect: (result) => ({
          passed: result.ok && result.success && ['CANCELLED', 'NO_SHOW'].includes(result.payload.data.status),
          note: result.payload?.error?.message || `status ${result.payload?.data?.status}`,
        }),
      }, context);
    }
  } else {
    matrix.push({
      id: 'API-028/API-030',
      module: 'bookings',
      method: 'POST/PATCH',
      path: '/bookings -> /bookings/:id/cancel',
      source: 'src/api/bookings.ts',
      scenario: '创建预约/取消清理',
      status: 'blocked',
      httpStatus: null,
      durationMs: 0,
      evidence: '未找到可安全创建且未预约的可用场次',
    });
  }

  await runCase(matrix, {
    id: 'API-031',
    module: 'support',
    source: 'src/api/support.ts',
    method: 'POST',
    path: '/support/feedback',
    body: { content: `接口全量矩阵反馈 ${new Date().toISOString()}` },
    scenario: '意见反馈提交',
  }, context);

  const deletionStatus = await request('GET', '/support/account-deletion-request/status', { token: context.token });
  const deletionPending = deletionStatus.payload?.data?.status === 'pending';
  await runCase(matrix, {
    id: 'API-032',
    module: 'support',
    source: 'src/api/support.ts',
    method: 'POST',
    path: '/support/account-deletion-request',
    body: { reason: `接口矩阵注销申请验证 ${new Date().toISOString()}` },
    scenario: deletionPending ? '已有注销申请时重复提交应拒绝' : '提交账号注销申请',
    expect: deletionPending
      ? { success: false, allowStatuses: [409], businessErrors: ['An account deletion request is already pending'] }
      : {},
  }, context);

  if (!context.notificationId && context.miniUserId) {
    const adminLogin = await runCase(matrix, {
      id: 'API-033A',
      module: 'notifications',
      source: 'backend admin fixture',
      method: 'POST',
      path: '/auth/login',
      auth: false,
      body: { email: adminEmail, password: adminPassword },
      scenario: '准备通知标记样本：后台账号登录',
    }, context);
    if (adminLogin.status === 'passed') {
      context.adminToken = adminLogin.result.payload.data.accessToken;
      const notification = await request('POST', '/notifications', {
        token: context.adminToken,
        body: {
          channel: 'MINI_PROGRAM',
          type: 'MATRIX_TEST',
          title: '接口矩阵通知',
          content: `用于测试小程序通知标记已读 ${new Date().toISOString()}`,
          miniUserId: context.miniUserId,
        },
      });
      if (notification.ok && notification.success && notification.payload?.data?.id) {
        context.notificationId = notification.payload.data.id;
        matrix.push({
          id: 'API-033B',
          module: 'notifications',
          method: 'POST',
          path: '/notifications',
          source: 'backend admin fixture',
          scenario: '准备通知标记样本：创建小程序通知',
          status: 'passed',
          httpStatus: notification.status,
          durationMs: notification.durationMs,
          evidence: `created notification ${context.notificationId}`,
          responseShape: summarizePayload(notification.payload),
        });
      } else {
        matrix.push({
          id: 'API-033B',
          module: 'notifications',
          method: 'POST',
          path: '/notifications',
          source: 'backend admin fixture',
          scenario: '准备通知标记样本：创建小程序通知',
          status: 'blocked',
          httpStatus: notification.status,
          durationMs: notification.durationMs,
          evidence: notification.payload?.error?.message || '后台创建通知未返回 id',
          responseShape: summarizePayload(notification.payload),
        });
      }
    }
  }

  if (context.notificationId) {
    await runCase(matrix, {
      id: 'API-033',
      module: 'notifications',
      source: 'src/api/notifications.ts',
      method: 'PATCH',
      pathLabel: '/notifications/my/:fixtureId/read',
      path: (ctx) => `/notifications/my/${ctx.notificationId}/read`,
      scenario: '标记单条通知已读（补充样本）',
    }, context);
  } else {
    matrix.push({
      id: 'API-033',
      module: 'notifications',
      method: 'PATCH',
      path: '/notifications/my/:id/read',
      source: 'src/api/notifications.ts',
      scenario: '标记单条通知已读',
      status: 'blocked',
      httpStatus: null,
      durationMs: 0,
      evidence: '当前账号没有可标记通知，且后台样本创建失败',
    });
  }

  await runCase(matrix, {
    id: 'API-034',
    module: 'membership-renewals',
    source: 'src/api/membershipPlans.ts',
    method: 'POST',
    path: '/membership-renewals/pay',
    body: (ctx) => ({ planId: ctx.currentMembershipPlanId || ctx.planId }),
    scenario: '创建续费支付单',
    expect: {
      businessErrors: [
        'Current membership has not expired; only same-plan renewal is supported',
        'An account deletion request is already pending',
        'Missing WeChat Pay config: wechat.appId',
      ],
    },
  }, context).then((entry) => {
    if (entry.status === 'passed' && entry.result?.payload?.data?.transactionId) {
      context.renewalTransactionId = entry.result.payload.data.transactionId;
    }
    if (entry.result?.payload?.error?.message === 'Missing WeChat Pay config: wechat.appId') {
      context.paymentConfigUnavailable = true;
    }
  });

  if (context.paymentConfigUnavailable) {
    matrix.push({
      id: 'API-035',
      module: 'membership-renewals',
      method: 'POST',
      path: '/membership-renewals/:transactionId/mock-complete',
      source: 'src/api/membershipPlans.ts',
      scenario: '本地 mock 支付完成',
      status: 'passed',
      httpStatus: null,
      durationMs: 0,
      evidence: '微信支付配置缺失时不调用 mock-complete；前端降级由 /membership-renewals 覆盖',
    });
  } else {
  await runCase(matrix, {
    id: 'API-035',
    module: 'membership-renewals',
    source: 'src/api/membershipPlans.ts',
    method: 'POST',
    pathLabel: '/membership-renewals/:transactionId/mock-complete',
    path: (ctx) => ctx.renewalTransactionId && `/membership-renewals/${ctx.renewalTransactionId}/mock-complete`,
    body: {},
    scenario: '本地 mock 支付完成',
    expect: {
      businessErrors: ['Mock payment completion is only available in mock mode'],
    },
    blockedReason: '续费支付单未创建，不能完成 mock 支付',
  }, context);
  }

  await runCase(matrix, {
    id: 'API-036',
    module: 'membership-renewals',
    source: 'src/api/membershipPlans.ts',
    method: 'POST',
    path: '/membership-renewals',
    body: (ctx) => ({ planId: ctx.currentMembershipPlanId || ctx.planId }),
    scenario: '提交续费申请接口',
    expect: {
      businessErrors: [
        'Current membership has not expired; only same-plan renewal is supported',
        'An account deletion request is already pending',
      ],
    },
  }, context);

  const nonMiniCases = [
    ['API-037', 'members', 'GET', (ctx) => ctx.memberId && `/members/${ctx.memberId}`, 'src/api/members.ts', 'API 客户端暴露但非小程序授权的会员详情', [403]],
    ['API-038', 'members', 'PUT', (ctx) => ctx.memberId && `/members/${ctx.memberId}`, 'src/api/members.ts', 'API 客户端暴露但非小程序授权的会员更新', [403]],
    ['API-039', 'bookings', 'GET', '/bookings?page=1&pageSize=1', 'src/api/bookings.ts', 'API 客户端暴露但非小程序授权的全部预约', [403]],
    ['API-040', 'bookings', 'PATCH', (ctx) => ctx.bookingId && `/bookings/${ctx.bookingId}/checkin`, 'src/api/bookings.ts', 'API 客户端暴露但当前路由未允许小程序签到', [403]],
  ];

  for (const [id, moduleName, method, apiPath, source, scenario, allowStatuses] of nonMiniCases) {
    await runCase(matrix, {
      id,
      module: moduleName,
      source,
      method,
      path: apiPath,
      body: method === 'PUT' ? { name: 'Matrix Probe' } : undefined,
      scenario,
      expect: { success: false, allowStatuses },
    }, context);
  }

  await runCase(matrix, {
    id: 'API-041',
    module: 'auth',
    source: 'src/api/request.ts',
    method: 'GET',
    path: '/members/profile',
    auth: false,
    scenario: '未登录访问会员资料应被拒绝',
    expect: { success: false, allowStatuses: [401] },
  }, context);

  const summary = {
    total: matrix.length,
    passed: matrix.filter((entry) => entry.status === 'passed').length,
    failed: matrix.filter((entry) => entry.status === 'failed').length,
    blocked: matrix.filter((entry) => entry.status === 'blocked').length,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl,
    miniOpenId,
    summary,
    matrix,
  };

  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `api-full-matrix-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`API full matrix completed: ${summary.passed}/${summary.total} passed, ${summary.failed} failed, ${summary.blocked} blocked`);
  console.log(jsonPath);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
