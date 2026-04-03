import { useEffect, useState, useCallback } from 'react';
import Taro, { useLoad, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { coursesApi, Course } from '../../api/courses';
import { coachesApi, Coach } from '../../api/coaches';
import { membersApi, Membership } from '../../api/members';
import { Loading, Empty, CourseCard, CoachCard } from '../../components';
import './index.scss';

interface HomeStats {
  upcomingBookings: number;
  remainingCredits: number;
  activeMemberships: number;
}

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [stats, setStats] = useState<HomeStats>({ upcomingBookings: 0, remainingCredits: 0, activeMemberships: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesRes, coachesRes, membershipsRes] = await Promise.all([
        coursesApi.getAll({ limit: 4, isActive: true }),
        coachesApi.getAll({ limit: 3, isActive: true }),
        membersApi.getMyMemberships().catch(() => ({ data: { memberships: [] } })),
      ]);

      setCourses(coursesRes.data.courses || []);
      setCoaches(coachesRes.data.coaches || []);
      const membershipList = membershipsRes.data.memberships || [];
      setMemberships(membershipList);

      // Calculate stats
      const totalCredits = membershipList.reduce((sum, m) => sum + m.remainingCredits, 0);
      setStats({
        upcomingBookings: 0,
        remainingCredits: totalCredits,
        activeMemberships: membershipList.filter(m => m.isActive).length,
      });
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useLoad(() => {
    fetchData();
  });

  usePullDownRefresh(() => {
    fetchData();
  });

  useShareAppMessage(() => {
    return {
      title: 'Pilates Studio - 专业普拉提工作室',
      path: '/pages/index/index',
    };
  });

  const handleCourseClick = (course: Course) => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${course.id}` });
  };

  const handleCoachClick = (coach: Coach) => {
    Taro.navigateTo({ url: `/pages/coach-detail/index?id=${coach.id}` });
  };

  const handleQuickAction = (type: string) => {
    switch (type) {
      case 'booking':
        Taro.switchTab({ url: '/pages/courses/index' });
        break;
      case 'coaches':
        Taro.switchTab({ url: '/pages/coaches/index' });
        break;
      case 'membership':
        Taro.navigateTo({ url: '/pages/membership/index' });
        break;
      case 'bookings':
        Taro.navigateTo({ url: '/pages/my-bookings/index' });
        break;
    }
  };

  if (loading) {
    return <Loading />;
  }

  const activeMembership = memberships.find(m => m.isActive);

  return (
    <ScrollView className='home' scrollY enhanced showScrollbar={false}>
      {/* Banner */}
      <View className='home__banner'>
        <Text className='home__welcome'>欢迎来到 Pilates Studio</Text>
        <Text className='home__subtitle'>专业普拉提 · 塑造更好的自己</Text>
      </View>

      <View className='home__content'>
        {/* Quick Actions */}
        <View className='home__quick-actions'>
          <View className='home__quick-action' onClick={() => handleQuickAction('booking')}>
            <View className='home__quick-action-icon home__quick-action-icon--mint'>📅</View>
            <Text className='home__quick-action-text'>预约课程</Text>
          </View>
          <View className='home__quick-action' onClick={() => handleQuickAction('coaches')}>
            <View className='home__quick-action-icon home__quick-action-icon--violet'>👤</View>
            <Text className='home__quick-action-text'>教练团队</Text>
          </View>
          <View className='home__quick-action' onClick={() => handleQuickAction('membership')}>
            <View className='home__quick-action-icon home__quick-action-icon--orange'>💳</View>
            <Text className='home__quick-action-text'>会员卡</Text>
          </View>
          <View className='home__quick-action' onClick={() => handleQuickAction('bookings')}>
            <View className='home__quick-action-icon home__quick-action-icon--pink'>📋</View>
            <Text className='home__quick-action-text'>我的预约</Text>
          </View>
        </View>

        {/* Membership Card */}
        {activeMembership ? (
          <View className='home__section'>
            <View className='home__membership-card'>
              <View className='home__membership-card-header'>
                <Text className='home__membership-card-title'>当前会员卡</Text>
                <Text className='home__membership-card-status'>生效中</Text>
              </View>
              <View className='home__membership-card-content'>
                <View className='home__membership-card-stat'>
                  <Text className='home__membership-card-stat-value'>{activeMembership.remainingCredits}</Text>
                  <Text className='home__membership-card-stat-label'>剩余次数</Text>
                </View>
                <View className='home__membership-card-stat'>
                  <Text className='home__membership-card-stat-value'>
                    {Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                  </Text>
                  <Text className='home__membership-card-stat-label'>剩余天数</Text>
                </View>
              </View>
              <Text className='home__membership-card-valid'>
                有效期至：{new Date(activeMembership.endDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ) : (
          <View className='home__section'>
            <View className='home__section-header'>
              <Text className='home__section-title'>会员统计</Text>
            </View>
            <View className='home__stats'>
              <View className='home__stat'>
                <Text className='home__stat-value'>{stats.upcomingBookings}</Text>
                <Text className='home__stat-label'>待上课</Text>
              </View>
              <View className='home__stat'>
                <Text className='home__stat-value'>{stats.remainingCredits}</Text>
                <Text className='home__stat-label'>剩余次数</Text>
              </View>
              <View className='home__stat'>
                <Text className='home__stat-value'>{stats.activeMemberships}</Text>
                <Text className='home__stat-label'>有效卡</Text>
              </View>
            </View>
          </View>
        )}

        {/* Featured Courses */}
        <View className='home__section'>
          <View className='home__section-header'>
            <Text className='home__section-title'>精选课程</Text>
            <View className='home__section-more' onClick={() => Taro.switchTab({ url: '/pages/courses/index' })}>
              <Text>查看更多</Text>
              <Text>›</Text>
            </View>
          </View>
          {courses.length > 0 ? (
            <View className='home__course-grid'>
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onClick={() => handleCourseClick(course)} />
              ))}
            </View>
          ) : (
            <Empty title='暂无课程' description='敬请期待新课程' />
          )}
        </View>

        {/* Featured Coaches */}
        <View className='home__section'>
          <View className='home__section-header'>
            <Text className='home__section-title'>明星教练</Text>
            <View className='home__section-more' onClick={() => Taro.switchTab({ url: '/pages/coaches/index' })}>
              <Text>查看更多</Text>
              <Text>›</Text>
            </View>
          </View>
          {coaches.length > 0 ? (
            <View className='home__coach-list'>
              {coaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} onClick={() => handleCoachClick(coach)} />
              ))}
            </View>
          ) : (
            <Empty title='暂无教练' description='敬请期待' />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
