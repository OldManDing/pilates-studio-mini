import { Text, View } from '@tarojs/components';
import type { HomeMembershipData } from './types';

interface HomeMembershipCardProps {
  data: HomeMembershipData;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function HomeMembershipCard({ data, onPrimaryClick, onSecondaryClick }: HomeMembershipCardProps) {
  return (
    <View className='home-membership-card home-shell-card'>
      <View className='home-membership-card__top'>
        <Text className='home-membership-card__label'>{data.label}</Text>
        <View className='home-membership-card__detail-link' onClick={onSecondaryClick}>
          <Text className='home-membership-card__detail-text'>详情</Text>
          <View className='home-membership-card__detail-arrow' />
        </View>
      </View>

      <Text className='home-membership-card__title'>{data.planName}</Text>

      <View className='home-membership-card__metrics'>
        <View className='home-membership-card__metric'>
          <Text className='home-membership-card__metric-label'>{data.primaryMetricLabel}</Text>
          <Text className='home-membership-card__metric-value'>{data.primaryMetricValue}</Text>
        </View>

        <View className='home-membership-card__metric home-membership-card__metric--right'>
          <Text className='home-membership-card__metric-label'>{data.secondaryMetricLabel}</Text>
          <Text className='home-membership-card__metric-value'>{data.secondaryMetricValue}</Text>
        </View>
      </View>

      <View className='home-membership-card__progress'>
        <Text className='home-membership-card__progress-label'>{data.progressLabel}</Text>
        <Text className='home-membership-card__progress-value'>{data.progressValue}</Text>
      </View>

      <View className='home-membership-card__progress-bar'>
        <View className='home-membership-card__progress-fill' />
      </View>

      <View className='home-membership-card__actions'>
        <View className='home-shell-button home-shell-button--primary' onClick={onPrimaryClick}>
          <Text className='home-shell-button__text home-shell-button__text--primary'>立即预约课程</Text>
        </View>
      </View>
    </View>
  );
}
