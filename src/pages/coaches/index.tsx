import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { coachesApi, Coach } from '../../api/coaches';
import { AppCard, CoachCard, Divider, Empty, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
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
    <PageShell className='coaches-page' safeAreaBottom>
      <PageHeader
        title='教练团队'
        subtitle='查看教练专长与近期可预约排课'
        eyebrow='COACHES'
      />

      <View className='coaches-page__section'>
        <SectionTitle
          eyebrow='TEAM'
          title='在岗教练'
          subtitle={coaches.length > 0 ? `当前共 ${coaches.length} 位` : '按专长选择更适合你的训练指导'}
        />
      </View>

      {loading && page === 1 ? (
        <Loading />
      ) : coaches.length > 0 ? (
        <AppCard padding='none' className='coaches-page__list-card'>
          {coaches.map((coach, index) => (
            <View key={coach.id}>
              <View className='coaches-page__item'>
                <CoachCard coach={coach} compact onClick={() => handleCoachClick(coach)} />
              </View>

              {index < coaches.length - 1 ? <Divider spacing='none' /> : null}
            </View>
          ))}
        </AppCard>
      ) : (
        <AppCard className='coaches-page__empty-card'>
          <Empty title='暂无教练' description='敬请期待' />
        </AppCard>
      )}

        {hasMore && !loading && coaches.length > 0 ? (
          <View className='coaches-page__loading-more'>
            <Text className='coaches-page__loading-more-text'>上拉加载更多</Text>
          </View>
        ) : null}

      {!hasMore && coaches.length > 0 ? (
        <View className='coaches-page__loading-more'>
          <Text className='coaches-page__loading-more-text'>没有更多了</Text>
        </View>
      ) : null}

      <View className='coaches-page__spacer' />
    </PageShell>
  );
}
