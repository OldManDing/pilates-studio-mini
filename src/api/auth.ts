import Taro from '@tarojs/taro';
import { localizeErrorMessage } from '../utils/errorMessages';
import { STORAGE_KEYS } from '../constants/storage';

declare const API_BASE_URL: string;
declare const DEVTOOLS_API_BASE_URL: string;
declare const ALLOW_INSECURE_REAL_DEVICE_API: boolean;
declare const USE_MINI_OPEN_ID_LOGIN: boolean;
declare const MINI_OPEN_ID: string;

interface MiniAuthPayload {
  success: boolean;
  data?: {
    accessToken: string;
    miniUser?: MiniProgramUser;
    member?: unknown;
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

export interface MiniProgramUser {
  id: string;
  openId: string;
  unionId?: string;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
  status: 'ACTIVE' | 'DISABLED';
}

interface PrivacyAuthorizationError {
  errMsg?: string;
}

interface PrivacyAuthorizeOptions {
  success?: () => void;
  fail?: (error: PrivacyAuthorizationError) => void;
}

interface TaroPrivacyApi {
  requirePrivacyAuthorize?: (options: PrivacyAuthorizeOptions) => void;
}

let authPromise: Promise<string | null> | null = null;
let lastAuthFailureAt = 0;
let lastAuthFailureMessage = '';

const AUTH_FAILURE_COOLDOWN_MS = 5000;
const LOCAL_API_BASE_URL_PATTERN = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/;
const PRIVATE_NETWORK_API_BASE_URL_PATTERN = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)(\d{1,3}\.){2}\d{1,3}(:\d+)?(\/|$)/;
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
    return '接口地址未配置，无法完成小程序登录';
  }

  if (ALLOW_INSECURE_REAL_DEVICE_API) {
    return null;
  }

  if (LOCAL_API_BASE_URL_PATTERN.test(apiBaseUrl) && !isWeChatDeveloperTool()) {
    return '真机无法访问本地接口地址，请将接口地址配置为 HTTPS 合法域名';
  }

  if (HTTP_API_BASE_URL_PATTERN.test(apiBaseUrl) && !isWeChatDeveloperTool()) {
    return '真机请求必须使用 HTTPS 合法域名，请检查接口地址和微信请求合法域名';
  }

  return null;
}

function getStoredToken(): string | null {
  return Taro.getStorageSync('token') || null;
}

function getStoredMiniUser(): MiniProgramUser | null {
  return Taro.getStorageSync<MiniProgramUser | ''>(STORAGE_KEYS.miniUser) || null;
}

function getReusableStoredToken(options: MiniProgramAuthOptions): string | null {
  const storedToken = getStoredToken();
  if (!storedToken) {
    return null;
  }

  return !options.interactive || getStoredMiniUser() ? storedToken : null;
}

function clearIncompleteMiniAuthState(options: MiniProgramAuthOptions) {
  if (!options.interactive || !getStoredToken() || getStoredMiniUser()) {
    return;
  }

  Taro.removeStorageSync('token');
  Taro.removeStorageSync(STORAGE_KEYS.miniUser);
}

function isDevelopmentApiBaseUrl(apiBaseUrl: string) {
  return LOCAL_API_BASE_URL_PATTERN.test(apiBaseUrl) || PRIVATE_NETWORK_API_BASE_URL_PATTERN.test(apiBaseUrl);
}

function shouldUseForcedMiniOpenIdLogin(apiBaseUrl = getRuntimeApiBaseUrl()) {
  return USE_MINI_OPEN_ID_LOGIN
    && Boolean(MINI_OPEN_ID)
    && (isWeChatDeveloperTool() || ALLOW_INSECURE_REAL_DEVICE_API)
    && isDevelopmentApiBaseUrl(apiBaseUrl);
}

function persistMiniAuthData(data: NonNullable<MiniAuthPayload['data']>) {
  Taro.setStorageSync('token', data.accessToken);

  if (data.miniUser) {
    Taro.setStorageSync(STORAGE_KEYS.miniUser, data.miniUser);
  }
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

async function ensurePrivacyAuthorization() {
  const privacyApi = Taro as unknown as TaroPrivacyApi;

  if (typeof privacyApi.requirePrivacyAuthorize !== 'function') {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    privacyApi.requirePrivacyAuthorize?.({
      success: () => resolve(),
      fail: (error) => {
        const errMsg = error?.errMsg || '';
        if (/cancel|deny|refuse/i.test(errMsg)) {
          reject(new Error('需要同意隐私保护指引后才能完成微信登录'));
          return;
        }

        reject(new Error(localizeErrorMessage(errMsg, '微信隐私授权失败，请稍后重试')));
      },
    });
  });
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
  const storedToken = getReusableStoredToken(options);
  if (storedToken) {
    return storedToken;
  }
  clearIncompleteMiniAuthState(options);

  const runtimeApiBaseUrl = getRuntimeApiBaseUrl();
  const apiBaseUrlUnavailableMessage = getApiBaseUrlUnavailableMessage(runtimeApiBaseUrl);
  if (apiBaseUrlUnavailableMessage) {
    throw new Error(apiBaseUrlUnavailableMessage);
  }

  const forceMiniOpenIdLogin = shouldUseForcedMiniOpenIdLogin(runtimeApiBaseUrl);

  if (options.interactive && !forceMiniOpenIdLogin) {
    await confirmLoginAuthorization();
    await ensurePrivacyAuthorization();
  }

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
      throw new Error(localizeErrorMessage(response.data?.error?.message, '小程序登录失败'));
    }

    persistMiniAuthData(response.data.data);
    return response.data.data.accessToken;
  }

  const profile = options.interactive ? await getAuthorizedProfile() : {};

  const loginResult = await Taro.login().catch(() => null);
  const code = loginResult?.code;

  const payload = forceMiniOpenIdLogin
    ? { openId: MINI_OPEN_ID, ...profile }
    : code
      ? { code, ...profile }
      : MINI_OPEN_ID && isWeChatDeveloperTool() && isDevelopmentApiBaseUrl(runtimeApiBaseUrl)
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
    throw new Error(localizeErrorMessage(response.data?.error?.message, '小程序登录失败'));
  }

  persistMiniAuthData(response.data.data);
  return response.data.data.accessToken;
}

export async function ensureMiniProgramAuth(options: MiniProgramAuthOptions = {}): Promise<string | null> {
  const storedToken = getReusableStoredToken(options);
  if (storedToken) {
    return storedToken;
  }
  clearIncompleteMiniAuthState(options);

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
