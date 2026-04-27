import { Text, View } from '@tarojs/components';
import { AppButton, AppCard, Icon } from '../../../components';
import type { HomeTodayCourseData } from './types';

interface HomeTodayCourseCardProps {
  data: HomeTodayCourseData;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function HomeTodayCourseCard({ data, onPrimaryClick, onSecondaryClick }: HomeTodayCourseCardProps) {
  return (
    <AppCard className='home-today-course-card' padding='none'>
      <View className='home-today-course-card__time-row'>
        <Icon name='clock' className='home-today-course-card__clock' />
        <Text className='home-today-course-card__time'>{data.timeRange}</Text>
        <Text className='home-today-course-card__duration'>{data.duration}</Text>
      </View>

      <View className='home-today-course-card__header'>
        <View>
          {data.label ? <Text className='home-today-course-card__label'>{data.label}</Text> : null}
          <Text className='home-today-course-card__title'>{data.title}</Text>
          {data.subtitle ? <Text className='home-today-course-card__subtitle'>{data.subtitle}</Text> : null}
        </View>
        {data.status ? <Text className='home-today-course-card__status'>{data.status}</Text> : null}
      </View>

      <Text className='home-today-course-card__meta'>{data.meta}</Text>
      {data.note ? <Text className='home-today-course-card__note'>{data.note}</Text> : null}

      <View className='home-today-course-card__actions'>
        <AppButton className='home-today-course-card__button' variant='primary' size='small' onClick={onPrimaryClick}>
          {data.primaryAction}
        </AppButton>
        {data.secondaryAction ? (
          <AppButton className='home-today-course-card__button' variant='outline' size='small' onClick={onSecondaryClick}>
            {data.secondaryAction}
          </AppButton>
        ) : null}
      </View>
    </AppCard>
  );
}
