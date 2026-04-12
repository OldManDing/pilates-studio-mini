import { Image, Text, View } from '@tarojs/components';
import type { HomeCuratedData } from './types';

interface HomeCuratedCardProps {
  data: HomeCuratedData;
  onClick?: () => void;
}

export default function HomeCuratedCard({ data, onClick }: HomeCuratedCardProps) {
  return (
    <View className='home-curated-card home-shell-card' onClick={onClick}>
      <View className='home-curated-card__visual'>
        <Image className='home-curated-card__visual-image' src='/assets/ui/home-curated.svg' mode='aspectFill' />
        <Text className='home-curated-card__caption'>{data.caption}</Text>
        <Text className='home-curated-card__monogram'>{data.monogram}</Text>
        <Text className='home-curated-card__meta'>{data.meta}</Text>
      </View>

      <View className='home-curated-card__body'>
        <Text className='home-curated-card__title'>{data.title}</Text>
        <Text className='home-curated-card__description'>{data.description}</Text>
        <Text className='home-curated-card__recommendation'>根据你的训练节奏推荐</Text>

        <View className='home-curated-card__action'>
          <Text className='home-curated-card__action-text'>预约</Text>
        </View>
      </View>
    </View>
  );
}
