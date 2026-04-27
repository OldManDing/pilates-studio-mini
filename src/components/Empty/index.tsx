import type { PropsWithChildren } from 'react';
import { View, Text, Image } from '@tarojs/components';
import AppButton from '../shell/AppButton';
import Icon, { type IconName } from '../shell/Icon';
import './index.scss';

interface EmptyProps extends PropsWithChildren {
  title?: string;
  description?: string;
  image?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export default function Empty({
  title = '暂无数据',
  description = '',
  image,
  actionLabel,
  onActionClick,
  children,
}: EmptyProps) {
  const iconName: IconName = title.includes('失败') ? 'alert-circle' : 'info';

  return (
    <View className='empty'>
      {image ? (
        <Image className='empty__image' src={image} mode='aspectFit' />
      ) : (
        <View className='empty__icon'>
          <View className='empty__icon-ring'>
            <Icon name={iconName} className='empty__icon-symbol' />
          </View>
        </View>
      )}
      <Text className='empty__title'>{title}</Text>
      {description && (
        <Text className='empty__desc'>{description}</Text>
      )}
      {children}
      {actionLabel && onActionClick ? (
        <View className='empty__action'>
          <AppButton size='small' variant='primary' onClick={onActionClick}>{actionLabel}</AppButton>
        </View>
      ) : null}
    </View>
  );
}
