import { useState, useEffect, useCallback } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { coursesApi, courseSessionsApi, Course, CourseSession } from '../../api/courses';
import { bookingsApi } from '../../api/bookings';
import { Loading, Empty, StatusTag } from '../../components';
import { CourseTypes, CourseLevels, Weekdays } from '../../constants/enums';
import './index.scss';

export default function CourseDetail() {
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const [courseRes, sessionsRes] = await Promise.all([
        coursesApi.getById(id),
        coursesApi.getSessions(id, { upcoming: true }),
      ]);
      setCourse(courseRes.data.course);
      setSessions(sessionsRes.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch course detail:', error);
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

  const handleBooking = async (sessionId: string) => {
    try {
      setBookingLoading(true);
      // Note: In real implementation, you'd get memberId from auth context
      // This is a placeholder - the backend should derive memberId from JWT token
      await bookingsApi.create({ memberId: '', sessionId });
      Taro.showToast({ title: '预约成功', icon: 'success' });
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setBookingLoading(false);
    }
  };

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

  if (!course) {
    return <Empty title='课程不存在' />;
  }

  return (
    <View className='course-detail'>
      <ScrollView className='course-detail__content' scrollY enhanced showScrollbar={false}>
        {/* Header */}
        <View className='course-detail__header'>
          <View className='course-detail__tags'>
            <StatusTag value={course.type} options={CourseTypes} size='small' />
            <StatusTag value={course.level} options={CourseLevels} size='small' outline />
          </View>
          <Text className='course-detail__name'>{course.name}</Text>
          <View className='course-detail__meta'>
            <Text className='course-detail__meta-item'>⏱ {course.durationMinutes} 分钟</Text>
            <Text className='course-detail__meta-item'>👥 最多 {course.maxCapacity} 人</Text>
          </View>
        </View>

        {/* Coach Info */}
        {course.coach && (
          <View className='course-detail__card'>
            <Text className='course-detail__card-title'>授课教练</Text>
            <View className='course-detail__coach'>
              <Image
                className='course-detail__coach-avatar'
                src={course.coach.avatar || '/assets/default-avatar.png'}
              />
              <View className='course-detail__coach-info'>
                <Text className='course-detail__coach-name'>{course.coach.name}</Text>
                {course.coach.bio && (
                  <Text className='course-detail__coach-bio' numberOfLines={2}>
                    {course.coach.bio}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        <View className='course-detail__card'>
          <Text className='course-detail__card-title'>课程介绍</Text>
          <Text className='course-detail__description'>
            {course.description || '暂无课程介绍'}
          </Text>
        </View>

        {/* Sessions */}
        <View className='course-detail__card'>
          <Text className='course-detail__card-title'>近期课程安排</Text>
          {sessions.length > 0 ? (
            <View className='course-detail__sessions'>
              {sessions.map((session) => (
                <View key={session.id} className='course-detail__session'>
                  <View className='course-detail__session-info'>
                    <Text className='course-detail__session-time'>
                      {formatSessionTime(session.startsAt, session.endsAt)}
                    </Text>
                    <Text className='course-detail__session-capacity'>
                      剩余 {session.capacity - (session.bookedCount || 0)} 个名额
                    </Text>
                  </View>
                  <View
                    className={`course-detail__session-btn ${bookingLoading ? 'course-detail__session-btn--disabled' : ''}`}
                    onClick={() => handleBooking(session.id)}
                  >
                    <Text>预约</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Empty title='暂无课程安排' description='敬请期待' />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
