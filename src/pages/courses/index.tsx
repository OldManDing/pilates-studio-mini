import { useEffect, useMemo, useState, useCallback } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { coursesApi, Course } from '../../api/courses';
import { Loading, Empty } from '../../components';
import { CourseTypes } from '../../constants/enums';
import './index.scss';

const TYPE_ALL = 'ALL';

function formatClock(dateString?: string) {
  if (!dateString) return '--:--';
  const date = new Date(dateString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function isSameDay(dateString: string, targetDate: Date) {
  const date = new Date(dateString);
  return (
    date.getFullYear() === targetDate.getFullYear()
    && date.getMonth() === targetDate.getMonth()
    && date.getDate() === targetDate.getDate()
  );
}

function getDurationText(course: Course) {
  return `${course.durationMinutes}min`;
}

export default function Courses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeType, setActiveType] = useState(TYPE_ALL);

  const dateItems = useMemo(() => Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    const weekday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];

    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      day: String(date.getDate()).padStart(2, '0'),
      weekday,
      label: index === 0 ? '今天' : index === 1 ? '明天' : '',
    };
  }), []);

  const [activeDateKey, setActiveDateKey] = useState('');

  useEffect(() => {
    if (!activeDateKey && dateItems[0]) {
      setActiveDateKey(dateItems[0].key);
    }
  }, [activeDateKey, dateItems]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coursesApi.getAll({ page: 1, limit: 20, isActive: true });
      setCourses(res.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  usePullDownRefresh(() => {
    fetchCourses();
  });

  const activeDate = dateItems.find((item) => item.key === activeDateKey)?.date || dateItems[0]?.date || new Date();

  const courseItems = useMemo(() => {
    const hasDaySpecificSessions = courses.some((course) => (course.sessions || []).some((session) => isSameDay(session.startsAt, activeDate)));

    return courses
      .map((course) => {
        const sessionForDay = (course.sessions || []).find((session) => isSameDay(session.startsAt, activeDate));
        return {
          course,
          sessionForDay,
        };
      })
      .filter(({ course, sessionForDay }) => {
        const typeMatch = activeType === TYPE_ALL || course.type === activeType;

        if (!typeMatch) {
          return false;
        }

        if (hasDaySpecificSessions) {
          return Boolean(sessionForDay);
        }

        return true;
      });
  }, [courses, activeType, activeDate, activeDateKey]);

  const courseCountText = `${courseItems.length} 节`;

  const handleCourseClick = (course: Course) => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${course.id}` });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView className='booking-page' scrollY enhanced showScrollbar={false}>
      <View className='booking-page__hero'>
        <View className='booking-page__hero-top'>
          <Text className='booking-page__hero-label'>COURSE BOOKING</Text>
          <Text className='booking-page__hero-link' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })}>我的预约</Text>
        </View>
        <Text className='booking-page__title'>预约课程</Text>
        <Text className='booking-page__subtitle'>选择日期与课程类型</Text>
      </View>

      <View className='booking-page__content'>
        <View className='booking-page__date-strip'>
          <ScrollView scrollX enhanced showScrollbar={false}>
            <View className='booking-page__date-row'>
              {dateItems.map((item) => {
                const isActive = item.key === activeDateKey;
                return (
                  <View
                    key={item.key}
                    className={`booking-page__date-pill ${isActive ? 'booking-page__date-pill--active' : ''}`}
                    onClick={() => setActiveDateKey(item.key)}
                  >
                    <Text className='booking-page__date-weekday'>{item.weekday}</Text>
                    <Text className='booking-page__date-day'>{item.day}</Text>
                    <Text className='booking-page__date-label'>{item.label || ' '}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className='booking-page__category-row'>
          <View
            className={`booking-page__category-pill ${activeType === TYPE_ALL ? 'booking-page__category-pill--active' : ''}`}
            onClick={() => setActiveType(TYPE_ALL)}
          >
            <Text className='booking-page__category-text'>全部</Text>
          </View>
          {CourseTypes.map((item) => (
            <View
              key={item.value}
              className={`booking-page__category-pill ${activeType === item.value ? 'booking-page__category-pill--active' : ''}`}
              onClick={() => setActiveType(item.value)}
            >
              <Text className='booking-page__category-text'>{item.label}</Text>
            </View>
          ))}
        </View>

        <View className='booking-page__section-head'>
          <Text className='booking-page__section-title'>可预约课程</Text>
          <Text className='booking-page__section-count'>{courseCountText}</Text>
        </View>

        {courseItems.length === 0 ? (
          <View className='booking-page__empty-wrap'>
            <Empty title='暂无课程' description='当前时间段暂无可预约课程，请选择其他日期' />
          </View>
        ) : (
          <View className='booking-page__list'>
            {courseItems.map(({ course, sessionForDay }) => {
              const session = sessionForDay;
              const remainingSeats = session && typeof session.capacity === 'number' && typeof session.bookedCount === 'number'
                ? Math.max(0, session.capacity - session.bookedCount)
                : undefined;
              const isFull = typeof remainingSeats === 'number' ? remainingSeats <= 0 : false;
              const thumbSrc = course.coach?.avatar || '/assets/default-avatar.png';

              return (
                <View key={course.id} className='booking-page__card' onClick={() => handleCourseClick(course)}>
                  <View className='booking-page__card-thumb'>
                    <Image className='booking-page__card-thumb-image' src={thumbSrc} mode='aspectFill' />
                    <View className='booking-page__card-thumb-overlay' />
                    <Text className='booking-page__card-thumb-text'>{course.type || 'CLASS'}</Text>
                    {isFull ? <Text className='booking-page__card-thumb-badge'>已满</Text> : null}
                  </View>

                    <View className='booking-page__card-body'>
                      <View className='booking-page__card-head'>
                        <Text className='booking-page__card-title'>{course.name}</Text>
                      </View>

                      <Text className='booking-page__card-time'>
                        {session ? `${formatClock(session.startsAt)} · ${getDurationText(course)}` : getDurationText(course)}
                      </Text>

                      <Text className='booking-page__card-meta'>
                        {(course.coach?.name || '待安排教练')} · 朝阳门店
                      </Text>

                      <View className='booking-page__card-footer'>
                        <Text className={`booking-page__card-spots ${isFull ? 'booking-page__card-spots--muted' : ''}`}>
                          {typeof remainingSeats === 'number' ? (isFull ? '已约满' : `余 ${remainingSeats} 位`) : '可预约'}
                        </Text>
                      </View>
                    </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
