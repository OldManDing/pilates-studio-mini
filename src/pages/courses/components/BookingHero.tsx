import { Text, View } from '@tarojs/components';
import type { BookingHeroData } from './types';

interface BookingHeroProps {
  data: BookingHeroData;
  onActionClick?: () => void;
}

export default function BookingHero({ data, onActionClick }: BookingHeroProps) {
  return (
    <View className='booking-hero'>
      <View className='booking-hero__top'>
        <Text className='booking-hero__eyebrow'>{data.eyebrow}</Text>
        <View className='booking-hero__action' onClick={onActionClick}>
          <Text className='booking-hero__action-text'>{data.actionLabel}</Text>
          <View className='booking-hero__action-arrow' />
        </View>
      </View>
      <Text className='booking-hero__title'>{data.title}</Text>
      <Text className='booking-hero__subtitle'>{data.subtitle}</Text>
    </View>
  );
}
