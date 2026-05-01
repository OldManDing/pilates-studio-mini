import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View } from '@tarojs/components';
import { coachesApi, Coach } from '../../api/coaches';
import { AppButton, AppCard, CoachCard, Divider, Empty, LoadMoreFooter, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

export default function Coaches() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCoaches = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadFailed(false);
      }

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
    } catch {
      if (!append) {
        setCoaches([]);
        setLoadFailed(true);
      }
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
    if (hasMore && !loading && !loadingMore) {
      fetchCoaches(page + 1, true);
    }
  });

  const handleCoachClick = (coach: Coach) => {
    if (!coach.id) {
      Taro.showToast({ title: '教练信息暂未同步', icon: 'none' });
      return;
    }

    Taro.navigateTo({ url: `/pages/coach-detail/index?id=${coach.id}` });
  };

  return (
    <PageShell className='coaches-page' safeAreaBottom>
      <PageHeader
        title='教练团队'
        subtitle='查看教练专长与近期可预约排课'
        eyebrow='COACHES'
        fallbackUrl='/pages/courses/index'
      />

      <View className='coaches-page__section'>
        <SectionTitle
          eyebrow='TEAM'
          title='在岗教练'
          subtitle={coaches.length > 0 ? `当前共 ${coaches.length} 位` : '按专长选择更适合你的训练指导'}
        />
      </View>

        {loading && page === 1 ? (
          <Loading compact />
        ) : loadFailed ? (
          <AppCard className='coaches-page__empty-card'>
            <Empty title='教练加载失败' description='请检查网络后重试。' actionLabel='重新加载' onActionClick={() => fetchCoaches(1, false)} />
          </AppCard>
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
          <Empty
            title='暂无教练'
            description='当前暂无可预约教练，可先查看课程安排。'
            actionLabel='查看课程'
            onActionClick={() => Taro.switchTab({ url: '/pages/courses/index' })}
          />
        </AppCard>
      )}

      {coaches.length > 0 ? <LoadMoreFooter loading={loadingMore} hasMore={hasMore} /> : null}

      <View className='coaches-page__spacer' />
    </PageShell>
  );
}
