import { Text, View } from '@tarojs/components';
import type { HomeStudioData } from './types';

interface HomeStudioCardProps {
  data: HomeStudioData;
  onClick?: () => void;
}

export default function HomeStudioCard({ data, onClick }: HomeStudioCardProps) {
  return (
    <View className='home-studio-card' onClick={onClick}>
      <View className='home-studio-card__top'>
        <View>
          <Text className='home-studio-card__label'>{data.label}</Text>
          <Text className='home-studio-card__name'>{data.name}</Text>
        </View>

        <View className='home-studio-card__pin'>
          <View className='home-studio-card__pin-ring'>
            <View className='home-studio-card__pin-core' />
          </View>
        </View>
      </View>

      <Text className='home-studio-card__address'>{data.address}</Text>
      <Text className='home-studio-card__hours'>{data.hours}</Text>

      <View className='home-studio-card__action'>
        <Text className='home-studio-card__action-text'>{data.actionLabel}</Text>
        <View className='home-studio-card__action-arrow' />
      </View>
    </View>
  );
}
