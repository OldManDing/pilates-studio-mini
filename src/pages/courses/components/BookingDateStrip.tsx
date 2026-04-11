import { ScrollView, Text, View } from '@tarojs/components';
import type { BookingDateItemData } from './types';

interface BookingDateStripProps {
  items: BookingDateItemData[];
}

export default function BookingDateStrip({ items }: BookingDateStripProps) {
  return (
    <View className='booking-date-strip'>
      <ScrollView scrollX enhanced showScrollbar={false}>
        <View className='booking-date-strip__row'>
          {items.map((item) => (
            <View key={item.key} className={`booking-date-strip__pill ${item.active ? 'booking-date-strip__pill--active' : ''}`}>
              <Text className='booking-date-strip__weekday'>{item.weekday}</Text>
              <Text className='booking-date-strip__day'>{item.day}</Text>
              <Text className='booking-date-strip__label'>{item.label || ' '}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
