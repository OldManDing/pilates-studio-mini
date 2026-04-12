import { Text, View } from '@tarojs/components';
import type { HomeServiceItemData } from './types';

interface HomeServiceBandProps {
  items: HomeServiceItemData[];
  onItemClick?: (key: HomeServiceItemData['key']) => void;
}

export default function HomeServiceBand({ items, onItemClick }: HomeServiceBandProps) {
  return (
    <View className='home-service-band home-shell-card'>
      {items.map((item) => (
        <View key={item.key} className='home-service-band__item' onClick={() => onItemClick?.(item.key)}>
          <Text className='home-service-band__label'>{item.label}</Text>
          <Text className='home-service-band__subtitle'>{item.subtitle}</Text>
        </View>
      ))}
    </View>
  );
}
