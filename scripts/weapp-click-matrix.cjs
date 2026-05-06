const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs');
const automatorRoot = process.env.WEAPP_AUTOMATOR_ROOT || path.join(process.env.TEMP || '', 'weapp-automator-tools');
const automator = require(path.join(automatorRoot, 'node_modules/miniprogram-automator'));

const cliPath = process.env.WECHAT_DEVTOOLS_CLI || 'C:/Users/MrDing/AppData/Local/微信开发者工具/cli.bat';
const cliScriptPath = process.env.WECHAT_DEVTOOLS_CLI_SCRIPT || path.join(path.dirname(cliPath), 'cli.js');
const cliLauncherPath = process.env.WECHAT_DEVTOOLS_LAUNCHER || 'C:/Users/MrDing/AppData/Local/微信开发者工具/node.exe';
const projectPath = process.env.WEAPP_PROJECT_PATH || root;
const autoPort = Number(process.env.WEAPP_AUTO_PORT || 9428);
const wsEndpoint = process.env.WEAPP_WS_ENDPOINT || `ws://127.0.0.1:${autoPort}`;
const skipPageCounts = process.env.WEAPP_MATRIX_SKIP_PAGE_COUNTS === '1';
const routeWaitMs = Number(process.env.WEAPP_MATRIX_ROUTE_WAIT_MS || 4500);
const actionWaitMs = Number(process.env.WEAPP_MATRIX_ACTION_WAIT_MS || 3500);

function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRoute(route) {
  return route.startsWith('/') ? route.slice(1) : route;
}

function isTabRoute(route) {
  return ['pages/index/index', 'pages/courses/index', 'pages/profile/index'].includes(normalizeRoute(route));
}

