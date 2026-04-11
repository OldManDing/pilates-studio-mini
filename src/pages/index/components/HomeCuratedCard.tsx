import { Text, View } from '@tarojs/components';
import type { HomeCuratedData } from './types';

interface HomeCuratedCardProps {
  data: HomeCuratedData;
  onClick?: () => void;
}

export default function HomeCuratedCard({ data, onClick }: HomeCuratedCardProps) {
  return (
    <View className='home-curated-card home-shell-card' onClick={onClick}>
      <View className='home-curated-card__visual'>
        <Text className='home-curated-card__caption'>{data.caption}</Text>
        <Text className='home-curated-card__monogram'>{data.monogram}</Text>
        <Text className='home-curated-card__meta'>{data.meta}</Text>
      </View>

      <View className='home-curated-card__body'>
        <Text className='home-curated-card__eyebrow'>{data.eyebrow}</Text>
        <Text className='home-curated-card__title'>{data.title}</Text>
        <Text className='home-curated-card__description'>{data.description}</Text>

        <View className='home-curated-card__action'>
          <Text className='home-curated-card__action-text'>{data.cta}</Text>
          <Text className='home-curated-card__action-arrow'>›</Text>
        </View>
      </View>
    </View>
  );
}
