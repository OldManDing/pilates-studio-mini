import Taro from '@tarojs/taro';

type TaroWithFeedbackGuards = typeof Taro & {
  __pilatesFeedbackGuardsInstalled?: boolean;
};

function callAndIgnoreRejection(action: () => Promise<unknown> | unknown) {
  try {
    const result = action();
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      void (result as Promise<unknown>).catch(() => undefined);
    }
  } catch {
    // WeChat feedback APIs may reject when toast/loading state has already changed.
  }
}

export function showSafeToast(options: Parameters<typeof Taro.showToast>[0]) {
  callAndIgnoreRejection(() => Taro.showToast(options));
}

export function showLoadingSafely(options: Parameters<typeof Taro.showLoading>[0]) {
  const safeOptions = {
    ...options,
    fail: () => undefined,
  } as Parameters<typeof Taro.showLoading>[0];
  callAndIgnoreRejection(() => Taro.showLoading(safeOptions));
}

export function hideLoadingSafely(options?: Parameters<typeof Taro.hideLoading>[0]) {
  const safeOptions = {
    ...options,
    fail: () => undefined,
  } as Parameters<typeof Taro.hideLoading>[0];
  callAndIgnoreRejection(() => Taro.hideLoading(safeOptions));
}

export function installFeedbackGuards() {
  const guardedTaro = Taro as TaroWithFeedbackGuards;

  if (guardedTaro.__pilatesFeedbackGuardsInstalled) {
    return;
  }

  const rawShowToast = Taro.showToast.bind(Taro);
  const rawHideLoading = Taro.hideLoading.bind(Taro) as (options?: Parameters<typeof Taro.hideLoading>[0]) => unknown;

  guardedTaro.showToast = ((options: Parameters<typeof Taro.showToast>[0]) => {
    try {
      const result = rawShowToast(options);
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        void (result as Promise<unknown>).catch(() => undefined);
      }
      return result;
    } catch {
      return Promise.resolve({ errMsg: 'showToast:ok' }) as ReturnType<typeof Taro.showToast>;
    }
  }) as typeof Taro.showToast;

  guardedTaro.hideLoading = ((options?: Parameters<typeof Taro.hideLoading>[0]) => {
    try {
      const safeOptions = {
        ...options,
        fail: () => undefined,
      } as Parameters<typeof Taro.hideLoading>[0];
      const result = rawHideLoading(safeOptions);
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        void (result as Promise<unknown>).catch(() => undefined);
      }
      return result as ReturnType<typeof Taro.hideLoading>;
    } catch {
      return undefined as ReturnType<typeof Taro.hideLoading>;
    }
  }) as typeof Taro.hideLoading;

  guardedTaro.__pilatesFeedbackGuardsInstalled = true;
}
