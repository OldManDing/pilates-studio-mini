import { Button, Image, Text, View } from '@tarojs/components';
import { AppCard, Icon } from '../../../components';
import type { ProfileMenuItemData, ProfileMenuSectionData } from './types';

const iconMap: Record<ProfileMenuItemData['icon'], string> = {
  bookings: '/assets/ui/icon-bookings.svg',
  records: '/assets/ui/icon-records.svg',
  membership: '/assets/ui/icon-membership.svg',
  notifications: '/assets/ui/icon-notifications.svg',
  support: '/assets/ui/icon-support.svg',
  settings: '/assets/ui/icon-settings.svg',
};

interface ProfileMenuSectionProps {
  data: ProfileMenuSectionData;
  onItemClick?: (item: ProfileMenuItemData) => void;
}

export default function ProfileMenuSection({ data, onItemClick }: ProfileMenuSectionProps) {
  return (
    <View className='profile-menu-section'>
      <Text className='profile-menu-section__label'>{data.label}</Text>

      <AppCard className='profile-menu-section__card' padding='none'>
        {data.items.map((item, index) => (
          <View key={item.key}>
            <Button className={`profile-menu-section__item ${item.requiresLogin ? 'profile-menu-section__item--login-required' : ''}`} hoverClass='none' onClick={() => onItemClick?.(item)}>
              <View className='profile-menu-section__icon'>
                <Image className='profile-menu-section__icon-image' src={iconMap[item.icon]} mode='aspectFit' />
              </View>

              <View className='profile-menu-section__body'>
                <Text className='profile-menu-section__title'>{item.label}</Text>
                <Text className='profile-menu-section__description'>{item.description}</Text>
              </View>

              {item.requiresLogin ? (
                <Text className='profile-menu-section__login-hint'>登录后查看</Text>
              ) : (
                <Icon name='chevron-right' className='profile-menu-section__arrow' />
              )}
            </Button>

            {index < data.items.length - 1 ? <View className='profile-menu-section__divider' /> : null}
          </View>
        ))}
      </AppCard>
    </View>
  );
}
