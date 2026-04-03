import { useState, useEffect, useCallback } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { coachesApi, Coach } from '../../api/coaches';
import { courseSessionsApi, CourseSession } from '../../api/courses';
import { Loading, Empty } from '../../components';
import { getLabelByValue, CourseTypes, Weekdays } from '../../constants/enums';
import './index.scss';

export default function CoachDetail() {
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [schedule, setSchedule] = useState<CourseSession[]>([]);

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const [coachRes, scheduleRes] = await Promise.all([
        coachesApi.getById(id),
        coachesApi.getSchedule(id, { from: new Date().toISOString() }),
      ]);
      setCoach(coachRes.data.coach);
      setSchedule(scheduleRes.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch coach detail:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useLoad((options) => {
    if (options?.id) {
      fetchData(options.id);
    }
  });

  const formatSessionTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const month = startDate.getMonth() + 1;
    const day = startDate.getDate();
    const weekday = Weekdays.find(w => w.value === startDate.getDay())?.label || '';
    const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    return `${month}月${day}日 ${weekday} ${startTime}-${endTime}`;
  };

  if (loading) {
    return <Loading />;
  }

  if (!coach) {
    return <Empty title='教练不存在' />;
  }

  return (
    <View className='coach-detail'>
      <ScrollView className='coach-detail__content' scrollY enhanced showScrollbar={false}>
        {/* Header */}
        <View className='coach-detail__header'>
          <Image
            className='coach-detail__avatar'
            src={coach.avatar || '/assets/default-avatar.png'}
          />
          <Text className='coach-detail__name'>{coach.name}</Text>
          <View className='coach-detail__tags'>
            {coach.specialties?.map((specialty, index) => (
              <View key={index} className='coach-detail__tag'>
                <Text>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View className='coach-detail__card'>
          <Text className='coach-detail__card-title'>联系方式</Text>
          <View className='coach-detail__info-list'>
            <View className='coach-detail__info-item'>
              <Text className='coach-detail__info-label'>电话</Text>
              <Text className='coach-detail__info-value'>{coach.phone}</Text>
            </View>
            <View className='coach-detail__info-item'>
              <Text className='coach-detail__info-label'>邮箱</Text>
              <Text className='coach-detail__info-value'>{coach.email}</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        {coach.bio && (
          <View className='coach-detail__card'>
            <Text className='coach-detail__card-title'>个人简介</Text>
            <Text className='coach-detail__bio'>{coach.bio}</Text>
          </View>
        )}

        {/* Certifications */}
        {coach.certifications && coach.certifications.length > 0 && (
          <View className='coach-detail__card'>
            <Text className='coach-detail__card-title'>专业认证</Text>
            <View className='coach-detail__certifications'>
              {coach.certifications.map((cert, index) => (
                <View key={index} className='coach-detail__cert-item'>
                  <Text className='coach-detail__cert-icon'>🏆</Text>
                  <Text className='coach-detail__cert-text'>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Courses */}
        {coach.courses && coach.courses.length > 0 && (
          <View className='coach-detail__card'>
            <Text className='coach-detail__card-title'>授课课程</Text>
            <View className='coach-detail__courses'>
              {coach.courses.map((course) => (
                <View key={course.id} className='coach-detail__course-item'>
                  <Text className='coach-detail__course-name'>{course.name}</Text>
                  <Text className='coach-detail__course-type'>
                    {getLabelByValue(CourseTypes, course.type)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Schedule */}
        <View className='coach-detail__card'>
          <Text className='coach-detail__card-title'>近期排课</Text>
          {schedule.length > 0 ? (
            <View className='coach-detail__schedule'>
              {schedule.map((session) => (
                <View key={session.id} className='coach-detail__schedule-item'>
                  <View className='coach-detail__schedule-info'>
                    <Text className='coach-detail__schedule-time'>
                      {formatSessionTime(session.startsAt, session.endsAt)}
                    </Text>
                    <Text className='coach-detail__schedule-course'>
                      {session.course?.name || '未知课程'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Empty title='暂无排课' description='敬请期待' />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
