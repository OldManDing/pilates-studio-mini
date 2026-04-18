import { Text, View } from '@tarojs/components';
import { AppCard } from '../../../components';
import type { HomeServiceItemData } from './types';

interface HomeServiceBandProps {
  items: HomeServiceItemData[];
  onItemClick?: (key: HomeServiceItemData['key']) => void;
}

export default function HomeServiceBand({ items, onItemClick }: HomeServiceBandProps) {
  return (
    <AppCard className='home-service-band' padding='none'>
      {items.map((item, index) => (
        <View key={item.key} className='home-service-band__item-wrap'>
          <View className='home-service-band__item' onClick={() => onItemClick?.(item.key)}>
            <Text className='home-service-band__label'>{item.label}</Text>
            <Text className='home-service-band__subtitle'>{item.subtitle}</Text>
          </View>
          {index < items.length - 1 ? <View className='home-service-band__divider' /> : null}
        </View>
      ))}
    </AppCard>
  );
}
