import { View, Text, Image } from '@tarojs/components';
import { Coach } from '../../api/coaches';
import './index.scss';

interface CoachCardProps {
  coach: Coach;
  onClick?: () => void;
}

export default function CoachCard({ coach, onClick }: CoachCardProps) {
  return (
    <View className='coach-card' onClick={onClick}>
      <Image className='coach-card__avatar' src={coach.avatar || '/assets/default-avatar.png'} />
      <View className='coach-card__info'>
        <Text className='coach-card__name'>{coach.name}</Text>
        {coach.specialties && coach.specialties.length > 0 && (
          <View className='coach-card__tags'>
            {coach.specialties.slice(0, 3).map((specialty, index) => (
              <Text key={index} className='coach-card__tag'>{specialty}</Text>
            ))}
          </View>
        )}
        {coach.courses && coach.courses.length > 0 && (
          <Text className='coach-card__courses'>
            授课：{coach.courses.map(c => c.name).join('、')}
          </Text>
        )}
      </View>
      <View className='coach-card__arrow' />
    </View>
  );
}
