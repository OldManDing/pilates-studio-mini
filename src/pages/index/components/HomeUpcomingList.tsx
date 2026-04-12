import { Text, View } from '@tarojs/components';
import type { HomeUpcomingItemData } from './types';

interface HomeUpcomingListProps {
  data: HomeUpcomingItemData[];
  onMoreClick?: () => void;
}

export default function HomeUpcomingList({ data, onMoreClick }: HomeUpcomingListProps) {
  return (
    <View className='home-upcoming-list home-shell-card'>
      <View className='home-upcoming-list__header'>
        <Text className='home-upcoming-list__title'>近期安排</Text>
        <View className='home-upcoming-list__more' onClick={onMoreClick}>
          <Text className='home-upcoming-list__more-text'>全部</Text>
          <View className='home-upcoming-list__more-arrow' />
        </View>
      </View>

      <View className='home-upcoming-list__items'>
        {data.map((item) => (
          <View key={item.key} className='home-upcoming-list__item'>
            <View className='home-upcoming-list__date'>
              <Text className='home-upcoming-list__day'>{item.day}</Text>
              <Text className='home-upcoming-list__weekday'>{item.weekday}</Text>
            </View>

              <View className='home-upcoming-list__body'>
                <View className='home-upcoming-list__title-row'>
                  <Text className='home-upcoming-list__item-title'>{item.title}</Text>
                  <Text className='home-upcoming-list__item-label'>{item.label}</Text>
                </View>
                <Text className='home-upcoming-list__item-description'>{item.description}</Text>
                <Text className='home-upcoming-list__item-meta'>{item.meta}</Text>
              </View>

              <View className='home-upcoming-list__item-arrow' />
            </View>
        ))}
      </View>
    </View>
  );
}
