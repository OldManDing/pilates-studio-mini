import { Text, View } from '@tarojs/components';
import type { HomeTodayCourseData } from './types';

interface HomeTodayCourseCardProps {
  data: HomeTodayCourseData;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function HomeTodayCourseCard({ data, onPrimaryClick, onSecondaryClick }: HomeTodayCourseCardProps) {
  return (
    <View className='home-today-course-card home-shell-card'>
      <View className='home-today-course-card__header'>
        <Text className='home-today-course-card__label'>{data.label}</Text>
        <Text className='home-today-course-card__status'>{data.status}</Text>
      </View>

      <View className='home-today-course-card__meta-row'>
        <View className='home-today-course-card__time-chip'>
          <View className='home-today-course-card__clock' />
          <Text className='home-today-course-card__time'>{data.timeRange}</Text>
        </View>
        <Text className='home-today-course-card__duration'>{data.duration}</Text>
      </View>

      <Text className='home-today-course-card__title'>{data.title}</Text>
      <Text className='home-today-course-card__meta'>{data.meta}</Text>

      <View className='home-today-course-card__actions'>
        <View className='home-shell-button home-shell-button--primary' onClick={onPrimaryClick}>
          <Text className='home-shell-button__text home-shell-button__text--primary'>查看详情</Text>
        </View>

        <View className='home-shell-button home-shell-button--secondary' onClick={onSecondaryClick}>
          <Text className='home-shell-button__text home-shell-button__text--secondary'>改约</Text>
        </View>
      </View>
    </View>
  );
}
