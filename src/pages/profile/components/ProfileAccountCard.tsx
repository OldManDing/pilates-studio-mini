import { Image, Text, View } from '@tarojs/components';
import { AppCard } from '../../../components';
import type { ProfileAccountCardData } from './types';

interface ProfileAccountCardProps {
  data: ProfileAccountCardData;
}

export default function ProfileAccountCard({ data }: ProfileAccountCardProps) {
  return (
    <AppCard className='profile-account-card' padding='medium'>
      <View className='profile-account-card__top'>
        <View className='profile-account-card__avatar-wrap'>
          {data.avatarUrl ? (
            <Image className='profile-account-card__avatar-image' src={data.avatarUrl} mode='aspectFill' />
          ) : (
            <View className='profile-account-card__avatar-fallback'>
              <Text className='profile-account-card__avatar-text'>{data.avatarText}</Text>
            </View>
          )}
        </View>

        <View className='profile-account-card__identity'>
          <View className='profile-account-card__identity-row'>
            <Text className='profile-account-card__name'>{data.name}</Text>

            <View className='profile-account-card__badge'>
              <View className='profile-account-card__badge-dot' />
              <Text className='profile-account-card__badge-text'>{data.badgeLabel}</Text>
            </View>
          </View>

          <Text className='profile-account-card__phone'>{data.phone}</Text>
        </View>
      </View>

      <View className='profile-account-card__stats'>
        {data.stats.map((item, index) => (
          <View key={item.key} className='profile-account-card__stat'>
            <View className='profile-account-card__stat-value-row'>
              <Text className='profile-account-card__stat-value'>{item.value}</Text>
              <Text className='profile-account-card__stat-unit'>{item.unit}</Text>
            </View>

            <Text className='profile-account-card__stat-label'>{item.label}</Text>

            {index < data.stats.length - 1 ? <View className='profile-account-card__stat-divider' /> : null}
          </View>
        ))}
      </View>
    </AppCard>
  );
}
