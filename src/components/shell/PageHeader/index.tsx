import type { PropsWithChildren, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { getDefaultTabPageUrl, TAB_NAV_ITEMS, toTabPageUrl } from '../../../constants/navigation';
import Icon from '../Icon';
import './index.scss';

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  fallbackUrl?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

function isTabPageUrl(url: string) {
  return TAB_NAV_ITEMS.some((item) => toTabPageUrl(item.pagePath) === url);
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  showBack = true,
  fallbackUrl,
  onBack,
  rightSlot,
  children,
}: PageHeaderProps) {
  const rightContent = rightSlot ?? children;

  const handleBack = async () => {
    if (onBack) {
      onBack();
      return;
    }

    const safeFallbackUrl = fallbackUrl || getDefaultTabPageUrl();
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
  };

  return (
    <View className='page-header'>
      <View className='page-header__top'>
        {showBack ? (
          <Button className='page-header__back' hoverClass='none' onClick={handleBack}>
            <Icon name='chevron-left' className='page-header__back-icon' />
            <Text className='page-header__back-text'>返回</Text>
          </Button>
        ) : (
          <View className='page-header__back page-header__back--placeholder' />
        )}

        {rightContent ? (
          <View className='page-header__right'>
            {rightContent}
          </View>
        ) : null}
      </View>

      <View className='page-header__content'>
        {eyebrow ? <Text className='page-header__eyebrow'>{eyebrow}</Text> : null}
        <Text className='page-header__title'>{title}</Text>
        {subtitle ? <Text className='page-header__subtitle'>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
