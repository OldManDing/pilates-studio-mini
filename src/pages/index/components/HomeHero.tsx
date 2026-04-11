import { Text, View } from '@tarojs/components';
import type { HomeHeroData } from './types';

interface HomeHeroProps {
  data: HomeHeroData;
  onProfileClick?: () => void;
}

export default function HomeHero({ data, onProfileClick }: HomeHeroProps) {
  return (
    <View className='home-hero home-shell-card home-shell-card--hero'>
      <View className='home-hero__top'>
        <View className='home-hero__meta'>
          <Text className='home-hero__eyebrow'>{data.eyebrow}</Text>
          <Text className='home-hero__date'>{data.dateLabel}</Text>
        </View>

        <View className='home-hero__badge'>
          <View className='home-hero__badge-dot' />
          <Text className='home-hero__badge-text'>{data.badgeLabel}</Text>
        </View>
      </View>

      <Text className='home-hero__title'>{data.title}</Text>
      <Text className='home-hero__subtitle'>{data.subtitle}</Text>

      <View className='home-hero__footer'>
        <Text className='home-hero__footer-copy'>新的首页壳层以业务区块分栏，等待后续数据映射。</Text>
        <View className='home-hero__link' onClick={onProfileClick}>
          <Text className='home-hero__link-text'>{data.profileCta}</Text>
          <Text className='home-hero__link-arrow'>›</Text>
        </View>
      </View>
    </View>
  );
}
