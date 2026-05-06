import Taro from '@tarojs/taro';
import { getDefaultTabPageUrl, TAB_NAV_ITEMS, toTabPageUrl } from '../constants/navigation';

export function normalizePageUrl(url: string) {
  return url.startsWith('/') ? url : `/${url}`;
}

export function isTabPageUrl(url: string) {
  const normalizedUrl = normalizePageUrl(url);
  return TAB_NAV_ITEMS.some((item) => toTabPageUrl(item.pagePath) === normalizedUrl);
}

export async function navigateBackWithFallback(fallbackUrl?: string) {
  const safeFallbackUrl = normalizePageUrl(fallbackUrl || getDefaultTabPageUrl());
  const pages = Taro.getCurrentPages();

  if (pages.length > 1) {
    const navigatedBack = await Taro.navigateBack({ delta: 1 })
      .then(() => true)
      .catch(() => false);

    if (navigatedBack) {
      return;
    }
  }

  if (isTabPageUrl(safeFallbackUrl)) {
    const switchedTab = await Taro.switchTab({ url: safeFallbackUrl })
      .then(() => true)
      .catch(() => false);

    if (switchedTab) {
      return;
    }
  }

  await Taro.reLaunch({ url: safeFallbackUrl });
}
