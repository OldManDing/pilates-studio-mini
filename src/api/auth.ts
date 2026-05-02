import Taro from '@tarojs/taro';

declare const API_BASE_URL: string;
declare const DEVTOOLS_API_BASE_URL: string;
declare const ALLOW_INSECURE_REAL_DEVICE_API: boolean;
declare const USE_MINI_OPEN_ID_LOGIN: boolean;
declare const MINI_OPEN_ID: string;

interface MiniAuthPayload {
  success: boolean;
  data?: {
    accessToken: string;
  };
  error?: {
    message?: string;
  };
}

interface MiniProgramAuthOptions {
  interactive?: boolean;
}

interface MiniProgramProfile {
  nickname?: string;
  avatarUrl?: string;
}

let authPromise: Promise<string | null> | null = null;
let lastAuthFailureAt = 0;
let lastAuthFailureMessage = '';

const AUTH_FAILURE_COOLDOWN_MS = 5000;
const LOCAL_API_BASE_URL_PATTERN = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/;
const HTTP_API_BASE_URL_PATTERN = /^http:\/\//;

function isWeChatDeveloperTool() {
  try {
    return Taro.getSystemInfoSync().platform === 'devtools';
  } catch {
    return false;
  }
}

export function getRuntimeApiBaseUrl() {
  if (isWeChatDeveloperTool() && DEVTOOLS_API_BASE_URL) {
    return DEVTOOLS_API_BASE_URL;
  }

  return API_BASE_URL;
}

export function getApiBaseUrlUnavailableMessage(apiBaseUrl = getRuntimeApiBaseUrl()): string | null {
  if (!apiBaseUrl) {
    return 'API_BASE_URL 未配置，无法完成小程序登录';
  }

  if (ALLOW_INSECURE_REAL_DEVICE_API) {
    return null;
  }

  if (LOCAL_API_BASE_URL_PATTERN.test(apiBaseUrl) && !isWeChatDeveloperTool()) {
    return '真机无法访问本地 API 地址，请将 API_BASE_URL 配置为 HTTPS 合法域名';
  }

  if (HTTP_API_BASE_URL_PATTERN.test(apiBaseUrl) && !isWeChatDeveloperTool()) {
    return '真机请求必须使用 HTTPS 合法域名，请检查 API_BASE_URL 和微信 request 合法域名';
  }

  return null;
}

function getStoredToken(): string | null {
  return Taro.getStorageSync('token') || null;
}

function shouldUseForcedMiniOpenIdLogin() {
  return USE_MINI_OPEN_ID_LOGIN && Boolean(MINI_OPEN_ID) && isWeChatDeveloperTool();
}

async function confirmLoginAuthorization() {
  const result = await Taro.showModal({
    title: '授权登录',
    content: '需要使用微信授权登录后，才能同步会员卡、预约记录和训练数据。',
    confirmText: '授权登录',
    cancelText: '暂不登录',
    confirmColor: '#C4A574',
  });

  if (!result.confirm) {
    throw new Error('已取消授权登录');
  }
}

async function getAuthorizedProfile(): Promise<MiniProgramProfile> {
  const canGetProfile = typeof Taro.getUserProfile === 'function';

  if (!canGetProfile) {
    return {};
  }

  try {
    const result = await Taro.getUserProfile({
      desc: '用于完善会员资料展示',
    });

    return {
      nickname: result.userInfo?.nickName,
      avatarUrl: result.userInfo?.avatarUrl,
    };
  } catch {
    return {};
  }
}

async function loginWithMiniProgram(options: MiniProgramAuthOptions = {}): Promise<string | null> {
  const storedToken = getStoredToken();
  if (storedToken) {
    return storedToken;
  }

  if (options.interactive) {
    await confirmLoginAuthorization();
  }

  const runtimeApiBaseUrl = getRuntimeApiBaseUrl();
  const apiBaseUrlUnavailableMessage = getApiBaseUrlUnavailableMessage(runtimeApiBaseUrl);
  if (apiBaseUrlUnavailableMessage) {
    throw new Error(apiBaseUrlUnavailableMessage);
  }

  const forceMiniOpenIdLogin = shouldUseForcedMiniOpenIdLogin();

  if (forceMiniOpenIdLogin) {
    const response = await Taro.request<MiniAuthPayload>({
      url: `${runtimeApiBaseUrl}/mini-auth/login`,
      method: 'POST',
      data: { openId: MINI_OPEN_ID },
      header: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (!response.data?.success || !response.data.data?.accessToken) {
      throw new Error(response.data?.error?.message || '小程序登录失败');
    }

    Taro.setStorageSync('token', response.data.data.accessToken);
    return response.data.data.accessToken;
  }

  const profile = options.interactive ? await getAuthorizedProfile() : {};

  const loginResult = await Taro.login().catch(() => null);
  const code = loginResult?.code;

  const payload = shouldUseForcedMiniOpenIdLogin()
    ? { openId: MINI_OPEN_ID, ...profile }
    : code
      ? { code, ...profile }
      : MINI_OPEN_ID && isWeChatDeveloperTool()
        ? { openId: MINI_OPEN_ID, ...profile }
        : null;

  if (!payload) {
    throw new Error('小程序登录凭证获取失败，请在真机环境确认微信登录、HTTPS 域名和合法请求域名配置');
  }

  const response = await Taro.request<MiniAuthPayload>({
    url: `${runtimeApiBaseUrl}/mini-auth/login`,
    method: 'POST',
    data: payload,
    header: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  if (!response.data?.success || !response.data.data?.accessToken) {
    throw new Error(response.data?.error?.message || '小程序登录失败');
  }

  Taro.setStorageSync('token', response.data.data.accessToken);
  return response.data.data.accessToken;
}

export async function ensureMiniProgramAuth(options: MiniProgramAuthOptions = {}): Promise<string | null> {
  const storedToken = getStoredToken();
  if (storedToken) {
    return storedToken;
  }

  const now = Date.now();
  if (lastAuthFailureAt && now - lastAuthFailureAt < AUTH_FAILURE_COOLDOWN_MS) {
    throw new Error(lastAuthFailureMessage || '小程序登录暂时不可用，请稍后重试');
  }

  if (!authPromise) {
    authPromise = loginWithMiniProgram(options)
      .then((token) => {
        lastAuthFailureAt = 0;
        lastAuthFailureMessage = '';
        return token;
      })
      .catch((error) => {
        lastAuthFailureAt = Date.now();
        lastAuthFailureMessage = error instanceof Error ? error.message : '小程序登录失败';
        throw error;
      })
      .finally(() => {
        authPromise = null;
      });
  }

  return authPromise;
}
