import { Button, Image, Text, View } from '@tarojs/components';
import { useState } from 'react';
import { AppCard, Icon } from '../../../components';
import type { HomeStudioData } from './types';

interface HomeStudioCardProps {
  data: HomeStudioData;
  onClick?: () => void;
}

export default function HomeStudioCard({ data, onClick }: HomeStudioCardProps) {
  const [imageSrc, setImageSrc] = useState(data.imageUrl || '');

  return (
    <AppCard className='home-studio-card' padding='none'>
      {imageSrc ? (
        <Image
          className='home-studio-card__visual-image'
          src={imageSrc}
          mode='aspectFill'
          onError={() => setImageSrc('')}
        />
      ) : null}

      <View className='home-studio-card__top'>
        <View>
          <Text className='home-studio-card__label'>{data.label}</Text>
          <Text className='home-studio-card__name'>{data.name}</Text>
        </View>

        <View className='home-studio-card__pin'>
          <View className='home-studio-card__pin-ring'>
            <Icon name='pin' className='home-studio-card__pin-icon' />
          </View>
        </View>
      </View>

      <Text className='home-studio-card__address'>{data.address}</Text>
      <Text className='home-studio-card__hours'>{data.hours}</Text>

      <Button className='home-studio-card__action' hoverClass='none' onClick={onClick}>
        <Text className='home-studio-card__action-text'>{data.actionLabel}</Text>
      </Button>
    </AppCard>
  );
}
