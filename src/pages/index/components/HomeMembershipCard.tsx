import { Button, Text, View } from '@tarojs/components';
import { AppButton, AppCard, Icon } from '../../../components';
import type { HomeMembershipData } from './types';

interface HomeMembershipCardProps {
  data: HomeMembershipData;
  onPrimaryClick?: () => void;
  onDetailClick?: () => void;
}

export default function HomeMembershipCard({ data, onPrimaryClick, onDetailClick }: HomeMembershipCardProps) {
  const progressWidth = `${Math.max(0, Math.min(100, data.progressPercent))}%`;

  return (
    <AppCard className='home-membership-card' padding='none'>
      <View className='home-membership-card__header'>
        <View className='home-membership-card__heading'>
          <Text className='home-membership-card__label'>{data.label}</Text>
          <Text className='home-membership-card__title'>{data.planName}</Text>
          {data.description ? <Text className='home-membership-card__description'>{data.description}</Text> : null}
        </View>
        <Button className='home-membership-card__status' hoverClass='none' onClick={onDetailClick}>
          <Text className='home-membership-card__status-text'>{data.status}</Text>
          <Icon name='chevron-right' className='home-membership-card__status-icon' />
        </Button>
      </View>

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

      <View className='home-membership-card__progress-row'>
        {data.progressLabel ? <Text className='home-membership-card__progress-label'>{data.progressLabel}</Text> : null}
        <View className='home-membership-card__progress-meta'>
          <View className='home-membership-card__progress-bar'>
            <View className='home-membership-card__progress-fill' style={{ width: progressWidth }} />
          </View>
          <Text className='home-membership-card__progress-value'>{data.progressValue}</Text>
        </View>
      </View>

      {data.secondaryAction ? (
        <View className='home-membership-card__secondary-action'>
          <Button className='home-membership-card__secondary-button' hoverClass='none' onClick={onDetailClick}>
            <Text className='home-membership-card__secondary-text'>{data.secondaryAction}</Text>
            <Icon name='chevron-right' className='home-membership-card__secondary-icon' />
          </Button>
        </View>
      ) : null}

      <View className='home-membership-card__divider' />

      <View className='home-membership-card__actions'>
        <AppButton className='home-membership-card__button' variant='primary' size='large' onClick={onPrimaryClick}>
          {data.primaryAction}
        </AppButton>
      </View>
    </AppCard>
  );
}
