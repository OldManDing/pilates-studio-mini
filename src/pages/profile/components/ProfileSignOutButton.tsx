import { AppButton, Icon } from '../../../components';
import type { ProfileSignOutData } from './types';

interface ProfileSignOutButtonProps {
  data: ProfileSignOutData;
  onClick?: () => void;
}

export default function ProfileSignOutButton({ data, onClick }: ProfileSignOutButtonProps) {
  return (
    <AppButton className='profile-signout-button' variant='ghost' size='small' onClick={onClick}>
      <Icon name='logout' className='profile-signout-button__icon' />
      {data.label}
    </AppButton>
  );
}
