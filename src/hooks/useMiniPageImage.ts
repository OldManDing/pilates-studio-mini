import { useCallback, useEffect, useMemo, useState } from 'react';
import { settingsApi, type MiniPageImageKey, type MiniPageImageSetting } from '../api/settings';

const miniPageImageCache = new Map<MiniPageImageKey, string>();
let miniPageImagesRequest: Promise<MiniPageImageSetting[]> | null = null;

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

function getMiniPageImages(force = false) {
  if (force) {
    miniPageImagesRequest = null;
  }

  if (!miniPageImagesRequest) {
    miniPageImagesRequest = settingsApi.getMiniPageImages()
      .then((response) => {
        miniPageImageCache.clear();
        response.data.forEach((item) => {
          miniPageImageCache.set(item.pageKey, item.imageUrl?.trim() || item.defaultImageUrl || MINI_PAGE_IMAGE_FALLBACKS[item.pageKey]);
        });
        return response.data;
      })
      .catch((error) => {
        miniPageImagesRequest = null;
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

  const refresh = useCallback(() => {
    if (!pageKey) {
      setImageSrc(resolvedFallback);
      return Promise.resolve();
    }

    return getMiniPageImages(true)
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
