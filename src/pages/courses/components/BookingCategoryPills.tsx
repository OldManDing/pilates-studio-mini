import { Text, View } from '@tarojs/components';
import type { BookingCategoryItemData } from './types';

interface BookingCategoryPillsProps {
  items: BookingCategoryItemData[];
}

export default function BookingCategoryPills({ items }: BookingCategoryPillsProps) {
  return (
    <View className='booking-category-pills'>
      {items.map((item) => (
        <View key={item.key} className={`booking-category-pills__pill ${item.active ? 'booking-category-pills__pill--active' : ''}`}>
          <Text className='booking-category-pills__text'>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
