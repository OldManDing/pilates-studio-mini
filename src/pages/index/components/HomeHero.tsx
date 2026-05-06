import { Image, Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import type { HomeHeroData } from './types';
import { getMiniHeroContentStyle } from '../../../utils/ui';

interface HomeHeroProps {
  data: HomeHeroData;
}

export default function HomeHero({ data }: HomeHeroProps) {
  const fallbackImageSrc = '/assets/ui/hero-studio.jpg';
  const [imageSrc, setImageSrc] = useState(data.imageUrl || fallbackImageSrc);
  const contentStyle = getMiniHeroContentStyle();

  useEffect(() => {
    setImageSrc(data.imageUrl || fallbackImageSrc);
  }, [data.imageUrl]);

  return (
    <View className='home-hero'>
      <Image className='home-hero__image' src={imageSrc} mode='aspectFill' onError={() => setImageSrc(fallbackImageSrc)} />
      <View className='home-hero__mask' />

      <View className='home-hero__inner' style={contentStyle}>
        <View className='home-hero__main'>
          <Text className='home-hero__title'>{data.title}</Text>
          <Text className='home-hero__subtitle'>{data.subtitle}</Text>
        </View>
      </View>
    </View>
  );
}
