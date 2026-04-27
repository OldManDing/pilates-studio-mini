import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { bookingsApi, type Booking } from '../../api/bookings';
import { AppButton, AppCard, Divider, Empty, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDate(value?: string) {
  if (!value) return '--.--.--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--.--.--';
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function calculateMinutes(start?: string, end?: string) {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Math.round(diff / 60000);
}

export default function TrainingRecords() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [records, setRecords] = useState<Booking[]>([]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const pageSize = 50;
      const allRecords: Booking[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await bookingsApi.getMyBookings({ page: currentPage, limit: pageSize, status: 'COMPLETED' }, { showLoading: false });
        allRecords.push(...(response.data.bookings || []));
        totalPages = response.data.meta?.totalPages || (response.data.bookings?.length === pageSize ? currentPage + 1 : currentPage);
        currentPage += 1;
      } while (currentPage <= totalPages);

      setRecords(allRecords);
    } catch {
      setRecords([]);
      setLoadFailed(true);
      Taro.showToast({ title: '训练记录加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  usePullDownRefresh(() => {
    fetchRecords();
  });

  const summary = useMemo(() => {
    const minutes = records.reduce((total, item) => total + calculateMinutes(item.session?.startsAt, item.session?.endsAt), 0);
    const coaches = new Set(records.map((item) => item.session?.coach?.name).filter(Boolean));
    return {
      sessions: records.length,
      hours: Math.round(minutes / 60),
      coaches: coaches.size,
    };
  }, [records]);

  if (loading) {
    return <Loading />;
  }

  return (
    <PageShell className='training-records-page' safeAreaBottom>
      <PageHeader title='训练记录' subtitle='历史训练数据与统计' fallbackUrl='/pages/profile/index' />

      <View className='training-records-page__summary'>
        {[
          { label: '累计课程', value: summary.sessions, unit: '节' },
          { label: '训练时长', value: summary.hours, unit: 'h' },
          { label: '合作教练', value: summary.coaches, unit: '位' },
        ].map((item) => (
          <AppCard key={item.label} className='training-records-page__summary-card'>
            <Text className='training-records-page__summary-value'>{item.value}</Text>
            <Text className='training-records-page__summary-unit'>{item.unit}</Text>
            <Text className='training-records-page__summary-label'>{item.label}</Text>
          </AppCard>
        ))}
      </View>

      <View className='training-records-page__section'>
        <SectionTitle title='近期训练' actionLabel='TRAINING' actionTone='muted' />
        {loadFailed ? (
          <AppCard className='training-records-page__empty'>
            <Empty
              title='训练记录加载失败'
              description='请检查网络后重试，或返回课程页继续安排训练。'
              actionLabel='重新加载'
              onActionClick={fetchRecords}
            />
          </AppCard>
        ) : records.length > 0 ? (
          <AppCard padding='none' className='training-records-list'>
            {records.map((record, index) => (
              <View key={record.id || record.bookingCode}>
                <View className='training-records-list__item'>
                  <View className='training-records-list__main'>
                    <Text className='training-records-list__title'>{record.session?.course?.name || '已完成课程'}</Text>
                    <Text className='training-records-list__meta'>{record.session?.coach?.name || '教练待同步'} · {formatDate(record.session?.startsAt || record.bookingTime || record.bookedAt)}</Text>
                  </View>
                  <View className='training-records-list__side'>
                    <Text className='training-records-list__duration'>{calculateMinutes(record.session?.startsAt, record.session?.endsAt) || '--'}min</Text>
                    <Text className='training-records-list__status'>已完成</Text>
                  </View>
                </View>
                {index < records.length - 1 ? <Divider spacing='none' /> : null}
              </View>
            ))}
          </AppCard>
        ) : (
          <AppCard className='training-records-page__empty'>
            <Empty
              title='暂无训练记录'
              description='完成课程后，这里会展示你的训练统计与历史记录。'
              actionLabel='去预约课程'
              onActionClick={() => Taro.switchTab({ url: '/pages/courses/index' })}
            />
          </AppCard>
        )}
      </View>
    </PageShell>
  );
}
