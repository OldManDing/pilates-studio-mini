import { Text, View } from '@tarojs/components';
import { AppCard, Icon } from '../../../components';
import type { HomeUpcomingItemData } from './types';

interface HomeUpcomingListProps {
  data: HomeUpcomingItemData[];
  onItemClick?: (item: HomeUpcomingItemData) => void;
}

export default function HomeUpcomingList({ data, onItemClick }: HomeUpcomingListProps) {
  return (
    <AppCard className='home-upcoming-list' padding='none'>
      <View className='home-upcoming-list__items'>
        {data.length ? (
          data.map((item, index) => (
            <View key={item.key} className='home-upcoming-list__item' onClick={() => onItemClick?.(item)}>
              <View className='home-upcoming-list__date'>
                <Text className='home-upcoming-list__day'>{item.day}</Text>
                <Text className='home-upcoming-list__weekday'>{item.weekday}</Text>
              </View>

              <View className={`home-upcoming-list__mid-divider ${index === 0 ? 'home-upcoming-list__mid-divider--accent' : ''}`} />

              <View className='home-upcoming-list__body'>
                <View className='home-upcoming-list__title-row'>
                  <Text className='home-upcoming-list__item-title'>{item.title}</Text>
                  {item.label ? <Text className='home-upcoming-list__item-label'>{item.label}</Text> : null}
                </View>
                <Text className='home-upcoming-list__item-meta'>{item.meta}</Text>
              </View>

              <Icon name='chevron-right' className='home-upcoming-list__item-arrow' />

              {index < data.length - 1 ? <View className='home-upcoming-list__line' /> : null}
            </View>
          ))
        ) : (
          <View className='home-upcoming-list__empty'>
            <Text className='home-upcoming-list__empty-title'>近期还没有安排</Text>
            <Text className='home-upcoming-list__empty-text'>先去预约一节舒展或核心训练课程，新的安排会出现在这里。</Text>
          </View>
        )}
      </View>
    </AppCard>
  );
}
