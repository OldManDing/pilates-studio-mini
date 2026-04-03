import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { coachesApi, Coach } from '../../api/coaches';
import { Loading, Empty, CoachCard } from '../../components';
import './index.scss';

export default function Coaches() {
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCoaches = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (currentPage === 1) setLoading(true);

      const res = await coachesApi.getAll({
        page: currentPage,
        limit: 10,
        isActive: true,
      });
      const newCoaches = res.data.coaches || [];
      const meta = res.data.meta;

      if (append) {
        setCoaches((prev) => [...prev, ...newCoaches]);
      } else {
        setCoaches(newCoaches);
      }

      setHasMore(meta ? meta.page < meta.totalPages : newCoaches.length === 10);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  usePullDownRefresh(() => {
    fetchCoaches(1, false);
  });

  useReachBottom(() => {
    if (hasMore && !loading) {
      fetchCoaches(page + 1, true);
    }
  });

  const handleCoachClick = (coach: Coach) => {
    Taro.navigateTo({ url: `/pages/coach-detail/index?id=${coach.id}` });
  };

  return (
    <View className='coaches'>
      <ScrollView className='coaches__list' scrollY enhanced showScrollbar={false}>
        {loading && page === 1 ? (
          <Loading />
        ) : coaches.length > 0 ? (
          <View className='coaches__grid'>
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} onClick={() => handleCoachClick(coach)} />
            ))}
          </View>
        ) : (
          <Empty title='暂无教练' description='敬请期待' />
        )}
        {hasMore && !loading && coaches.length > 0 && (
          <View className='coaches__loading-more'>
            <Text className='coaches__loading-more-text'>加载中...</Text>
          </View>
        )}
        {!hasMore && coaches.length > 0 && (
          <View className='coaches__no-more'>
            <Text className='coaches__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
