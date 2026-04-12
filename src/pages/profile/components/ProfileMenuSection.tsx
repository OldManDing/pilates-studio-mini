import { Image, Text, View } from '@tarojs/components';

const iconMap: Record<ProfileMenuItemData['icon'], string> = {
  bookings: '/assets/ui/icon-bookings.svg',
  records: '/assets/ui/icon-records.svg',
  membership: '/assets/ui/icon-membership.svg',
  notifications: '/assets/ui/icon-notifications.svg',
  support: '/assets/ui/icon-support.svg',
  settings: '/assets/ui/icon-settings.svg',
};
import type { ProfileMenuItemData, ProfileMenuSectionData } from './types';

interface ProfileMenuSectionProps {
  data: ProfileMenuSectionData;
  onItemClick?: (item: ProfileMenuItemData) => void;
}

export default function ProfileMenuSection({ data, onItemClick }: ProfileMenuSectionProps) {
  return (
    <View className='profile-menu-section'>
      <Text className='profile-menu-section__label'>{data.label}</Text>

      <View className='profile-shell-card profile-menu-section__card'>
        {data.items.map((item, index) => (
          <View key={item.key}>
            <View className='profile-menu-section__item' onClick={() => onItemClick?.(item)}>
              <View className={`profile-menu-section__icon profile-menu-section__icon--${item.icon}`}>
                <Image className='profile-menu-section__icon-image' src={iconMap[item.icon]} mode='aspectFit' />
              </View>

              <View className='profile-menu-section__body'>
                <Text className='profile-menu-section__title'>{item.label}</Text>
                <Text className='profile-menu-section__description'>{item.description}</Text>
              </View>

                <View className='profile-menu-section__arrow' />
              </View>

            {index < data.items.length - 1 ? <View className='profile-menu-section__divider' /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
