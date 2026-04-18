import { Text, View } from '@tarojs/components';
import type { HomeHeroData } from './types';

interface HomeHeroProps {
  data: HomeHeroData;
}

export default function HomeHero({ data }: HomeHeroProps) {
  return (
    <View className='home-hero'>
      <View className='home-hero__top'>
        <Text className='home-hero__date'>{data.dateLabel}</Text>

        <View className={`home-hero__badge ${data.badgeTone === 'muted' ? 'home-hero__badge--muted' : ''}`}>
          <View className='home-hero__badge-dot' />
          <Text className='home-hero__badge-text'>{data.badgeLabel}</Text>
        </View>
      </View>

      <Text className='home-hero__title'>{data.title}</Text>
      <Text className='home-hero__subtitle'>{data.subtitle}</Text>
    </View>
  );
}
