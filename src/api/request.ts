import Taro from '@tarojs/taro';
import { ensureMiniProgramAuth, getApiBaseUrlUnavailableMessage, getRuntimeApiBaseUrl } from './auth';
import { getLocalizedErrorMessage, localizeErrorMessage } from '../utils/errorMessages';
import { hideLoadingSafely, showLoadingSafely, showSafeToast } from '../utils/feedback';
import { clearAuthState } from '../utils/storage';

type RequestData = object;

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: RequestData;
  params?: RequestData;
  headers?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
  skipAuth?: boolean;
  suppressErrorToast?: boolean;
  timeoutMs?: number;
  authInteractive?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  pageSize?: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
  };
}

export class ApiBusinessError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiBusinessError';
    this.code = code;
  }
}

export function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiBusinessError && /^unauthorized$/i.test(error.code || '');
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return getLocalizedErrorMessage(error, fallback);
}

function getToken(): string | null {
  return Taro.getStorageSync('token');
}

function normalizeRequestParams(params?: RequestData): RequestData | undefined {
  if (!params) {
    return undefined;
  }

  const normalizedParams: Record<string, unknown> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (key === 'limit') {
      normalizedParams.pageSize = value;
      return;
    }

    normalizedParams[key] = value;
  });

  return normalizedParams;
}

function normalizePaginationMeta(meta?: PaginationMeta): PaginationMeta | undefined {
  if (!meta) {
    return undefined;
  }

  const pageSize = meta.pageSize ?? meta.limit;

  return {
    ...meta,
    limit: meta.limit ?? pageSize,
    pageSize,
  };
}

function resolveNetworkFailureMessage(errorMessage: string, errMsg?: string) {
  const combined = `${errorMessage || ''} ${errMsg || ''}`.toLowerCase();

  if (combined.includes('not in domain list') || combined.includes('url not in domain list')) {
    return '请求合法域名未配置，请检查微信开发者工具域名校验设置';
  }

  if (combined.includes('timeout')) {
    return '请求超时，请检查后端服务与局域网连接';
  }

  if (combined.includes('refused') || combined.includes('econnrefused') || combined.includes('failed to fetch')) {
    return '后端服务不可达，请确认服务已启动且地址可访问';
  }

  if (combined.includes('ssl') || combined.includes('certificate') || combined.includes('tls')) {
    return '安全证书校验失败，请检查合法域名与证书配置';
  }

  return '网络连接失败，请检查网络';
}

let globalLoadingCount = 0;

function acquireGlobalLoading(title: string) {
  if (globalLoadingCount === 0) {
    showLoadingSafely({ title, mask: true });
  }

  globalLoadingCount += 1;
}

function releaseGlobalLoading() {
  if (globalLoadingCount <= 0) {
    globalLoadingCount = 0;
    return;
  }

  globalLoadingCount -= 1;

  if (globalLoadingCount === 0) {
    hideLoadingSafely();
  }
}

async function request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
  const {
    url,
    method = 'GET',
    data,
    params,
    headers = {},
    showLoading = true,
    loadingText = '加载中...',
    skipAuth = false,
    suppressErrorToast = false,
    timeoutMs = 30000,
    authInteractive = false,
  } = config;

  let loadingAcquired = false;

  const closeLoading = () => {
    if (!loadingAcquired) {
      return;
    }

    loadingAcquired = false;
    releaseGlobalLoading();
  };

  if (showLoading) {
    loadingAcquired = true;
    acquireGlobalLoading(loadingText);
  }

  try {
    const requestBaseUrl = getRuntimeApiBaseUrl();
    let fullUrl = `${requestBaseUrl}${url}`;
    const requestParams = normalizeRequestParams(params);
    if (requestParams && method === 'GET') {
      const queryString = Object.entries(requestParams)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    let token = getToken();
    if (!token && url !== '/mini-auth/login' && !skipAuth) {
      token = await ensureMiniProgramAuth({ interactive: authInteractive });
    }

    let response = await Taro.request({
      url: fullUrl,
      method,
      data: method !== 'GET' ? data : undefined,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      timeout: timeoutMs,
    });

    if (response.statusCode === 401 && url !== '/mini-auth/login' && !skipAuth) {
      clearAuthState();
      const refreshedToken = await ensureMiniProgramAuth({ interactive: authInteractive });
      if (refreshedToken) {
        response = await Taro.request({
          url: fullUrl,
          method,
          data: method !== 'GET' ? data : undefined,
          header: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshedToken}`,
            ...headers,
          },
          timeout: timeoutMs,
        });
      }
    }

    closeLoading();

    const result = response.data as ApiResponse<T>;

    if (!result.success) {
      const errorMsg = localizeErrorMessage(result.error?.message, '请求失败');

      if (result.error?.code === 'UNAUTHORIZED' || response.statusCode === 401) {
        clearAuthState();
        showSafeToast({ title: '登录已过期，请重新登录', icon: 'none' });
      }

      throw new ApiBusinessError(errorMsg, result.error?.code);
    }

      return {
        ...result,
        meta: normalizePaginationMeta(result.meta),
      };
  } catch (error) {
    closeLoading();

    const requestError = error instanceof Error ? error : new Error('请求失败');
    const errorMessage = localizeErrorMessage(requestError.message, '请求失败');
    const errorWithMessage = error as { errMsg?: string; message?: string };

    const apiBaseUrlUnavailableMessage = getApiBaseUrlUnavailableMessage(getRuntimeApiBaseUrl());

    if (suppressErrorToast) {
      throw requestError;
    }

    if (apiBaseUrlUnavailableMessage) {
      showSafeToast({ title: apiBaseUrlUnavailableMessage, icon: 'none' });
    } else if (errorWithMessage.errMsg?.includes('fail') || errorMessage.includes('Network')) {
      showSafeToast({ title: resolveNetworkFailureMessage(errorMessage, errorWithMessage.errMsg), icon: 'none' });
    } else if (!(requestError instanceof ApiBusinessError) && !errorMessage.includes('UNAUTHORIZED')) {
      showSafeToast({ title: errorMessage || '请求失败', icon: 'none' });
    }

    throw requestError;
  }
}

export const http = {
  get: <T = unknown>(url: string, params?: RequestData, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'GET', params, ...config }),

  post: <T = unknown>(url: string, data?: RequestData, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'POST', data, ...config }),

  put: <T = unknown>(url: string, data?: RequestData, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'PUT', data, ...config }),

  patch: <T = unknown>(url: string, data?: RequestData, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'PATCH', data, ...config }),

  delete: <T = unknown>(url: string, params?: RequestData, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'DELETE', params, ...config }),
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const defaultPagination: Required<PaginationParams> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  order: 'desc',
};

export function wrapListData<TItem, TKey extends string>(
  response: ApiResponse<TItem[]>,
  key: TKey,
): ApiResponse<Record<TKey, TItem[]> & { meta?: PaginationMeta }> {
  return {
    ...response,
    data: {
      [key]: response.data,
      meta: response.meta,
    } as Record<TKey, TItem[]> & { meta?: PaginationMeta },
  };
}

export function wrapObjectData<TItem, TKey extends string>(
  response: ApiResponse<TItem>,
  key: TKey,
): ApiResponse<Record<TKey, TItem>> {
  return {
    ...response,
    data: {
      [key]: response.data,
    } as Record<TKey, TItem>,
  };
}

export default request;
