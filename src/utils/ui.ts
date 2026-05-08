import Taro from '@tarojs/taro';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;

const SAFE_DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g|webp|gif);base64,/i;

const UNSAFE_IMAGE_PATTERNS = [
  /example\.com/i,
  /dummyimage/i,
  /placeholder/i,
  /placehold\.co/i,
];

interface MiniCapsuleRect {
  top?: number;
  bottom?: number;
  left?: number;
  width?: number;
  height?: number;
}

interface MiniWindowInfo {
  statusBarHeight?: number;
  windowWidth?: number;
  screenWidth?: number;
  safeArea?: {
    top?: number;
  };
}

type TaroWithMiniLayout = typeof Taro & {
  getMenuButtonBoundingClientRect?: () => MiniCapsuleRect;
  getSystemInfoSync?: () => MiniWindowInfo;
  getWindowInfo?: () => MiniWindowInfo;
};

export function getWeekdayLabel(date: Date) {
  return WEEKDAY_LABELS[date.getDay()] || '';
}

export function formatDurationMinutes(minutes: number, fallback = '时长待定') {
  return minutes > 0 ? `${minutes}分钟` : fallback;
}

export function getSafeMiniImageSrc(imageUrl: string | null | undefined, fallbackImageUrl: string) {
  const nextImageUrl = imageUrl?.trim();

  if (!nextImageUrl) {
    return fallbackImageUrl;
  }

  if (/^data:/i.test(nextImageUrl)) {
    return SAFE_DATA_IMAGE_PATTERN.test(nextImageUrl) ? nextImageUrl : fallbackImageUrl;
  }

  return UNSAFE_IMAGE_PATTERNS.some((pattern) => pattern.test(nextImageUrl)) ? fallbackImageUrl : nextImageUrl;
}

function getMiniLayoutInfo() {
  const miniTaro = Taro as TaroWithMiniLayout;
  const menuButtonRect = miniTaro.getMenuButtonBoundingClientRect?.();
  const windowInfo = miniTaro.getWindowInfo?.() || miniTaro.getSystemInfoSync?.();

  return { menuButtonRect, windowInfo };
}

export function getMiniPageTopInset() {
  try {
    const { menuButtonRect, windowInfo } = getMiniLayoutInfo();
    const statusBarHeight = windowInfo?.statusBarHeight || windowInfo?.safeArea?.top;
    const capsuleTop = menuButtonRect?.top;

    if (typeof statusBarHeight === 'number' && statusBarHeight > 0) {
      return Math.ceil(statusBarHeight + 12);
    }

    if (typeof capsuleTop === 'number' && capsuleTop > 0) {
      return Math.max(0, Math.ceil(capsuleTop - 4));
    }
  } catch {
    return 0;
  }

  return 0;
}

export function getMiniCapsuleAvoidanceStyle(extraGap = 12) {
  try {
    const { menuButtonRect, windowInfo } = getMiniLayoutInfo();
    const windowWidth = windowInfo?.windowWidth || windowInfo?.screenWidth;
    const capsuleLeft = menuButtonRect?.left;

    if (
      typeof windowWidth === 'number'
      && windowWidth > 0
      && typeof capsuleLeft === 'number'
      && capsuleLeft > 0
      && capsuleLeft < windowWidth
    ) {
      return { paddingRight: `${Math.ceil(windowWidth - capsuleLeft + extraGap)}px` };
    }

    if (typeof menuButtonRect?.width === 'number' && menuButtonRect.width > 0) {
      return { paddingRight: `${Math.ceil(menuButtonRect.width + extraGap)}px` };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function getMiniHeroContentStyle() {
  try {
    const topInset = getMiniPageTopInset();

    if (topInset > 0) {
      return { paddingTop: `${topInset}px` };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function getMiniFloatingBackStyle(extraGap = 0) {
  try {
    const { menuButtonRect, windowInfo } = getMiniLayoutInfo();
    const capsuleTop = menuButtonRect?.top;
    const statusBarHeight = windowInfo?.statusBarHeight || windowInfo?.safeArea?.top;

    if (typeof capsuleTop === 'number' && capsuleTop > 0) {
      return { top: `${Math.ceil(capsuleTop + extraGap)}px` };
    }

    if (typeof statusBarHeight === 'number' && statusBarHeight > 0) {
      return { top: `${Math.ceil(statusBarHeight + 8 + extraGap)}px` };
    }
  } catch {
    return undefined;
  }

  return undefined;
}
