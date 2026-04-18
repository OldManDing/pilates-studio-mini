import { Image, Text, View } from '@tarojs/components';
import { useState } from 'react';
import { AppCard } from '../../../components';
import type { BookingCourseCardData } from './types';

interface BookingCourseCardProps {
  data: BookingCourseCardData;
  onClick?: () => void;
}

export default function BookingCourseCard({ data, onClick }: BookingCourseCardProps) {
  const thumbImageMap: Record<string, string> = {
    yoga: '/assets/ui/booking-yoga.svg',
    pilates: '/assets/ui/booking-pilates.svg',
    meditation: '/assets/ui/booking-meditation.svg',
    dark: '/assets/ui/booking-dark.svg',
  };

  const remoteImageMap: Record<string, string> = {
    yoga: 'https://images.unsplash.com/photo-1649738247362-4e43a2665a77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3RyZXRjaGluZyUyMHdvbWFuJTIwc3R1ZGlvfGVufDF8fHx8MTc3NTQ4Mjc4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    pilates: 'https://images.unsplash.com/photo-1717500251741-cdbc93342d5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwcmVmb3JtZXIlMjBleGVyY2lzZXxlbnwxfHx8fDE3NzU0MTI0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    meditation: 'https://images.unsplash.com/photo-1682278763548-f349e3c73793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwemVuJTIwbWluZGZ1bG5lc3N8ZW58MXx8fHwxNzc1NDgyNzgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dark: 'https://images.unsplash.com/photo-1761034114091-6d30447e25aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwY2xhc3MlMjBzdHVkaW8lMjBncm91cHxlbnwxfHx8fDE3NzU0ODI3ODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  };

  const fallbackImage = thumbImageMap[data.imageKind] || thumbImageMap.yoga;
  const [imageSrc, setImageSrc] = useState(remoteImageMap[data.imageKind] || fallbackImage);

  return (
    <AppCard className={`booking-course-card ${data.full ? 'booking-course-card--full' : ''}`} padding='none' onClick={onClick}>
      <View className={`booking-course-card__thumb booking-course-card__thumb--${data.imageKind}`}>
        <Image className='booking-course-card__thumb-image' src={imageSrc} mode='aspectFill' onError={() => setImageSrc(fallbackImage)} />
        {data.full ? <View className='booking-course-card__full-badge'>已满</View> : null}
      </View>

      <View className='booking-course-card__body'>
        <Text className='booking-course-card__title'>{data.title}</Text>
        <View className='booking-course-card__meta-line'>
          <View className='booking-course-card__clock' />
          <Text className='booking-course-card__time'>{data.time} · {data.duration}</Text>
        </View>
        <View className='booking-course-card__footer'>
          <Text className='booking-course-card__meta'>{data.instructor} · {data.location}</Text>
        </View>
      </View>

      <View className='booking-course-card__right'>
        <Text className={`booking-course-card__spots ${data.full ? 'booking-course-card__spots--full' : ''}`}>{data.spotsText}</Text>
        <View className='booking-course-card__arrow'>
          <View className='booking-course-card__arrow-line' />
          <View className='booking-course-card__arrow-head' />
        </View>
      </View>
    </AppCard>
  );
}
