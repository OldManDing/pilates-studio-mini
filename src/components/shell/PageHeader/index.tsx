import type { PropsWithChildren, ReactNode } from 'react';
import { Button, Image, Text, View } from '@tarojs/components';
import type { MiniPageImageKey } from '../../../api/settings';
import { useMiniPageImage } from '../../../hooks/useMiniPageImage';
import { navigateBackWithFallback } from '../../../utils/navigation';
import { getMiniCapsuleAvoidanceStyle } from '../../../utils/ui';
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
  imageSrc?: string;
  pageKey?: MiniPageImageKey;
}

function getHeaderFallbackImageSrc(title: string, imageSrc?: string) {
  if (imageSrc) {
    return imageSrc;
  }

  if (/课程|预约|训练|教练/.test(title)) {
    return '/assets/ui/hero-courses.jpg';
  }

  if (/会员|账户|消息|设置|隐私|协议|消费/.test(title)) {
    return '/assets/ui/hero-profile.jpg';
  }

  return '/assets/ui/hero-studio.jpg';
}

export default function PageHeader({
  title,
  showBack = true,
  fallbackUrl,
  onBack,
  rightSlot,
  children,
  imageSrc,
  pageKey,
}: PageHeaderProps) {
  const rightContent = rightSlot ?? children;
  const topStyle = getMiniCapsuleAvoidanceStyle();
  const fallbackImageSrc = getHeaderFallbackImageSrc(title, imageSrc);
  const { imageSrc: headerImageSrc, fallbackImageSrc: resolvedFallbackImageSrc, setImageSrc } = useMiniPageImage(
    imageSrc ? undefined : pageKey,
    fallbackImageSrc,
  );

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    void navigateBackWithFallback(fallbackUrl);
  };

  return (
    <View className='page-header'>
      <Image className='page-header__image' src={headerImageSrc} mode='aspectFill' onError={() => setImageSrc(resolvedFallbackImageSrc)} />
      <View className='page-header__mask' />

      <View className='page-header__top' style={topStyle}>
        {showBack ? (
          <Button className='page-header__back' hoverClass='none' onClick={handleBack}>
            <Icon name='chevron-left' className='page-header__back-icon' />
            <Text className='page-header__back-text'>返回</Text>
          </Button>
        ) : (
          <View />
        )}

        {rightContent ? (
          <View className='page-header__right'>
            {rightContent}
          </View>
        ) : null}
      </View>

      <View className='page-header__content'>
        <Text className='page-header__title'>{title}</Text>
      </View>
    </View>
  );
}
