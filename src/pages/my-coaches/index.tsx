import { useCallback, useEffect, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { Image, Text, View } from '@tarojs/components';
import { ensureMiniProgramAuth } from '../../api/auth';
import { coachesApi, type Coach, type MyCoachSummary } from '../../api/coaches';
import { getApiErrorMessage, isUnauthorizedApiError } from '../../api/request';
import { AppCard, Divider, Empty, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

export default function MyCoaches() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [summaries, setSummaries] = useState<MyCoachSummary[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      setAuthRequired(false);

      const response = await coachesApi.getMine();
      setSummaries(response.data.coaches || []);
    } catch (error) {
      setSummaries([]);
      setLoadFailed(true);
      setAuthRequired(isUnauthorizedApiError(error));
      Taro.showToast({ title: getApiErrorMessage(error, '教练信息加载失败'), icon: 'none' });
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

  const handleCoachClick = (coach: Coach) => {
    if (!coach.id) {
      Taro.showToast({ title: '教练信息暂未同步', icon: 'none' });
      return;
    }

    Taro.navigateTo({ url: `/pages/coach-detail/index?id=${coach.id}` });
  };

  const handleAuthRecover = async () => {
    try {
      await ensureMiniProgramAuth({ interactive: true });
      await fetchData();
      Taro.showToast({ title: '登录成功，已同步教练关系', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: getApiErrorMessage(error, '登录失败，请稍后重试'), icon: 'none' });
    }
  };

  if (loading) {
    return (
      <PageShell className='my-coaches-page' safeAreaBottom>
        <PageHeader title='我的教练' subtitle='正在同步教练资料' pageKey='myCoaches' fallbackUrl='/pages/profile/index' />
        <AppCard>
          <Loading compact />
        </AppCard>
      </PageShell>
    );
  }

  return (
    <PageShell className='my-coaches-page' safeAreaBottom>
      <PageHeader title='我的教练' subtitle='常用教练与近期课程' pageKey='myCoaches' fallbackUrl='/pages/profile/index' />

      <View className='my-coaches-page__hero'>
        <Text className='my-coaches-page__hero-label'>教练团队</Text>
        <Text className='my-coaches-page__hero-value'>{loadFailed ? '--' : summaries.length}</Text>
        <Text className='my-coaches-page__hero-desc'>{loadFailed ? '教练信息暂时无法同步，请稍后重试。' : '位可预约教练，结合历史课程展示你的常用教练关系。'}</Text>
      </View>

      <View className='my-coaches-page__section'>
        <SectionTitle title='常用教练' actionLabel='常用' actionTone='muted' />
        {loadFailed ? (
          <AppCard className='my-coaches-page__empty'>
            <Empty
              title={authRequired ? '请先登录' : '教练信息加载失败'}
              description={authRequired ? '登录后即可同步你的常用教练、历史课程和近期关系。' : '请检查网络后重试，或返回课程页查看可预约教练。'}
              actionLabel={authRequired ? '去登录' : '重新加载'}
              onActionClick={authRequired ? handleAuthRecover : fetchData}
            />
          </AppCard>
        ) : summaries.length > 0 ? (
          <AppCard padding='none' className='my-coaches-list'>
            {summaries.map((item, index) => (
              <View key={item.coach.id || item.coach.coachCode}>
                <View
                  className='my-coaches-list__item'
                  onClick={() => handleCoachClick(item.coach)}
                >
                  <View className='my-coaches-list__avatar'>
                    {item.coach.avatar ? (
                      <Image className='my-coaches-list__avatar-image' src={item.coach.avatar} mode='aspectFill' />
                    ) : (
                      <Text className='my-coaches-list__avatar-text'>{item.coach.name.slice(0, 1)}</Text>
                    )}
                  </View>
                  <View className='my-coaches-list__content'>
                    <Text className='my-coaches-list__name'>{item.coach.name}</Text>
                    <Text className='my-coaches-list__desc'>{item.coach.specialties?.slice(0, 2).join(' · ') || item.lastCourseName || '暂无最近课程'}</Text>
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
            <Empty
              title='暂无常用教练'
              description='预约并完成课程后，这里会沉淀你的常用教练。'
              actionLabel='查看教练团队'
              onActionClick={() => Taro.navigateTo({ url: '/pages/coaches/index' })}
            />
          </AppCard>
        )}
      </View>
    </PageShell>
  );
}
