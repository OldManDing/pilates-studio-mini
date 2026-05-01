import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { bookingsApi, Booking } from '../../api/bookings';
import { getApiErrorMessage, isUnauthorizedApiError } from '../../api/request';
import { AppButton, AppCard, Divider, Empty, Icon, LoadMoreFooter, Loading, PageShell, PageHeader } from '../../components';
import './index.scss';

type BookingTab = 'upcoming' | 'completed' | 'cancelled';

const TABS = [
  { value: 'upcoming', label: '待上课', emptyTitle: '暂无预约', emptyDesc: '去预约一节课程开始你的训练吧' },
  { value: 'completed', label: '已完成', emptyTitle: '暂无记录', emptyDesc: '这里会显示你的历史记录' },
  { value: 'cancelled', label: '已取消', emptyTitle: '暂无取消', emptyDesc: '这里会显示你的取消记录' },
] as const;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatTimeRange(start?: string, end?: string) {
  if (!start || !end) {
    return '--:-- · --min';
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '--:-- · --min';
  }

  const startTime = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
  const durationMinutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)));

  return `${startTime} · ${durationMinutes}min`;
}

function formatDateMeta(value?: string) {
  if (!value) {
    return { day: '--', weekday: '---', isToday: false };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { day: '--', weekday: '---', isToday: false };
  }

  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const now = new Date();
  const isToday =
    now.getFullYear() === date.getFullYear()
    && now.getMonth() === date.getMonth()
    && now.getDate() === date.getDate();

  return {
    day: pad(date.getDate()),
    weekday: weekdays[date.getDay()],
    isToday,
  };
}

function getCourseName(booking: Booking) {
  return booking.session?.course?.name || '未知课程';
}

function getInstructorAndTime(booking: Booking) {
  const instructor = booking.session?.coach?.name || '待安排教练';
  const timeRange = formatTimeRange(booking.session?.startsAt, booking.session?.endsAt);

  return `${instructor} · ${timeRange}`;
}

function getVisualStatus(booking: Booking): BookingTab {
  if (booking.status === 'COMPLETED') {
    return 'completed';
  }

  if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
    return 'cancelled';
  }

  return 'upcoming';
}

function getBookingSortTime(booking: Booking) {
  const rawValue = booking.session?.startsAt || booking.bookingTime;
  const time = rawValue ? new Date(rawValue).getTime() : NaN;

  return Number.isNaN(time) ? 0 : time;
}

function mergeBookings(first: Booking[], second: Booking[]) {
  const bookingMap = new Map<string, Booking>();

  [...first, ...second].forEach((booking) => {
    bookingMap.set(booking.id, booking);
  });

  return Array.from(bookingMap.values()).sort((left, right) => {
    return getBookingSortTime(right) - getBookingSortTime(left);
  });
}

