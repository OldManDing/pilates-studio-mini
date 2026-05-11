import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { settingsApi, type MiniPageImageKey, type MiniPageImageSetting } from '../api/settings';

const miniPageImageCache = new Map<MiniPageImageKey, string>();
const miniPageInlineFileCache = new Map<string, string>();
let miniPageImagesRequest: Promise<MiniPageImageSetting[]> | null = null;
let miniPageImagesFetchedAt = 0;
let miniPageImagesLastFailureAt = 0;

const MINI_PAGE_IMAGES_CACHE_TTL_MS = 10 * 60 * 1000;
const MINI_PAGE_IMAGES_RETRY_COOLDOWN_MS = 60 * 1000;
const INLINE_IMAGE_DATA_URL_PATTERN = /^data:image\/([a-z0-9.+-]+);base64,(.+)$/i;

type MiniFileSystemManager = {
  accessSync?: (path: string) => void;
  writeFileSync?: (path: string, data: string, encoding?: string) => void;
};

type TaroWithFileSystem = typeof Taro & {
  env?: { USER_DATA_PATH?: string };
  getFileSystemManager?: () => MiniFileSystemManager;
};

export const MINI_PAGE_IMAGE_FALLBACKS: Record<MiniPageImageKey, string> = {
  home: '/assets/ui/hero-studio.jpg',
  courses: '/assets/ui/hero-courses.jpg',
  profile: '/assets/ui/hero-profile.jpg',
  coaches: '/assets/ui/hero-courses.jpg',
  membership: '/assets/ui/hero-profile.jpg',
  membershipRenew: '/assets/ui/hero-profile.jpg',
  myBookings: '/assets/ui/hero-courses.jpg',
  trainingRecords: '/assets/ui/hero-courses.jpg',
  myCoaches: '/assets/ui/hero-courses.jpg',
  notifications: '/assets/ui/hero-profile.jpg',
  help: '/assets/ui/hero-studio.jpg',
  settings: '/assets/ui/hero-profile.jpg',
  accountSecurity: '/assets/ui/hero-profile.jpg',
  agreement: '/assets/ui/hero-profile.jpg',
  privacy: '/assets/ui/hero-profile.jpg',
  transactions: '/assets/ui/hero-profile.jpg',
};

function hasCachedMiniPageImages() {
  return miniPageImageCache.size > 0;
}

function isMiniPageImagesCacheFresh() {
  return hasCachedMiniPageImages() && Date.now() - miniPageImagesFetchedAt < MINI_PAGE_IMAGES_CACHE_TTL_MS;
}

function isMiniPageImagesRetryCoolingDown() {
  return miniPageImagesLastFailureAt > 0 && Date.now() - miniPageImagesLastFailureAt < MINI_PAGE_IMAGES_RETRY_COOLDOWN_MS;
}

function getInlineImageExtension(mimeSubtype: string) {
  if (mimeSubtype === 'jpeg' || mimeSubtype === 'jpg') {
    return 'jpg';
  }

  if (mimeSubtype === 'svg+xml') {
    return 'svg';
  }

  return mimeSubtype.replace(/[^a-z0-9]/gi, '') || 'img';
}

