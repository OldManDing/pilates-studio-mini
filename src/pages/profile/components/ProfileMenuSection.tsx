import { Text, View } from '@tarojs/components';
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
                <View className={`profile-menu-section__glyph profile-menu-section__glyph--${item.icon}`} />
              </View>

              <View className='profile-menu-section__body'>
                <Text className='profile-menu-section__title'>{item.label}</Text>
                <Text className='profile-menu-section__description'>{item.description}</Text>
              </View>

              <Text className='profile-menu-section__arrow'>›</Text>
            </View>

            {index < data.items.length - 1 ? <View className='profile-menu-section__divider' /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
