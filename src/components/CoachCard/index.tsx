import { View, Text, Image } from '@tarojs/components';
import { Coach } from '../../api/coaches';
import './index.scss';

interface CoachCardProps {
  coach: Coach;
  onClick?: () => void;
  compact?: boolean;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function CoachCard({ coach, onClick, compact = false }: CoachCardProps) {
  const courseText = coach.courses?.map((course) => course.name).filter(Boolean).join('、');

  return (
    <View className={joinClasses(['coach-card', compact && 'coach-card--compact'])} onClick={onClick}>
      <Image className='coach-card__avatar' src={coach.avatar || '/assets/default-avatar.png'} />
      <View className='coach-card__info'>
        <View className='coach-card__title-row'>
          <Text className='coach-card__name'>{coach.name}</Text>
          <Text className='coach-card__state'>{coach.isActive ? '在岗' : '休息中'}</Text>
        </View>

        {coach.specialties && coach.specialties.length > 0 && (
          <View className='coach-card__tags'>
            {coach.specialties.slice(0, 3).map((specialty, index) => (
              <Text key={`${specialty}-${index}`} className='coach-card__tag'>{specialty}</Text>
            ))}
          </View>
        )}

        {courseText ? (
          <Text className='coach-card__courses'>授课：{courseText}</Text>
        ) : null}
      </View>
      <Text className='coach-card__arrow'>›</Text>
    </View>
  );
}
