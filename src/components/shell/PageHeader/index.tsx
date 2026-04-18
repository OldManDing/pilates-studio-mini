import type { PropsWithChildren, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
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

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
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
  const handleBack = async () => {
    if (onBack) {
      onBack();
      return;
    }

    try {
      await Taro.navigateBack({ delta: 1 });
    } catch (error) {
      console.warn('PageHeader navigateBack failed without explicit fallback.', error);
    }
  };

  return (
    <View className='page-header'>
      <View className='page-header__row'>
        {showBack ? (
          <View className='page-header__back' onClick={handleBack}>
            <Icon name='chevron-left' className='page-header__back-icon' />
          </View>
        ) : (
          <View className='page-header__back page-header__back--placeholder' />
        )}

        <View className={joinClasses(['page-header__content', !showBack && 'page-header__content--full'])}>
          {eyebrow ? <Text className='page-header__eyebrow'>{eyebrow}</Text> : null}
          <Text className='page-header__title'>{title}</Text>
          {subtitle ? <Text className='page-header__subtitle'>{subtitle}</Text> : null}
        </View>

        <View className='page-header__right'>{rightSlot || children}</View>
      </View>
    </View>
  );
}