async function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function enableAutomation() {
  if (!fs.existsSync(cliPath)) {
    return { ok: false, message: `微信开发者工具 CLI 不存在: ${cliPath}` };
  }

  try {
    childProcess.execFileSync(cliLauncherPath, [
      cliScriptPath,
      'auto',
      '--project',
      projectPath,
      '--auto-port',
      String(autoPort),
      '--lang',
      'zh',
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000,
    });
    return { ok: true, message: `auto enabled on ${wsEndpoint}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

async function connectMiniProgram() {
  try {
    return await withTimeout(automator.connect({ wsEndpoint }), 12000, 'connect existing auto session');
  } catch {
    // Fall through to launch / enable automation when the existing auto session is unavailable.
  }

  try {
    return await withTimeout(automator.launch({
      cliPath: cliLauncherPath,
      projectPath,
      port: autoPort,
      timeout: 60000,
      cwd: root,
      trustProject: true,
      args: [cliScriptPath],
    }), 70000, 'launch');
  } catch {
    const enabled = enableAutomation();
    if (!enabled.ok) {
      throw new Error(enabled.message);
    }
    await sleep(3000);
    return withTimeout(automator.connect({ wsEndpoint }), 12000, 'connect after auto');
  }
}

async function prepareMiniProgram(mp) {
  await sleep(1000);
  await mp.mockWxMethod('makePhoneCall', { errMsg: 'makePhoneCall:ok' });
  await mp.mockWxMethod('setClipboardData', { errMsg: 'setClipboardData:ok' });
  await mp.mockWxMethod('openLocation', { errMsg: 'openLocation:ok' });
  await mp.mockWxMethod('showModal', { confirm: false, cancel: true });
  await mp.mockWxMethod('showActionSheet', { tapIndex: 999 });
  await mp.mockWxMethod('requestPayment', { errMsg: 'requestPayment:ok' });
}

async function routeTo(mp, route) {
  const normalized = normalizeRoute(route);
  const url = `/${normalized}`;
  const current = await withTimeout(mp.currentPage(), 20000, `currentPage before ${url}`).catch(() => null);
  const currentPath = current?.path;

  if (isTabRoute(normalized)) {
    if (currentPath === normalized) {
      return current;
    }
    await withTimeout(mp.switchTab(url), 15000, `switchTab ${url}`).catch(async () => {
      await withTimeout(mp.reLaunch(url), 15000, `reLaunch fallback ${url}`);
    });
  } else {
    await withTimeout(mp.reLaunch(url), 15000, `reLaunch ${url}`);
  }
  await sleep(routeWaitMs);
  return withTimeout(mp.currentPage(), 20000, `currentPage ${url}`);
}

async function pageRootText(page) {
  const rootElement = await page.$('page');
  if (!rootElement) return '';
  return (await rootElement.text()).replace(/\s+/g, ' ').trim();
}

async function pageButtonCount(page) {
  const rootElement = await page.$('page');
  if (!rootElement) return 0;
  const wxml = await rootElement.wxml();
  return (wxml.match(/<button\b/g) || []).length;
}

async function getElement(page, selector, index = 0) {
  const elements = await page.$$(selector);
  if (!elements || elements.length <= index) {
    return { element: null, count: elements?.length || 0 };
  }
  return { element: elements[index], count: elements.length };
}

async function describeElement(element) {
  const description = {};
  try {
    description.text = (await element.text()).replace(/\s+/g, ' ').trim();
  } catch {
    description.text = '';
  }
  try {
    description.className = await element.attribute('class');
  } catch {
    description.className = '';
  }
  return description;
}

async function runCase(mp, testCase) {
  const started = Date.now();
  const result = {
    id: testCase.id,
    module: testCase.module,
    entry: testCase.entry,
    start: testCase.start,
    selector: testCase.selector || '',
    index: testCase.index || 0,
    expected: testCase.expectAbsent
      ? 'selector absent'
      : testCase.expectPath || testCase.expectText || testCase.expectClassContains || testCase.expectNative || '',
    status: 'failed',
    durationMs: 0,
    beforePath: '',
    afterPath: '',
    beforeText: '',
    afterText: '',
    element: {},
    evidence: '',
  };

  try {
    let page = await routeTo(mp, testCase.start);
    result.beforePath = page.path;
    result.beforeText = await pageRootText(page);

    if (testCase.before) {
      await testCase.before(mp, page);
      await sleep(500);
      page = await withTimeout(mp.currentPage(), 20000, `currentPage after before ${testCase.id}`);
    }

    if (testCase.nativeTabUrl) {
      await withTimeout(mp.switchTab(testCase.nativeTabUrl), 12000, `switchTab ${testCase.id}`);
      await sleep(testCase.waitMs || actionWaitMs);
      page = await withTimeout(mp.currentPage(), 20000, `currentPage after ${testCase.id}`);
      result.afterPath = page.path;
      result.afterText = await pageRootText(page);

      if (testCase.expectPath && page.path !== normalizeRoute(testCase.expectPath)) {
        result.evidence = `expected path ${normalizeRoute(testCase.expectPath)}, got ${page.path}`;
      } else {
        result.status = 'passed';
        result.evidence = `switchTab route verified: ${page.path}`;
      }

      result.durationMs = Date.now() - started;
      return result;
    }

    const { element, count } = await getElement(page, testCase.selector, testCase.index || 0);
    if (testCase.expectAbsent) {
      result.afterPath = page.path;
      result.afterText = result.beforeText;
      if (count === 0) {
        result.status = 'passed';
        result.evidence = `selector absent as expected: ${testCase.selector}`;
      } else {
        result.evidence = `selector should be absent but count=${count}`;
      }
      result.durationMs = Date.now() - started;
      return result;
    }

    if (!element) {
      result.status = testCase.optional ? 'not-rendered' : 'blocked';
      result.evidence = `selector not found: ${testCase.selector}; count=${count}`;
      result.durationMs = Date.now() - started;
      return result;
    }

    result.element = await describeElement(element);

    if (testCase.input) {
      await withTimeout(element.input(testCase.input), 10000, `input ${testCase.id}`);
    } else if (testCase.trigger) {
      await withTimeout(element.trigger(testCase.trigger, testCase.detail || {}), 10000, `trigger ${testCase.id}`);
    } else {
      await withTimeout(element.tap(), 10000, `tap ${testCase.id}`);
    }

    await sleep(testCase.waitMs || actionWaitMs);
    page = await withTimeout(mp.currentPage(), 20000, `currentPage after ${testCase.id}`);
    result.afterPath = page.path;
    result.afterText = await pageRootText(page);

    if (testCase.expectPath && page.path !== normalizeRoute(testCase.expectPath)) {
      result.evidence = `expected path ${normalizeRoute(testCase.expectPath)}, got ${page.path}`;
    } else if (testCase.expectText && !result.afterText.includes(testCase.expectText)) {
      result.evidence = `expected text "${testCase.expectText}" not found`;
    } else if (testCase.expectClassContains) {
      const { element: afterElement } = await getElement(page, testCase.selector, testCase.index || 0);
      const afterClass = afterElement ? await afterElement.attribute('class').catch(() => '') : '';
      if (!afterClass.includes(testCase.expectClassContains)) {
        result.evidence = `expected class "${testCase.expectClassContains}", got "${afterClass}"`;
      } else {
        result.status = 'passed';
        result.evidence = `class contains ${testCase.expectClassContains}`;
      }
    } else if (testCase.expectNative) {
      result.status = 'passed';
      result.evidence = `native method mocked: ${testCase.expectNative}`;
    } else {
      result.status = 'passed';
      result.evidence = testCase.expectPath ? `navigated to ${page.path}` : 'tap completed';
    }

    if (!result.status || result.status === 'failed') {
      result.status = result.evidence ? 'failed' : 'passed';
      if (!result.evidence) result.evidence = 'tap completed';
    }
  } catch (error) {
    result.status = 'failed';
    result.evidence = error instanceof Error ? error.message : String(error);
  } finally {
    result.durationMs = Date.now() - started;
  }

  return result;
}

async function ensureFirstCourseCardVisible(page) {
  if ((await page.$$('.booking-course-card')).length > 0) {
    return;
  }

  const datePills = await page.$$('.booking-date-strip__pill');
  for (let index = 0; index < datePills.length; index += 1) {
    await withTimeout(datePills[index].tap(), 10000, `tap course date ${index}`);
    await sleep(actionWaitMs);
    if ((await page.$$('.booking-course-card')).length > 0) {
      return;
    }
  }
}

function cases() {
  const dateCases = Array.from({ length: 14 }, (_, index) => ({
    id: `BTN-C${String(index + 1).padStart(2, '0')}`,
    module: '课程',
    entry: `日期筛选第 ${index + 1} 项`,
    start: '/pages/courses/index',
    selector: '.booking-date-strip__pill',
    index,
    expectClassContains: 'booking-date-strip__pill--active',
  }));

  const categoryNames = ['全部', '瑜伽', '普拉提', '冥想', '其他'];
  const categoryCases = categoryNames.map((name, index) => ({
    id: `BTN-K${String(index + 1).padStart(2, '0')}`,
    module: '课程',
    entry: `分类筛选：${name}`,
    start: '/pages/courses/index',
    selector: '.booking-category-pills__pill',
    index,
    expectClassContains: 'booking-category-pills__pill--active',
  }));

  const planCases = Array.from({ length: 6 }, (_, index) => ({
    id: `BTN-R${String(index + 1).padStart(2, '0')}`,
    module: '续费',
    entry: `会员方案选择第 ${index + 1} 项`,
    start: '/pages/membership-renew/index',
    selector: '.membership-plan-list__item',
    index,
    expectClassContains: 'membership-plan-list__item--selected',
  }));

  const faqCases = Array.from({ length: 7 }, (_, index) => ({
    id: `BTN-HFAQ${String(index + 1).padStart(2, '0')}`,
    module: '帮助',
    entry: `FAQ 展开第 ${index + 1} 项`,
    start: '/pages/help/index',
    selector: '.help-faq__item',
    index,
    expectText: 'FAQ',
  }));

  return normalizeNoCustomBackCases([
    { id: 'BTN-001', module: 'Tab', entry: '底部 Tab：首页', start: '/pages/courses/index', selector: '.custom-tab-bar__item', nativeTabUrl: '/pages/index/index', expectPath: '/pages/index/index' },
    { id: 'BTN-002', module: 'Tab', entry: '底部 Tab：预约', start: '/pages/index/index', selector: '.custom-tab-bar__item', nativeTabUrl: '/pages/courses/index', expectPath: '/pages/courses/index' },
    { id: 'BTN-003', module: 'Tab', entry: '底部 Tab：我的', start: '/pages/index/index', selector: '.custom-tab-bar__item', nativeTabUrl: '/pages/profile/index', expectPath: '/pages/profile/index' },

    { id: 'BTN-H01', module: '首页', entry: '会员状态详情', start: '/pages/index/index', selector: '.home-membership-card__status', expectPath: '/pages/membership/index' },
    { id: 'BTN-H02', module: '首页', entry: '会员卡查看详情', start: '/pages/index/index', selector: '.home-membership-card__secondary-button', expectPath: '/pages/membership/index' },
    { id: 'BTN-H03', module: '首页', entry: '立即预约课程', start: '/pages/index/index', selector: '.home-membership-card__button', expectPath: '/pages/courses/index' },
    { id: 'BTN-H04', module: '首页', entry: '今日课程主按钮', start: '/pages/index/index', selector: '.home-today-course-card__button', index: 0, expectPath: '/pages/courses/index' },
    { id: 'BTN-H05', module: '首页', entry: '今日课程次按钮', start: '/pages/index/index', selector: '.home-today-course-card__button', index: 1, expectPath: '/pages/courses/index' },
    { id: 'BTN-H06', module: '首页', entry: '服务入口：预约课程', start: '/pages/index/index', selector: '.home-service-band__item', index: 0, expectPath: '/pages/courses/index' },
    { id: 'BTN-H07', module: '首页', entry: '服务入口：训练记录', start: '/pages/index/index', selector: '.home-service-band__item', index: 1, expectPath: '/pages/training-records/index' },
    { id: 'BTN-H08', module: '首页', entry: '服务入口：我的教练', start: '/pages/index/index', selector: '.home-service-band__item', index: 2, expectPath: '/pages/my-coaches/index' },
    { id: 'BTN-H09', module: '首页', entry: '服务入口：课程表', start: '/pages/index/index', selector: '.home-service-band__item', index: 3, expectPath: '/pages/courses/index' },
    { id: 'BTN-H10', module: '首页', entry: '精选推荐预约', start: '/pages/index/index', selector: '.home-curated-card__action', expectPath: '/pages/courses/index' },
    { id: 'BTN-H11', module: '首页', entry: '近期安排全部', start: '/pages/index/index', selector: '.section-title-block__action--clickable', expectPath: '/pages/my-bookings/index' },
    { id: 'BTN-H12', module: '首页', entry: '近期安排第 1 项', start: '/pages/index/index', selector: '.home-upcoming-list__item', index: 0, expectPath: '/pages/course-detail/index' },
    { id: 'BTN-H13', module: '首页', entry: '门店导航', start: '/pages/index/index', selector: '.home-studio-card__action', expectNative: 'openLocation' },

    { id: 'BTN-C00', module: '课程', entry: '我的预约入口', start: '/pages/courses/index', selector: '.booking-page__my-bookings', expectPath: '/pages/my-bookings/index' },
    ...dateCases,
    ...categoryCases,
    { id: 'BTN-C20', module: '课程', entry: '课程卡片第 1 项', start: '/pages/courses/index', selector: '.booking-course-card', index: 0, before: async (_mp, page) => ensureFirstCourseCardVisible(page), expectPath: '/pages/course-detail/index' },

    { id: 'HDR-CO01', module: '页头', entry: '教练列表返回课程页', start: '/pages/coaches/index', selector: '.page-header__back', expectPath: '/pages/courses/index' },
    { id: 'HDR-M01', module: '页头', entry: '会员中心返回我的页', start: '/pages/membership/index', selector: '.page-header__back', expectPath: '/pages/profile/index' },
    { id: 'HDR-R01', module: '页头', entry: '续费会员返回会员中心', start: '/pages/membership-renew/index', selector: '.page-header__back', expectPath: '/pages/membership/index' },
    { id: 'HDR-B01', module: '页头', entry: '我的预约返回我的页', start: '/pages/my-bookings/index', selector: '.page-header__back', expectPath: '/pages/profile/index' },
    { id: 'HDR-TR01', module: '页头', entry: '训练记录返回我的页', start: '/pages/training-records/index', selector: '.page-header__back', expectPath: '/pages/profile/index' },
    { id: 'HDR-MC01', module: '页头', entry: '我的教练返回我的页', start: '/pages/my-coaches/index', selector: '.page-header__back', expectPath: '/pages/profile/index' },
    { id: 'HDR-N01', module: '页头', entry: '消息通知返回我的页', start: '/pages/notifications/index', selector: '.page-header__back', expectPath: '/pages/profile/index' },
    { id: 'HDR-H01', module: '页头', entry: '帮助与反馈返回我的页', start: '/pages/help/index', selector: '.page-header__back', expectPath: '/pages/profile/index' },
    { id: 'HDR-S01', module: '页头', entry: '设置返回我的页', start: '/pages/settings/index', selector: '.page-header__back', expectPath: '/pages/profile/index' },
    { id: 'HDR-AG01', module: '页头', entry: '用户协议返回设置页', start: '/pages/agreement/index', selector: '.page-header__back', expectPath: '/pages/settings/index' },
    { id: 'HDR-PR01', module: '页头', entry: '隐私政策返回设置页', start: '/pages/privacy/index', selector: '.page-header__back', expectPath: '/pages/settings/index' },

    { id: 'HDR-D01', module: '页头', entry: '课程详情返回课程列表', start: '/pages/course-detail/index', selector: '.page-header__back', expectPath: '/pages/courses/index' },
    { id: 'HDR-D02', module: '页头', entry: '课程详情成功态返回课程列表', start: '/pages/course-detail/index?id=cmnn7b1wh000e103eoua6vc4j', selector: '.floating-back-button', expectPath: '/pages/courses/index' },
    { id: 'BTN-D02', module: '课程详情', entry: '缺参返回课程列表', start: '/pages/course-detail/index', selector: '.empty__action .app-button', optional: true, expectPath: '/pages/courses/index' },
    { id: 'BTN-D03', module: '课程详情', entry: '预约 CTA（场次无效保护）', start: '/pages/course-detail/index?id=cmnn7b1wh000e103eoua6vc4j', selector: '.course-detail-page__cta-button', expectNative: 'showActionSheet' },

    { id: 'BTN-CO01', module: '教练列表', entry: '教练卡片第 1 项', start: '/pages/coaches/index', selector: '.coach-card', index: 0, before: async () => sleep(1600), expectPath: '/pages/coach-detail/index' },
    { id: 'HDR-CD01', module: '页头', entry: '教练详情返回教练列表', start: '/pages/coach-detail/index', selector: '.page-header__back', expectPath: '/pages/coaches/index' },
    { id: 'HDR-CD02', module: '页头', entry: '教练详情成功态返回教练列表', start: '/pages/coach-detail/index?id=cmohraml10010ckql764rd7nx', selector: '.floating-back-button', expectPath: '/pages/coaches/index' },
    { id: 'BTN-CD02', module: '教练详情', entry: '教练电话', start: '/pages/coach-detail/index?id=cmohraml10010ckql764rd7nx', selector: '.coach-detail-page__meta-row--clickable', index: 0, expectNative: 'makePhoneCall' },
    { id: 'BTN-CD03', module: '教练详情', entry: '教练邮箱复制', start: '/pages/coach-detail/index?id=cmohraml10010ckql764rd7nx', selector: '.coach-detail-page__meta-row--clickable', index: 1, expectNative: 'setClipboardData' },
    { id: 'BTN-CD04', module: '教练详情', entry: '无排课查看课程', start: '/pages/coach-detail/index?id=cmohramlw0016ckqllsxh3q36', selector: '.empty__action .app-button', optional: true, expectPath: '/pages/courses/index' },

    { id: 'BTN-M01', module: '会员', entry: '续费会员', start: '/pages/membership/index', selector: '.app-button', index: 1, expectPath: '/pages/membership-renew/index' },
    { id: 'BTN-M02', module: '会员', entry: '查看消费记录', start: '/pages/membership/index', selector: '.app-button', index: 2, expectPath: '/pages/transactions/index' },
    ...planCases,
    { id: 'BTN-R07', module: '续费', entry: '确认续费（取消弹窗路径）', start: '/pages/membership-renew/index', selector: '.membership-renew-page__footer .app-button', expectNative: 'showModal' },

    { id: 'BTN-B01', module: '我的预约', entry: '待上课 Tab', start: '/pages/my-bookings/index', selector: '.my-bookings-page__tab', index: 0, expectClassContains: 'my-bookings-page__tab--active' },
    { id: 'BTN-B02', module: '我的预约', entry: '已完成 Tab', start: '/pages/my-bookings/index', selector: '.my-bookings-page__tab', index: 1, expectClassContains: 'my-bookings-page__tab--active' },
    { id: 'BTN-B03', module: '我的预约', entry: '已取消 Tab', start: '/pages/my-bookings/index', selector: '.my-bookings-page__tab', index: 2, expectClassContains: 'my-bookings-page__tab--active' },
    { id: 'BTN-B04', module: '我的预约', entry: '预约卡片第 1 项（取消弹窗取消路径）', start: '/pages/my-bookings/index', selector: '.my-bookings-page__item', index: 0, optional: true, expectNative: 'showModal' },

    { id: 'BTN-P01', module: '我的', entry: '菜单：我的预约', start: '/pages/profile/index', selector: '.profile-menu-section__item', index: 0, expectPath: '/pages/my-bookings/index' },
    { id: 'BTN-P02', module: '我的', entry: '菜单：训练记录', start: '/pages/profile/index', selector: '.profile-menu-section__item', index: 1, expectPath: '/pages/training-records/index' },
    { id: 'BTN-P03', module: '我的', entry: '菜单：会员中心', start: '/pages/profile/index', selector: '.profile-menu-section__item', index: 2, expectPath: '/pages/membership/index' },
    { id: 'BTN-P04', module: '我的', entry: '菜单：消息通知', start: '/pages/profile/index', selector: '.profile-menu-section__item', index: 3, expectPath: '/pages/notifications/index' },
    { id: 'BTN-P05', module: '我的', entry: '菜单：帮助与反馈', start: '/pages/profile/index', selector: '.profile-menu-section__item', index: 4, expectPath: '/pages/help/index' },
    { id: 'BTN-P06', module: '我的', entry: '菜单：设置', start: '/pages/profile/index', selector: '.profile-menu-section__item', index: 5, expectPath: '/pages/settings/index' },
    { id: 'BTN-P07', module: '我的', entry: '退出登录（取消弹窗路径）', start: '/pages/profile/index', selector: '.profile-signout-button', optional: true, expectNative: 'showModal' },

    { id: 'BTN-N01', module: '通知', entry: '全部已读', start: '/pages/notifications/index', selector: '.notifications-page__header-action', optional: true, expectText: '消息通知' },
    { id: 'BTN-N02', module: '通知', entry: '通知列表第 1 项', start: '/pages/notifications/index', selector: '.notifications-list__item', index: 0, optional: true, expectText: '消息通知' },

    { id: 'BTN-HC01', module: '帮助', entry: '分类：全部', start: '/pages/help/index', selector: '.help-categories__pill', index: 0, expectClassContains: 'help-categories__pill--active' },
    { id: 'BTN-HC02', module: '帮助', entry: '分类：预约相关', start: '/pages/help/index', selector: '.help-categories__pill', index: 1, expectClassContains: 'help-categories__pill--active' },
    { id: 'BTN-HC03', module: '帮助', entry: '分类：会员服务', start: '/pages/help/index', selector: '.help-categories__pill', index: 2, expectClassContains: 'help-categories__pill--active' },
    { id: 'BTN-HC04', module: '帮助', entry: '分类：账户问题', start: '/pages/help/index', selector: '.help-categories__pill', index: 3, expectClassContains: 'help-categories__pill--active' },
    ...faqCases,
    { id: 'BTN-HF01', module: '帮助', entry: '反馈输入', start: '/pages/help/index', selector: '.help-feedback__textarea', input: '小程序全按钮矩阵自动化反馈', expectText: '小程序全按钮矩阵自动化反馈' },
    { id: 'BTN-HF02', module: '帮助', entry: '反馈提交', start: '/pages/help/index', selector: '.help-feedback__submit', expectText: '帮助与反馈' },
    { id: 'BTN-HF03', module: '帮助', entry: '拨打客服电话', start: '/pages/help/index', selector: '.help-contact__button', index: 0, expectNative: 'makePhoneCall' },
    { id: 'BTN-HF04', module: '帮助', entry: '复制邮箱地址', start: '/pages/help/index', selector: '.help-contact__button', index: 1, expectNative: 'setClipboardData' },

    { id: 'BTN-S01', module: '设置', entry: '账号安全入口', start: '/pages/settings/index', selector: '.settings-row--clickable', index: 0, expectPath: '/pages/account-security/index' },
    { id: 'BTN-S02', module: '设置', entry: '本机快捷访问偏好', start: '/pages/settings/index', selector: '.settings-row--clickable', index: 1, expectText: '设置' },
    { id: 'BTN-S03', module: '设置', entry: '课程提醒开关', start: '/pages/settings/index', selector: '.settings-row--clickable', index: 2, expectText: '设置' },
    { id: 'BTN-S04', module: '设置', entry: '系统通知开关', start: '/pages/settings/index', selector: '.settings-row--clickable', index: 3, expectText: '设置' },
    { id: 'BTN-S05', module: '设置', entry: '深色模式开关', start: '/pages/settings/index', selector: '.settings-row--clickable', index: 4, expectText: '设置' },
    { id: 'BTN-S06', module: '设置', entry: '语言行点击', start: '/pages/settings/index', selector: '.settings-row--clickable', index: 5, expectText: '设置' },
    { id: 'BTN-S07', module: '设置', entry: '清理页面缓存', start: '/pages/settings/index', selector: '.settings-row--clickable', index: 6, expectText: '设置' },
    { id: 'BTN-S08', module: '设置', entry: '用户协议', start: '/pages/settings/index', selector: '.settings-about-row--clickable', index: 0, expectPath: '/pages/agreement/index' },
    { id: 'BTN-S09', module: '设置', entry: '隐私政策', start: '/pages/settings/index', selector: '.settings-about-row--clickable', index: 1, expectPath: '/pages/privacy/index' },
    { id: 'BTN-S10', module: '设置', entry: '退出登录（取消弹窗路径）', start: '/pages/settings/index', selector: '.danger-action', index: 0, expectNative: 'showModal' },
    { id: 'BTN-S11', module: '设置', entry: '账号注销申请入口', start: '/pages/settings/index', selector: '.danger-confirm__button--confirm', index: 0, optional: true, expectText: '设置' },

    { id: 'BTN-A01', module: '账号安全', entry: '面容/指纹解锁偏好', start: '/pages/account-security/index', selector: '.security-row--clickable', index: 0, expectText: '账号安全' },
    { id: 'BTN-A02', module: '账号安全', entry: '异地登录提醒偏好', start: '/pages/account-security/index', selector: '.security-row--clickable', index: 1, expectText: '账号安全' },
    { id: 'HDR-A01', module: '页头', entry: '账号安全返回设置页', start: '/pages/account-security/index', selector: '.page-header__back', expectPath: '/pages/settings/index' },

    { id: 'BTN-MC01', module: '我的教练', entry: '常用教练第 1 项', start: '/pages/my-coaches/index', selector: '.coach-card', index: 0, expectPath: '/pages/coach-detail/index' },
    { id: 'HDR-T01', module: '页头', entry: '交易页返回会员中心', start: '/pages/transactions/index', selector: '.page-header__back', expectPath: '/pages/membership/index' },
  ]);
}

function normalizeNoCustomBackCases(testCases) {
  return testCases;
}

async function main() {
  const stamp = nowStamp();
  console.log(`[matrix] start ${stamp}`);
  const mp = await connectMiniProgram();
  console.log('[matrix] connected');
  const results = [];
  const selectedPrefixes = (process.env.WEAPP_MATRIX_ID_PREFIXES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  let setup = {};
  let systemInfo = null;
  let systemInfoWarning = '';

  try {
    console.log('[matrix] preparing runtime');
    await prepareMiniProgram(mp);
    console.log('[matrix] prepared runtime');
    try {
      console.log('[matrix] reading systemInfo');
      systemInfo = await withTimeout(mp.systemInfo(), 30000, 'systemInfo after prepare');
      console.log('[matrix] systemInfo ok');
    } catch (error) {
      systemInfoWarning = error instanceof Error ? error.message : String(error);
      console.log(`[matrix] systemInfo warning: ${systemInfoWarning}`);
    }
    console.log('[matrix] reading currentPage');
    const page = await withTimeout(mp.currentPage(), 20000, 'currentPage after prepare');
    console.log(`[matrix] currentPage ok: ${page.path}`);
    setup = {
      wsEndpoint,
      projectPath,
      systemInfo,
      systemInfoWarning,
      currentPage: { path: page.path, query: page.query },
    };

    const allCases = cases();
    const filteredCases = selectedPrefixes.length > 0
      ? allCases.filter((testCase) => selectedPrefixes.some((prefix) => testCase.id.startsWith(prefix)))
      : allCases;
    console.log(`[matrix] running ${filteredCases.length}/${allCases.length} cases`);
    for (const testCase of filteredCases) {
      console.log(`[matrix] case ${testCase.id} ${testCase.entry}`);
      const result = await runCase(mp, testCase);
      results.push(result);
      process.stdout.write(`${result.status === 'passed' ? 'PASS' : result.status.toUpperCase()} ${result.id} ${result.entry} ${result.evidence}\n`);
    }

    const pageButtonCounts = [];
    if (!skipPageCounts) {
      const pages = JSON.parse(fs.readFileSync(path.join(root, 'dist/app.json'), 'utf8')).pages;
      for (const pagePath of pages) {
        const page = await routeTo(mp, `/${pagePath}`);
        pageButtonCounts.push({
          page: pagePath,
          visibleButtonCount: await withTimeout(pageButtonCount(page), 10000, `buttonCount ${pagePath}`),
          textSample: (await withTimeout(pageRootText(page), 10000, `rootText ${pagePath}`)).slice(0, 300),
        });
      }
    }

    const summary = {
      total: results.length,
      passed: results.filter((item) => item.status === 'passed').length,
      failed: results.filter((item) => item.status === 'failed').length,
      blocked: results.filter((item) => item.status === 'blocked').length,
      notRendered: results.filter((item) => item.status === 'not-rendered').length,
    };
    const report = {
      generatedAt: new Date().toISOString(),
      setup,
      summary,
      results,
      pageButtonCounts,
    };

    fs.mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, `weapp-click-matrix-${stamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`[matrix] wrote ${jsonPath}`);
    console.log(`WeApp click matrix completed: ${summary.passed}/${summary.total} passed, ${summary.failed} failed, ${summary.blocked} blocked, ${summary.notRendered} not-rendered`);
    console.log(jsonPath);

    if (summary.failed > 0 || summary.blocked > 0) {
      process.exitCode = 1;
    }
  } finally {
    await withTimeout(Promise.resolve(mp.disconnect()), 8000, 'disconnect').catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