function createStableImageKey(pageKey: MiniPageImageKey, dataUrl: string) {
  const seed = `${pageKey}:${dataUrl.length}:${dataUrl.slice(0, 96)}:${dataUrl.slice(-96)}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function resolveInlineImagePath(pageKey: MiniPageImageKey, dataUrl: string) {
  const match = dataUrl.match(INLINE_IMAGE_DATA_URL_PATTERN);
  if (!match) {
    return dataUrl;
  }

  const [, mimeSubtype, base64Data] = match;
  const taroWithFileSystem = Taro as TaroWithFileSystem;
  const userDataPath = taroWithFileSystem.env?.USER_DATA_PATH;
  const fileSystemManager = taroWithFileSystem.getFileSystemManager?.();

  if (!userDataPath || !fileSystemManager?.writeFileSync) {
    return dataUrl;
  }

  const cacheKey = createStableImageKey(pageKey, dataUrl);
  const cachedFilePath = miniPageInlineFileCache.get(cacheKey);
  if (cachedFilePath) {
    return cachedFilePath;
  }

  const extension = getInlineImageExtension(mimeSubtype.toLowerCase());
  const filePath = `${userDataPath}/pilates-mini-page-${pageKey}-${cacheKey}.${extension}`;

  try {
    fileSystemManager.accessSync?.(filePath);
    miniPageInlineFileCache.set(cacheKey, filePath);
    return filePath;
  } catch {
    // File does not exist yet. It will be written below.
  }

  try {
    fileSystemManager.writeFileSync(filePath, base64Data, 'base64');
    miniPageInlineFileCache.set(cacheKey, filePath);
    return filePath;
  } catch {
    return dataUrl;
  }
}

function sanitizeMiniPageImageUrl(item: MiniPageImageSetting) {
  const imageUrl = item.imageUrl?.trim() || '';
  const defaultImageUrl = item.defaultImageUrl || MINI_PAGE_IMAGE_FALLBACKS[item.pageKey];

  if (INLINE_IMAGE_DATA_URL_PATTERN.test(imageUrl)) {
    return resolveInlineImagePath(item.pageKey, imageUrl);
  }

  return imageUrl || defaultImageUrl;
}

function getMiniPageImages(options: { force?: boolean } = {}) {
  const force = options.force === true;

  if (!force && (isMiniPageImagesCacheFresh() || isMiniPageImagesRetryCoolingDown())) {
    return Promise.resolve([]);
  }

  if (force) {
    miniPageImagesRequest = null;
  }

  if (!miniPageImagesRequest) {
    miniPageImagesRequest = settingsApi.getMiniPageImages()
      .then((response) => {
        miniPageImageCache.clear();
        (response.data || []).forEach((item) => {
          miniPageImageCache.set(item.pageKey, sanitizeMiniPageImageUrl(item));
        });
        miniPageImagesFetchedAt = Date.now();
        miniPageImagesLastFailureAt = 0;
        return response.data;
      })
      .catch((error) => {
        miniPageImagesRequest = null;
        miniPageImagesLastFailureAt = Date.now();
        throw error;
      });
  }

  return miniPageImagesRequest;
}

export function getMiniPageImageFallback(pageKey?: MiniPageImageKey, fallbackImage?: string) {
  if (fallbackImage) {
    return fallbackImage;
  }

  return pageKey ? MINI_PAGE_IMAGE_FALLBACKS[pageKey] : MINI_PAGE_IMAGE_FALLBACKS.home;
}

export function useMiniPageImage(pageKey: MiniPageImageKey | undefined, fallbackImage?: string) {
  const resolvedFallback = useMemo(() => getMiniPageImageFallback(pageKey, fallbackImage), [fallbackImage, pageKey]);
  const [imageSrc, setImageSrc] = useState(resolvedFallback);

  const refresh = useCallback((options?: { force?: boolean }) => {
    if (!pageKey) {
      setImageSrc(resolvedFallback);
      return Promise.resolve();
    }

    const cachedImage = miniPageImageCache.get(pageKey);
    if (cachedImage && !options?.force) {
      setImageSrc(cachedImage);
      if (isMiniPageImagesCacheFresh() || isMiniPageImagesRetryCoolingDown()) {
        return Promise.resolve();
      }
    }

    return getMiniPageImages({ force: options?.force })
      .then(() => {
        setImageSrc(miniPageImageCache.get(pageKey) || resolvedFallback);
      })
      .catch(() => {
        setImageSrc(resolvedFallback);
      });
  }, [pageKey, resolvedFallback]);

  useEffect(() => {
    let active = true;
    setImageSrc(resolvedFallback);

    if (!pageKey) {
      return () => {
        active = false;
      };
    }

    const cachedImage = miniPageImageCache.get(pageKey);
    if (cachedImage) {
      setImageSrc(cachedImage);
      return () => {
        active = false;
      };
    }

    getMiniPageImages()
      .then(() => {
        if (!active) {
          return;
        }

        setImageSrc(miniPageImageCache.get(pageKey) || resolvedFallback);
      })
      .catch(() => {
        if (active) {
          setImageSrc(resolvedFallback);
        }
      });

    return () => {
      active = false;
    };
  }, [pageKey, resolvedFallback]);

  return { imageSrc, fallbackImageSrc: resolvedFallback, setImageSrc, refresh };
}
