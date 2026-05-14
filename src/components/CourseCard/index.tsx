import { View, Text, Image } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { Course } from '../../api/courses';
import { CourseTypes, CourseLevels } from '../../constants/enums';
import { getSafeMiniImageSrc } from '../../utils/ui';
import StatusTag from '../StatusTag';
import './index.scss';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
  showCoach?: boolean;
}

export default function CourseCard({ course, onClick, showCoach = true }: CourseCardProps) {
  const fallbackAvatarSrc = '/assets/ui/default-avatar.svg';
  const resolvedCoachAvatarSrc = getSafeMiniImageSrc(course.coach?.avatar || course.coach?.avatarUrl, fallbackAvatarSrc);
  const [coachAvatarSrc, setCoachAvatarSrc] = useState(resolvedCoachAvatarSrc);

  useEffect(() => {
    setCoachAvatarSrc(resolvedCoachAvatarSrc);
  }, [resolvedCoachAvatarSrc]);

  return (
    <View className='course-card' onClick={onClick}>
      <View className='course-card__header'>
        <View className='course-card__tags'>
          <StatusTag value={course.type} options={CourseTypes} size='small' />
          <StatusTag value={course.level} options={CourseLevels} size='small' outline />
        </View>
        <Text className='course-card__duration'>{course.durationMinutes} 分钟</Text>
      </View>
      <Text className='course-card__name'>{course.name}</Text>
      <Text className='course-card__desc'>{course.description || '暂无课程描述'}</Text>
      {showCoach && course.coach && (
        <View className='course-card__coach'>
          <Image className='course-card__coach-avatar' src={coachAvatarSrc} onError={() => setCoachAvatarSrc(fallbackAvatarSrc)} />
          <Text className='course-card__coach-name'>{course.coach.name}</Text>
        </View>
      )}
    </View>
  );
}
