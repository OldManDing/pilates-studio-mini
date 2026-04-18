import { Image, Text, View } from '@tarojs/components';
import { useState } from 'react';
import { AppButton, AppCard } from '../../../components';
import type { HomeCuratedData } from './types';

interface HomeCuratedCardProps {
  data: HomeCuratedData;
  onClick?: () => void;
}

export default function HomeCuratedCard({ data, onClick }: HomeCuratedCardProps) {
  const [imageSrc, setImageSrc] = useState(data.imageUrl);

  return (
    <AppCard className='home-curated-card' padding='none'>
      <View className='home-curated-card__visual'>
        <Image
          className='home-curated-card__visual-image'
          src={imageSrc}
          mode='aspectFill'
          onError={() => setImageSrc(data.fallbackImageUrl)}
        />
        <Text className='home-curated-card__caption'>{data.caption}</Text>
      </View>

      <View className='home-curated-card__body'>
        <Text className='home-curated-card__title'>{data.title}</Text>
        <Text className='home-curated-card__meta-line'>{data.meta}</Text>

        <View className='home-curated-card__footer'>
          <Text className='home-curated-card__recommendation'>根据你的训练节奏推荐</Text>
          <AppButton className='home-curated-card__action' variant='primary' size='small' onClick={onClick}>
            {data.cta}
          </AppButton>
        </View>
      </View>
    </AppCard>
  );
}
