import { Image, Text, View } from '@tarojs/components';
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

  const imageSrc = thumbImageMap[data.imageKind] || thumbImageMap.yoga;

  return (
    <AppCard className={`booking-course-card ${data.full ? 'booking-course-card--full' : ''}`} padding='none' onClick={onClick}>
      <View className={`booking-course-card__thumb booking-course-card__thumb--${data.imageKind}`}>
        <Image className='booking-course-card__thumb-image' src={imageSrc} mode='aspectFill' />
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
