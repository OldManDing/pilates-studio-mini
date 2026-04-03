import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { bookingsApi, Booking } from '../../api/bookings';
import { Loading, Empty, BookingItem } from '../../components';
import './index.scss';

const TABS = [
  { value: 'all', label: '全部' },
  { value: 'upcoming', label: '待上课' },
  { value: 'completed', label: '已完成' },
];

export default function MyBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchBookings = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (currentPage === 1) setLoading(true);

      const params: any = { page: currentPage, limit: 10 };
      if (activeTab === 'upcoming') {
        params.status = 'CONFIRMED';
      } else if (activeTab === 'completed') {
        params.status = 'COMPLETED';
      }

      const res = await bookingsApi.getMyBookings(params);
      const newBookings = res.data.bookings || [];
      const meta = res.data.meta;

      if (append) {
        setBookings((prev) => [...prev, ...newBookings]);
      } else {
        setBookings(newBookings);
      }

      setHasMore(meta ? meta.page < meta.totalPages : newBookings.length === 10);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookings(1, false);
  }, [fetchBookings]);

  usePullDownRefresh(() => {
    fetchBookings(1, false);
  });

  useReachBottom(() => {
    if (hasMore && !loading) {
      fetchBookings(page + 1, true);
    }
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleBookingClick = (booking: Booking) => {
    Taro.showModal({
      title: '预约详情',
      content: `预约编号: ${booking.bookingCode}\n状态: ${booking.status}`,
      showCancel: booking.status === 'CONFIRMED' || booking.status === 'PENDING',
      cancelText: '取消预约',
      confirmText: '确定',
      success: async (res) => {
        if (res.cancel) {
          try {
            await bookingsApi.cancel(booking.id);
            Taro.showToast({ title: '已取消', icon: 'success' });
            fetchBookings(1, false);
          } catch (error) {
            console.error('Cancel failed:', error);
          }
        }
      },
    });
  };

  return (
    <View className='my-bookings'>
      {/* Tabs */}
      <View className='my-bookings__tabs'>
        {TABS.map((tab) => (
          <View
            key={tab.value}
            className={`my-bookings__tab ${activeTab === tab.value ? 'my-bookings__tab--active' : ''}`}
            onClick={() => handleTabChange(tab.value)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* Booking List */}
      <ScrollView className='my-bookings__list' scrollY enhanced showScrollbar={false}>
        {loading && page === 1 ? (
          <Loading />
        ) : bookings.length > 0 ? (
          <View className='my-bookings__items'>
            {bookings.map((booking) => (
              <BookingItem key={booking.id} booking={booking} onClick={() => handleBookingClick(booking)} />
            ))}
          </View>
        ) : (
          <Empty title='暂无预约' description='去预约一节课程吧' />
        )}
        {hasMore && !loading && bookings.length > 0 && (
          <View className='my-bookings__loading-more'>
            <Text className='my-bookings__loading-more-text'>加载中...</Text>
          </View>
        )}
        {!hasMore && bookings.length > 0 && (
          <View className='my-bookings__no-more'>
            <Text className='my-bookings__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
