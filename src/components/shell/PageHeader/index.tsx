import type { PropsWithChildren, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
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
      try {
        await Taro.navigateBack({ delta: 1 });
        return;
      } catch (error) {
        console.warn('PageHeader navigateBack failed, will switch to default tab.', error);
      }
    }

    if (isTabPageUrl(safeFallbackUrl)) {
      try {
        await Taro.switchTab({ url: safeFallbackUrl });
        return;
      } catch (error) {
        console.warn('PageHeader switchTab fallback failed, relaunching fallback page.', error);
      }
    }

    await Taro.reLaunch({ url: safeFallbackUrl });
  };

  return (
    <View className='page-header'>
      <View className='page-header__top'>
        {showBack ? (
          <View className='page-header__back' onClick={handleBack}>
            <Icon name='chevron-left' className='page-header__back-icon' />
            <Text className='page-header__back-text'>返回</Text>
          </View>
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
