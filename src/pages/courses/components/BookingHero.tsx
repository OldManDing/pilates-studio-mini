import { Image, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import type { BookingHeroData } from './types';

interface BookingHeroProps {
  data: BookingHeroData;
}

export default function BookingHero({ data }: BookingHeroProps) {
  const fallbackImageSrc = '/assets/ui/hero-courses.jpg';
  const [imageSrc, setImageSrc] = useState(data.imageUrl || fallbackImageSrc);

  useEffect(() => {
    setImageSrc(data.imageUrl || fallbackImageSrc);
  }, [data.imageUrl]);

  return (
    <View className='booking-hero'>
      <Image className='booking-hero__image' src={imageSrc} mode='aspectFill' onError={() => setImageSrc(fallbackImageSrc)} />
      <View className='booking-hero__mask' />
    </View>
  );
}
