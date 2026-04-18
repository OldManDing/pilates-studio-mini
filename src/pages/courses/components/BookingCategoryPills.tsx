import { Text, View } from '@tarojs/components';
import type { BookingCategoryItemData } from './types';

interface BookingCategoryPillsProps {
  items: BookingCategoryItemData[];
  onSelect?: (key: BookingCategoryItemData['key']) => void;
}

export default function BookingCategoryPills({ items, onSelect }: BookingCategoryPillsProps) {
  return (
    <View className='booking-category-pills'>
      {items.map((item) => (
        <View
          key={item.key}
          className={`booking-category-pills__pill ${item.active ? 'booking-category-pills__pill--active' : ''} ${item.disabled ? 'booking-category-pills__pill--disabled' : ''}`}
          onClick={() => {
            if (!item.disabled) {
              onSelect?.(item.key);
            }
          }}
        >
          <Text className='booking-category-pills__text'>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
