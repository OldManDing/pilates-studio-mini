const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs', 'wechat-devtools');
const automatorRoot = process.env.WEAPP_AUTOMATOR_ROOT || path.join(process.env.TEMP || '', 'weapp-automator-tools');
const automator = require(path.join(automatorRoot, 'node_modules/miniprogram-automator'));

const cliPath = process.env.WECHAT_DEVTOOLS_CLI || 'C:/Users/MrDing/AppData/Local/微信开发者工具/cli.bat';
const cliScriptPath = process.env.WECHAT_DEVTOOLS_CLI_SCRIPT || path.join(path.dirname(cliPath), 'cli.js');
const cliLauncherPath = process.env.WECHAT_DEVTOOLS_LAUNCHER || path.join(path.dirname(cliPath), 'node.exe');
const projectPath = process.env.WEAPP_PROJECT_PATH || root;
const autoPort = Number(process.env.WEAPP_AUTO_PORT || 9428);
const wsEndpoint = process.env.WEAPP_WS_ENDPOINT || `ws://127.0.0.1:${autoPort}`;
const selectedNames = (process.env.WEAPP_UI_AUDIT_NAMES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const skipScreenshots = process.env.WEAPP_UI_AUDIT_SKIP_SCREENSHOTS === '1';

const TAB_ROUTES = new Set(['pages/index/index', 'pages/courses/index', 'pages/profile/index']);
const MIN_TOUCH_SIZE = 44;
const CAPSULE_GAP = 6;

const ROUTES = [
  { name: 'home', route: '/pages/index/index', topSelectors: ['.home-hero__main'], heroSelector: '.home-hero' },
  { name: 'courses', route: '/pages/courses/index', topSelectors: ['.booking-page__headline', '.booking-page__my-bookings'], heroSelector: '.booking-hero' },
  { name: 'course-detail-empty', route: '/pages/course-detail/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'course-detail-loaded', route: '/pages/course-detail/index?id=cmnn7b1wh000e103eoua6vc4j', expectedBack: true, topSelectors: ['.floating-back-button'], heroSelector: '.course-detail-page__hero' },
  { name: 'coaches', route: '/pages/coaches/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'coach-detail-empty', route: '/pages/coach-detail/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'coach-detail-loaded', route: '/pages/coach-detail/index?id=cmohraml10010ckql764rd7nx', expectedBack: true, topSelectors: ['.floating-back-button'], heroSelector: '.coach-detail-page__hero' },
  { name: 'membership', route: '/pages/membership/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'membership-renew', route: '/pages/membership-renew/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'my-bookings', route: '/pages/my-bookings/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'training-records', route: '/pages/training-records/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'my-coaches', route: '/pages/my-coaches/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'profile', route: '/pages/profile/index', topSelectors: ['.profile-page__hero-main'], heroSelector: '.profile-page__hero' },
  { name: 'notifications', route: '/pages/notifications/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back', '.page-header__right'], heroSelector: '.page-header' },
  { name: 'help', route: '/pages/help/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'settings', route: '/pages/settings/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'account-security', route: '/pages/account-security/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'agreement', route: '/pages/agreement/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'privacy', route: '/pages/privacy/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
  { name: 'transactions', route: '/pages/transactions/index', expectedBack: true, topSelectors: ['.page-header__top', '.page-header__back'], heroSelector: '.page-header' },
];

function stamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeRoute(route) {
  return route.startsWith('/') ? route.slice(1) : route;
}

function enableAutomation() {
  if (!fs.existsSync(cliLauncherPath) || !fs.existsSync(cliScriptPath)) {
    return { ok: false, message: `微信开发者工具 CLI 不存在: ${cliLauncherPath} / ${cliScriptPath}` };
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
  const enabled = enableAutomation();
  if (!enabled.ok) {
    throw new Error(enabled.message);
  }

  await sleep(2500);
  return withTimeout(automator.connect({ wsEndpoint }), 15000, 'connect after auto');
}

function routeIsTab(route) {
  return TAB_ROUTES.has(normalizeRoute(route));
}

async function routeTo(mp, route) {
  const normalized = normalizeRoute(route);
  const url = `/${normalized}`;

  if (routeIsTab(normalized)) {
    await withTimeout(mp.switchTab(url), 16000, `switchTab ${url}`).catch(() => withTimeout(mp.reLaunch(url), 16000, `reLaunch fallback ${url}`));
  } else {
    await withTimeout(mp.reLaunch(url), 16000, `reLaunch ${url}`);
  }

  await sleep(3200);
  return withTimeout(mp.currentPage(), 20000, `currentPage ${url}`);
}

async function safeText(element) {
  try {
    return (await element.text()).replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

async function safeClass(element) {
  try {
    return await element.attribute('class');
  } catch {
    return '';
  }
}

async function readBox(element) {
  try {
    const [size, offset] = await Promise.all([element.size(), element.offset()]);
    return { size, offset };
  } catch {
    return null;
  }
}

async function collectSelector(page, selector) {
  const elements = await page.$$(selector);
  const items = [];

  for (let index = 0; index < Math.min(elements.length, 8); index += 1) {
    const element = elements[index];
    items.push({
      index,
      selector,
      text: await safeText(element),
      className: await safeClass(element),
      box: await readBox(element),
    });
  }

  return { selector, count: elements.length, items };
}

async function collectButtons(page) {
  const buttons = await page.$$('button');
  const items = [];

  for (let index = 0; index < Math.min(buttons.length, 80); index += 1) {
    const button = buttons[index];
    items.push({
      index,
      text: await safeText(button),
      className: await safeClass(button),
      box: await readBox(button),
    });
  }

  return { count: buttons.length, items };
}

function rightEdge(box) {
  return box.offset.left + box.size.width;
}

function bottomEdge(box) {
  return box.offset.top + box.size.height;
}

function assessCase(testCase, pageResult, layoutInfo) {
  const issues = [];
  const backSelectors = ['.page-header__back', '.floating-back-button'];
  const backItems = pageResult.selectors
    .filter((item) => backSelectors.includes(item.selector))
    .flatMap((item) => item.items.map((selectorItem) => ({ ...selectorItem, selector: item.selector })));

  if (testCase.expectedBack && backItems.length === 0) {
    issues.push({
      level: 'P1',
      code: 'UI-BACK-MISSING',
      message: `${testCase.name} 子页面缺少返回入口`,
    });
  }

  backItems.forEach((item) => {
    const box = item.box;
    if (box && (box.size.width < MIN_TOUCH_SIZE || box.size.height < MIN_TOUCH_SIZE)) {
      issues.push({
        level: 'P1',
        code: 'UI-BACK-TOUCH-SIZE',
        message: `${testCase.name} 返回按钮点击热区不足 ${MIN_TOUCH_SIZE}px`,
        evidence: `${item.selector} ${Math.round(box.size.width)}x${Math.round(box.size.height)}`,
      });
    }
  });

  pageResult.buttons.items.forEach((button) => {
    const box = button.box;
    if (!box) return;
    const text = button.text || button.className || `button#${button.index}`;
    if (box.size.width < MIN_TOUCH_SIZE || box.size.height < MIN_TOUCH_SIZE) {
      issues.push({
        level: 'P1',
        code: 'UI-BUTTON-TOUCH-SIZE',
        message: `${testCase.name} 按钮点击热区不足 ${MIN_TOUCH_SIZE}px`,
        evidence: `${text} ${Math.round(box.size.width)}x${Math.round(box.size.height)}`,
      });
    }
  });

  const capsule = layoutInfo.capsule;
  if (capsule && typeof capsule.left === 'number' && typeof capsule.top === 'number') {
    const riskItems = pageResult.selectors
      .flatMap((item) => item.items.map((selectorItem) => ({ ...selectorItem, selector: item.selector })))
      .filter((item) => {
        if (!item.box) return false;
        const box = item.box;
        const verticalOverlap = box.offset.top < (capsule.bottom || capsule.top + capsule.height) && bottomEdge(box) > capsule.top;
        const horizontalOverlap = box.offset.left < (capsule.left + (capsule.width || 0)) && rightEdge(box) > capsule.left;
        return verticalOverlap && horizontalOverlap;
      });

    riskItems.forEach((item) => {
      issues.push({
        level: 'P1',
        code: 'UI-CAPSULE-OVERLAP',
        message: `${testCase.name} 顶部元素与右上角胶囊区域重叠`,
        evidence: `${item.selector} right=${Math.round(rightEdge(item.box))}, capsuleLeft=${Math.round(capsule.left)}`,
      });
    });
  }

  const hero = pageResult.selectors.find((item) => item.selector === testCase.heroSelector)?.items[0];
  if (hero?.box && hero.box.size.height < 140) {
    issues.push({
      level: 'P2',
      code: 'UI-HERO-TOO-SHORT',
      message: `${testCase.name} 头图区域高度偏小，照片辨识度不足`,
      evidence: `${Math.round(hero.box.size.height)}px`,
    });
  }

  if (/undefined|null|NaN/.test(pageResult.text)) {
    issues.push({
      level: 'P1',
      code: 'UI-BAD-TEXT',
      message: `${testCase.name} 出现未兜底文本`,
    });
  }

  return issues;
}

async function getLayoutInfo(mp) {
  const systemInfo = await withTimeout(mp.systemInfo(), 8000, 'systemInfo')
    .catch((error) => ({ error: error instanceof Error ? error.message : String(error) }));
  const capsule = await withTimeout(mp.callWxMethod('getMenuButtonBoundingClientRect'), 8000, 'getMenuButtonBoundingClientRect')
    .catch(() => null);
  return { systemInfo, capsule };
}

async function main() {
  const runStamp = stamp();
  const outDir = path.join(docsDir, `ui-audit-${runStamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`[ui-audit] connect ${wsEndpoint}`);
  const mp = await connectMiniProgram();
  const report = {
    generatedAt: new Date().toISOString(),
    wsEndpoint,
    projectPath,
    outDir,
    layoutInfo: {},
    summary: {},
    pages: [],
    issues: [],
  };

  try {
    console.log('[ui-audit] read layout info');
    report.layoutInfo = await getLayoutInfo(mp);
    const targetRoutes = selectedNames.length > 0
      ? ROUTES.filter((testCase) => selectedNames.includes(testCase.name))
      : ROUTES;
    console.log(`[ui-audit] routes ${targetRoutes.length}/${ROUTES.length}`);

    for (const testCase of targetRoutes) {
      console.log(`[ui-audit] route ${testCase.name} ${testCase.route}`);
      const page = await routeTo(mp, testCase.route);
      const root = await page.$('page');
      const text = root ? await safeText(root) : '';
      const selectors = [];
      const uniqueSelectors = Array.from(new Set([
        testCase.heroSelector,
        ...(testCase.topSelectors || []),
        '.page-header__back',
        '.floating-back-button',
        '.empty',
        '.loading',
      ].filter(Boolean)));

      for (const selector of uniqueSelectors) {
        selectors.push(await collectSelector(page, selector));
      }

      const screenshotPath = path.join(outDir, `${testCase.name}.png`);
      let screenshot = screenshotPath;
      let screenshotError = '';
      try {
        if (skipScreenshots) {
          screenshot = '';
          screenshotError = 'skipped by WEAPP_UI_AUDIT_SKIP_SCREENSHOTS';
        } else {
          await withTimeout(mp.screenshot({ path: screenshotPath }), 15000, `screenshot ${testCase.name}`);
        }
      } catch (error) {
        screenshot = '';
        screenshotError = error instanceof Error ? error.message : String(error);
      }

      const pageResult = {
        name: testCase.name,
        route: testCase.route,
        currentPath: page.path,
        text: text.slice(0, 1200),
        selectors,
        buttons: await collectButtons(page),
        screenshot,
        screenshotError,
      };

      pageResult.issues = assessCase(testCase, pageResult, report.layoutInfo);
      report.pages.push(pageResult);
      report.issues.push(...pageResult.issues.map((issue) => ({ ...issue, page: testCase.name, route: testCase.route })));

      const partialPath = path.join(outDir, 'report.partial.json');
      fs.writeFileSync(partialPath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`[ui-audit] ${testCase.name}: ${pageResult.issues.length} issues`);
    }

    report.summary = {
      totalPages: report.pages.length,
      totalIssues: report.issues.length,
      p1: report.issues.filter((issue) => issue.level === 'P1').length,
      p2: report.issues.filter((issue) => issue.level === 'P2').length,
      screenshots: report.pages.filter((page) => page.screenshot).length,
    };

    const reportPath = path.join(outDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`WeApp UI audit completed: ${report.summary.p1} P1, ${report.summary.p2} P2, screenshots ${report.summary.screenshots}/${report.summary.totalPages}`);
    console.log(reportPath);

    if (report.summary.p1 > 0) {
      process.exitCode = 1;
    }
  } finally {
    await Promise.resolve(mp.disconnect()).catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
