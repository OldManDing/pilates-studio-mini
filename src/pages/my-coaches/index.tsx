import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { bookingsApi, type Booking } from '../../api/bookings';
import { coachesApi, type Coach } from '../../api/coaches';
import { AppButton, AppCard, Divider, Empty, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

interface CoachSummary {
  coach: Coach;
  completedCount: number;
  lastCourseName: string;
}

function getBookingTimeValue(booking: Booking) {
  const value = booking.session?.startsAt || booking.bookingTime || booking.bookedAt;
  const time = value ? new Date(value).getTime() : NaN;

  return Number.isNaN(time) ? 0 : time;
}

function buildCoachSummaries(coaches: Coach[], bookings: Booking[]): CoachSummary[] {
  return coaches.map((coach) => {
    const related = bookings
      .filter((booking) => booking.session?.coach?.id === coach.id || booking.session?.coach?.name === coach.name)
      .sort((left, right) => getBookingTimeValue(right) - getBookingTimeValue(left));
    const lastCourseName = related[0]?.session?.course?.name || coach.courses?.[0]?.name || '暂无最近课程';

    return {
      coach,
      completedCount: related.filter((booking) => booking.status === 'COMPLETED').length,
      lastCourseName,
    };
  });
}

export default function MyCoaches() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const pageSize = 50;
      const allCoaches: Coach[] = [];
      let coachPage = 1;
      let coachTotalPages = 1;

      do {
        const response = await coachesApi.getAll({ page: coachPage, limit: pageSize, isActive: true });
        allCoaches.push(...(response.data.coaches || []));
        coachTotalPages = response.data.meta?.totalPages || (response.data.coaches?.length === pageSize ? coachPage + 1 : coachPage);
        coachPage += 1;
      } while (coachPage <= coachTotalPages);

      const allBookings: Booking[] = [];
      let bookingPage = 1;
      let bookingTotalPages = 1;

      do {
        const response = await bookingsApi.getMyBookings({ page: bookingPage, limit: pageSize }, { showLoading: false });
        allBookings.push(...(response.data.bookings || []));
        bookingTotalPages = response.data.meta?.totalPages || (response.data.bookings?.length === pageSize ? bookingPage + 1 : bookingPage);
        bookingPage += 1;
      } while (bookingPage <= bookingTotalPages);

      setCoaches(allCoaches);
      setBookings(allBookings);
    } catch {
      setCoaches([]);
      setLoadFailed(true);
      Taro.showToast({ title: '教练信息加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePullDownRefresh(() => {
    fetchData();
  });

  const summaries = useMemo(() => buildCoachSummaries(coaches, bookings), [bookings, coaches]);

  if (loading) {
    return <Loading />;
  }

  return (
    <PageShell className='my-coaches-page' safeAreaBottom>
      <PageHeader title='我的教练' subtitle='常用教练与近期课程' fallbackUrl='/pages/profile/index' />

      <View className='my-coaches-page__hero'>
        <Text className='my-coaches-page__hero-label'>COACH TEAM</Text>
        <Text className='my-coaches-page__hero-value'>{loadFailed ? '--' : summaries.length}</Text>
        <Text className='my-coaches-page__hero-desc'>{loadFailed ? '教练信息暂时无法同步，请稍后重试。' : '位可预约教练，结合历史课程展示你的常用教练关系。'}</Text>
      </View>

      <View className='my-coaches-page__section'>
        <SectionTitle title='常用教练' actionLabel='FAVORITES' actionTone='muted' />
        {loadFailed ? (
          <AppCard className='my-coaches-page__empty'>
            <Empty title='教练信息加载失败' description='请检查网络后重试。' />
            <View className='my-coaches-page__empty-action'>
              <AppButton size='small' variant='primary' onClick={fetchData}>
                重新加载
              </AppButton>
            </View>
          </AppCard>
        ) : summaries.length > 0 ? (
          <AppCard padding='none' className='my-coaches-list'>
            {summaries.map((item, index) => (
              <View key={item.coach.id || item.coach.coachCode}>
                <View
                  className='my-coaches-list__item'
                  onClick={() => Taro.navigateTo({ url: `/pages/coach-detail/index?id=${item.coach.id}` })}
                >
                  <View className='my-coaches-list__avatar'>
                    <Text className='my-coaches-list__avatar-text'>{item.coach.name.slice(0, 1)}</Text>
                  </View>
                  <View className='my-coaches-list__content'>
                    <Text className='my-coaches-list__name'>{item.coach.name}</Text>
                    <Text className='my-coaches-list__desc'>{item.coach.specialties?.slice(0, 2).join(' · ') || item.lastCourseName}</Text>
                  </View>
                  <View className='my-coaches-list__side'>
                    <Text className='my-coaches-list__count'>{item.completedCount}</Text>
                    <Text className='my-coaches-list__count-label'>已上课</Text>
                  </View>
                </View>
                {index < summaries.length - 1 ? <Divider spacing='none' /> : null}
              </View>
            ))}
          </AppCard>
        ) : (
          <AppCard className='my-coaches-page__empty'>
            <Empty title='暂无常用教练' description='预约并完成课程后，这里会沉淀你的常用教练。' />
            <View className='my-coaches-page__empty-action'>
              <AppButton size='small' variant='primary' onClick={() => Taro.navigateTo({ url: '/pages/coaches/index' })}>
                查看教练团队
              </AppButton>
            </View>
          </AppCard>
        )}
      </View>
    </PageShell>
  );
}
