import Taro from '@tarojs/taro';

// API base URL from environment
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Request config interface
interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: Record<string, any>;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Get stored token
function getToken(): string | null {
  return Taro.getStorageSync('token');
}

// Request interceptor
async function request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
  const {
    url,
    method = 'GET',
    data,
    params,
    headers = {},
    showLoading = true,
    loadingText = '加载中...',
  } = config;

  // Show loading
  if (showLoading) {
    Taro.showLoading({ title: loadingText, mask: true });
  }

  try {
    // Build query string for GET requests
    let fullUrl = `${API_BASE_URL}${url}`;
    if (params && method === 'GET') {
      const queryString = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    // Get token
    const token = getToken();

    // Make request
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

    Taro.hideLoading();

    const result = response.data as ApiResponse<T>;

    // Handle business errors
    if (!result.success) {
      const errorMsg = result.error?.message || '请求失败';

      // Handle authentication errors
      if (result.error?.code === 'UNAUTHORIZED' || response.statusCode === 401) {
        Taro.removeStorageSync('token');
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
        // Optionally redirect to login
        // Taro.navigateTo({ url: '/pages/login/index' });
      } else {
        Taro.showToast({ title: errorMsg, icon: 'none' });
      }

      throw new Error(errorMsg);
    }

    return result;
  } catch (error: any) {
    Taro.hideLoading();

    // Handle network errors
    if (error.errMsg?.includes('fail') || error.message?.includes('Network')) {
      Taro.showToast({ title: '网络连接失败，请检查网络', icon: 'none' });
    } else if (!error.message?.includes('UNAUTHORIZED')) {
      Taro.showToast({ title: error.message || '请求失败', icon: 'none' });
    }

    throw error;
  }
}

// HTTP methods
export const http = {
  get: <T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'GET', params, ...config }),

  post: <T = any>(url: string, data?: Record<string, any>, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'POST', data, ...config }),

  put: <T = any>(url: string, data?: Record<string, any>, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'PUT', data, ...config }),

  patch: <T = any>(url: string, data?: Record<string, any>, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'PATCH', data, ...config }),

  delete: <T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'DELETE', params, ...config }),
};

// Pagination params interface
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Default pagination
export const defaultPagination: Required<PaginationParams> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  order: 'desc',
};

export default request;
