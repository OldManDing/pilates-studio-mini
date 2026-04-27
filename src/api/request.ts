import Taro from '@tarojs/taro';
import { ensureMiniProgramAuth } from './auth';
import { clearAuthState } from '../utils/storage';

declare const API_BASE_URL: string;

const REQUEST_BASE_URL = API_BASE_URL;

type RequestData = object;

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: RequestData;
  params?: RequestData;
  headers?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
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
  return error instanceof ApiBusinessError && error.code === 'UNAUTHORIZED';
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
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

async function request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
  const {
    url,
    method = 'GET',
    data,
    params,
    headers = {},
    showLoading = true,
    loadingText = '加载中...',
  } = config;

  if (showLoading) {
    Taro.showLoading({ title: loadingText, mask: true });
  }

  try {
    let fullUrl = `${REQUEST_BASE_URL}${url}`;
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
    if (!token && url !== '/mini-auth/login') {
      token = await ensureMiniProgramAuth();
    }

    const response = await Taro.request({
      url: fullUrl,
      method,
      data: method !== 'GET' ? data : undefined,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      timeout: 30000,
    });

    if (showLoading) {
      Taro.hideLoading();
    }

    const result = response.data as ApiResponse<T>;

    if (!result.success) {
      const errorMsg = result.error?.message || '请求失败';

      if (result.error?.code === 'UNAUTHORIZED' || response.statusCode === 401) {
        clearAuthState();
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
      }

      throw new ApiBusinessError(errorMsg, result.error?.code);
    }

      return {
        ...result,
        meta: normalizePaginationMeta(result.meta),
      };
  } catch (error) {
    if (showLoading) {
      Taro.hideLoading();
    }

    const requestError = error instanceof Error ? error : new Error('请求失败');
    const errorMessage = requestError.message;
    const errorWithMessage = error as { errMsg?: string; message?: string };

    if (errorWithMessage.errMsg?.includes('fail') || errorMessage.includes('Network')) {
      Taro.showToast({ title: '网络连接失败，请检查网络', icon: 'none' });
    } else if (!(requestError instanceof ApiBusinessError) && !errorMessage.includes('UNAUTHORIZED')) {
      Taro.showToast({ title: errorMessage || '请求失败', icon: 'none' });
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
