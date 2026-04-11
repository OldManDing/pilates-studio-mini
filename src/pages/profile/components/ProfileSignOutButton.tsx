import { Text, View } from '@tarojs/components';
import type { ProfileSignOutData } from './types';

interface ProfileSignOutButtonProps {
  data: ProfileSignOutData;
  onClick?: () => void;
}

export default function ProfileSignOutButton({ data, onClick }: ProfileSignOutButtonProps) {
  return (
    <View className='profile-signout-button' onClick={onClick}>
      <View className='profile-signout-button__icon'>
        <View className='profile-signout-button__icon-glyph' />
      </View>
      <Text className='profile-signout-button__text'>{data.label}</Text>
    </View>
  );
}