export default function MyBookings() {
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tabTotalCount, setTabTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [cancellingBookingId, setCancellingBookingId] = useState('');
  const requestSeqRef = useRef(0);

  const fetchAllBookingsByStatuses = useCallback(async (statuses: Booking['status'][]) => {
    const requestLimit = 50;
    const responses = await Promise.all(statuses.map(async (status) => {
      const allItems: Booking[] = [];
      let current = 1;
      let totalPages = 1;

      do {
        const response = await bookingsApi.getMyBookings({ page: current, limit: requestLimit, status }, { showLoading: false });
        allItems.push(...(response.data.bookings || []));
        totalPages = response.data.meta?.totalPages || ((response.data.bookings || []).length === requestLimit ? current + 1 : current);
        current += 1;
      } while (current <= totalPages);

      return allItems;
    }));

    return responses.reduce<Booking[]>((result, current) => mergeBookings(result, current), []);
  }, []);

  const fetchBookings = useCallback(async (currentPage = 1, append = false) => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadFailed(false);
        setAuthRequired(false);
      }

      const mergedBookings = activeTab === 'upcoming'
        ? await fetchAllBookingsByStatuses(['PENDING', 'CONFIRMED'])
        : activeTab === 'cancelled'
          ? await fetchAllBookingsByStatuses(['CANCELLED', 'NO_SHOW'])
          : await fetchAllBookingsByStatuses(['COMPLETED']);

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      const endIndex = currentPage * pageSize;
      setBookings(mergedBookings.slice(0, endIndex));
      setTabTotalCount(mergedBookings.length);
      setHasMore(mergedBookings.length > endIndex);
      setPage(currentPage);
    } catch (error) {
      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      if (!append) {
        setBookings([]);
        setTabTotalCount(0);
        setLoadFailed(true);
        setAuthRequired(isUnauthorizedApiError(error));
      }
      Taro.showToast({ title: getApiErrorMessage(error, '加载失败'), icon: 'none' });
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setLoading(false);
        setLoadingMore(false);
        Taro.stopPullDownRefresh();
      }
    }
  }, [activeTab, fetchAllBookingsByStatuses, pageSize]);

  useEffect(() => {
    fetchBookings(1, false);
  }, [fetchBookings]);

  usePullDownRefresh(() => {
    fetchBookings(1, false);
  });

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      fetchBookings(page + 1, true);
    }
  }, [fetchBookings, hasMore, loading, loadingMore, page]);

  const handleTabChange = (tab: BookingTab) => {
    if (tab === activeTab) {
      return;
    }

    setBookings([]);
    setTabTotalCount(0);
    setHasMore(true);
    setActiveTab(tab);
    setPage(1);
  };

  const handleBookingClick = (booking: Booking) => {
    if (cancellingBookingId) {
      Taro.showToast({ title: '正在处理上一条预约', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '预约详情',
      content: `${getCourseName(booking)}\n${getInstructorAndTime(booking)}\n预约编号: ${booking.bookingCode}\n状态: ${booking.status}`,
      showCancel: booking.status === 'CONFIRMED' || booking.status === 'PENDING',
      cancelText: '取消预约',
      confirmText: '确定',
      success: async (res) => {
        if (res.cancel) {
          try {
            setCancellingBookingId(booking.id);
            await bookingsApi.cancel(booking.id);
            Taro.showToast({ title: '已取消', icon: 'success' });
            await fetchBookings(1, false);
          } catch (error) {
            Taro.showToast({ title: getApiErrorMessage(error, '取消失败，请稍后重试'), icon: 'none' });
          } finally {
            setCancellingBookingId('');
          }
        }
      },
    });
  };

  const activeTabMeta = useMemo(() => TABS.find((tab) => tab.value === activeTab) || TABS[0], [activeTab]);

  return (
    <PageShell className='my-bookings-page' safeAreaBottom>
      <PageHeader
        title='我的预约'
        subtitle='管理你的课程安排'
        showBack
        fallbackUrl='/pages/profile/index'
      />

      <View className='my-bookings-page__tab-shell'>
        <View className='my-bookings-page__tabs'>
          {TABS.map((tab) => (
            <View
              key={tab.value}
              className={`my-bookings-page__tab ${activeTab === tab.value ? 'my-bookings-page__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.value)}
            >
              <Text className='my-bookings-page__tab-text'>{tab.label}</Text>
            </View>
          ))}
        </View>
      </View>

        <View className='my-bookings-page__count-row'>
          <Text className='my-bookings-page__count-title'>{activeTabMeta.label}</Text>
          <Text className='my-bookings-page__count-value'>{`${tabTotalCount} 节`}</Text>
        </View>

      <ScrollView className='my-bookings-page__list' scrollY showScrollbar={false} lowerThreshold={80} onScrollToLower={handleLoadMore}>
        {loading && page === 1 ? (
          <Loading compact />
        ) : (
          <View className='my-bookings-page__list-inner'>
            {loadFailed ? (
              <AppCard className='my-bookings-page__empty-card'>
                <Empty
                  title={authRequired ? '请先登录' : '预约加载失败'}
                  description={authRequired ? '登录后即可同步预约、取消和上课记录。' : '请检查网络后重试，或返回课程页继续查看。'}
                  actionLabel={authRequired ? '去登录' : '重新加载'}
                  onActionClick={authRequired ? () => Taro.switchTab({ url: '/pages/profile/index' }) : () => fetchBookings(1, false)}
                />
              </AppCard>
            ) : bookings.length > 0 ? (
              <AppCard padding='none' className='my-bookings-page__card'>
                {bookings.map((booking, index) => {
                  const dateMeta = formatDateMeta(booking.session?.startsAt);
                  const visualStatus = getVisualStatus(booking);

                  return (
                    <View key={booking.id}>
                      <View
                        className={`my-bookings-page__item my-bookings-page__item--${visualStatus}`}
                        onClick={() => handleBookingClick(booking)}
                      >
                        <View className='my-bookings-page__date'>
                          <Text className='my-bookings-page__day'>{dateMeta.day}</Text>
                          <Text className='my-bookings-page__weekday'>{dateMeta.weekday}</Text>
                        </View>

                        <View className='my-bookings-page__accent' />

                        <View className='my-bookings-page__info'>
                          <View className='my-bookings-page__title-row'>
                            <Text className='my-bookings-page__title'>{getCourseName(booking)}</Text>

                            {visualStatus === 'upcoming' && dateMeta.isToday ? (
                              <Text className='my-bookings-page__status-badge my-bookings-page__status-badge--today'>今日</Text>
                            ) : null}

                            {visualStatus === 'completed' ? (
                              <Text className='my-bookings-page__status-badge my-bookings-page__status-badge--completed'>已完成</Text>
                            ) : null}

                            {visualStatus === 'cancelled' ? (
                              <Text className='my-bookings-page__status-badge my-bookings-page__status-badge--cancelled'>已取消</Text>
                            ) : null}
                          </View>

                          <Text className='my-bookings-page__meta'>{getInstructorAndTime(booking)}</Text>
                        </View>

                        <Icon name='chevron-right' className='my-bookings-page__arrow' />
                      </View>

                      {index < bookings.length - 1 ? <Divider spacing='none' /> : null}
                    </View>
                  );
                })}
              </AppCard>
            ) : (
              <AppCard className='my-bookings-page__empty-card'>
                <Empty
                  title={activeTabMeta.emptyTitle}
                  description={activeTabMeta.emptyDesc}
                  actionLabel={activeTab === 'upcoming' ? '去预约课程' : '查看课程页'}
                  onActionClick={() => Taro.switchTab({ url: '/pages/courses/index' })}
                />
              </AppCard>
            )}

            {bookings.length > 0 ? <LoadMoreFooter loading={loadingMore} hasMore={hasMore} /> : null}
          </View>
        )}
      </ScrollView>
    </PageShell>
  );
}
