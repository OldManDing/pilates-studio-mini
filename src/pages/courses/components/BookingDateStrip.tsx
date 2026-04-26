import { ScrollView, Text, View } from '@tarojs/components';
import type { BookingDateItemData } from './types';

interface BookingDateStripProps {
  items: BookingDateItemData[];
  onSelect?: (key: BookingDateItemData['key']) => void;
}

export default function BookingDateStrip({ items, onSelect }: BookingDateStripProps) {
  return (
    <View className='booking-date-strip'>
      <ScrollView scrollX showScrollbar={false}>
        <View className='booking-date-strip__row'>
          {items.map((item) => (
            <View
              key={item.key}
              className={`booking-date-strip__pill ${item.active ? 'booking-date-strip__pill--active' : ''} ${item.disabled ? 'booking-date-strip__pill--disabled' : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  onSelect?.(item.key);
                }
              }}
            >
              <Text className='booking-date-strip__weekday'>{item.weekday}</Text>
              <Text className='booking-date-strip__day'>{item.day}</Text>
              <Text className='booking-date-strip__label'>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
