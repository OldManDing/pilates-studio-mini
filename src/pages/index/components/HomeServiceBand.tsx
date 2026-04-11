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
          <View className={`home-service-band__icon home-service-band__icon--${item.accent}`}>
            <Text className='home-service-band__icon-text'>{item.subtitle}</Text>
          </View>
          <Text className='home-service-band__label'>{item.label}</Text>
          <Text className='home-service-band__description'>{item.description}</Text>
        </View>
      ))}
    </View>
  );
}
