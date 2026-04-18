import type { PropsWithChildren, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { getDefaultTabPageUrl } from '../../../constants/navigation';
import Icon from '../Icon';
import './index.scss';

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  showBack = true,
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

    const fallbackUrl = getDefaultTabPageUrl();
    const pages = Taro.getCurrentPages();

    if (pages.length > 1) {
      try {
        await Taro.navigateBack({ delta: 1 });
        return;
      } catch (error) {
        console.warn('PageHeader navigateBack failed, will switch to default tab.', error);
      }
    }

    try {
      await Taro.switchTab({ url: fallbackUrl });
    } catch (error) {
      console.warn('PageHeader switchTab fallback failed, relaunching default tab.', error);
      await Taro.reLaunch({ url: fallbackUrl });
    }
  };

  return (
    <View className='page-header'>
      <View className='page-header__row'>
        <View className='page-header__side page-header__side--left'>
          {showBack ? (
            <View className='page-header__back' onClick={handleBack}>
              <Icon name='chevron-left' className='page-header__back-icon' />
            </View>
          ) : (
            <View className='page-header__back page-header__back--placeholder' />
          )}
        </View>

        <View className='page-header__content'>
          {eyebrow ? <Text className='page-header__eyebrow'>{eyebrow}</Text> : null}
          <Text className='page-header__title'>{title}</Text>
          {subtitle ? <Text className='page-header__subtitle'>{subtitle}</Text> : null}
        </View>

        <View className='page-header__side page-header__side--right'>
          {rightContent ? (
            <View className='page-header__right'>
              {rightContent}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
