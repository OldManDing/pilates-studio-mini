import { Text, View } from '@tarojs/components';
import type { BookingCourseCardData } from './types';

interface BookingCourseCardProps {
  data: BookingCourseCardData;
  onClick?: () => void;
}

export default function BookingCourseCard({ data, onClick }: BookingCourseCardProps) {
  return (
    <View className='booking-course-card' onClick={onClick}>
      <View className={`booking-course-card__thumb booking-course-card__thumb--${data.imageKind}`}>
        {data.full ? <View className='booking-course-card__full-badge'>已满</View> : null}
      </View>

      <View className='booking-course-card__body'>
        <Text className='booking-course-card__title'>{data.title}</Text>
        <View className='booking-course-card__meta-line'>
          <View className='booking-course-card__clock' />
          <Text className='booking-course-card__time'>{data.time}</Text>
          <Text className='booking-course-card__duration'>· {data.duration}</Text>
        </View>
        <Text className='booking-course-card__meta'>{data.instructor} · {data.location}</Text>
      </View>

      <Text className={`booking-course-card__spots ${data.full ? 'booking-course-card__spots--full' : ''}`}>{data.spotsText}</Text>
    </View>
  );
}
