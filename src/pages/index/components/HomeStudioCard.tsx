import { Button, Image, Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { AppCard } from '../../../components';
import type { HomeStudioData } from './types';

interface HomeStudioCardProps {
  data: HomeStudioData;
  onClick?: () => void;
}

const fallbackImageSrc = '/assets/ui/hero-studio.jpg';

export default function HomeStudioCard({ data, onClick }: HomeStudioCardProps) {
  const [imageSrc, setImageSrc] = useState(data.imageUrl || fallbackImageSrc);

  useEffect(() => {
    setImageSrc(data.imageUrl || fallbackImageSrc);
  }, [data.imageUrl]);

  return (
    <AppCard className='home-studio-card' padding='none'>
      <View className='home-studio-card__top'>
        <View className='home-studio-card__content'>
          <Text className='home-studio-card__label'>{data.label}</Text>
          <Text className='home-studio-card__name'>{data.name}</Text>
        </View>

        <View className='home-studio-card__visual'>
          <Image
            className='home-studio-card__visual-image'
            src={imageSrc}
            mode='aspectFill'
            onError={() => setImageSrc(fallbackImageSrc)}
          />
        </View>
      </View>

      <View className='home-studio-card__address-row'>
        <Image className='home-studio-card__address-icon' src='/assets/ui/icon-studio-map-pin.svg' mode='aspectFit' />
        <Text className='home-studio-card__address'>{data.address}</Text>
      </View>
      <Text className='home-studio-card__hours'>{data.hours}</Text>

      <Button className='home-studio-card__action' hoverClass='none' onClick={onClick}>
        <Text className='home-studio-card__action-text'>{data.actionLabel}</Text>
      </Button>
    </AppCard>
  );
}
