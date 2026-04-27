import Taro from '@tarojs/taro';

declare const API_BASE_URL: string;
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

let authPromise: Promise<string | null> | null = null;
let lastAuthFailureAt = 0;
let lastAuthFailureMessage = '';

const AUTH_FAILURE_COOLDOWN_MS = 5000;

function getStoredToken(): string | null {
  return Taro.getStorageSync('token') || null;
}

async function loginWithMiniProgram(): Promise<string | null> {
  const storedToken = getStoredToken();
  if (storedToken) {
    return storedToken;
  }

  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL 未配置，无法完成小程序登录');
  }

  const loginResult = await Taro.login().catch(() => null);
  const code = loginResult?.code;

  const payload = code
    ? { code }
    : MINI_OPEN_ID
      ? { openId: MINI_OPEN_ID }
      : null;

  if (!payload) {
    throw new Error('小程序登录凭证获取失败');
  }

  const response = await Taro.request<MiniAuthPayload>({
    url: `${API_BASE_URL}/mini-auth/login`,
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

export async function ensureMiniProgramAuth(): Promise<string | null> {
  const storedToken = getStoredToken();
  if (storedToken) {
    return storedToken;
  }

  const now = Date.now();
  if (lastAuthFailureAt && now - lastAuthFailureAt < AUTH_FAILURE_COOLDOWN_MS) {
    throw new Error(lastAuthFailureMessage || '小程序登录暂时不可用，请稍后重试');
  }

  if (!authPromise) {
    authPromise = loginWithMiniProgram()
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
