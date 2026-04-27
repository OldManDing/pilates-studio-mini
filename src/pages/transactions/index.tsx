import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { transactionsApi, Transaction } from '../../api/transactions';
import { AppButton, AppCard, Divider, Empty, Loading, PageHeader, PageShell, Price, SectionTitle, StatusTag } from '../../components';
import { TransactionStatuses, TransactionKinds } from '../../constants/enums';
import './index.scss';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDate(isoString?: string) {
  if (!isoString) {
    return '--.--.-- --:--';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '--.--.-- --:--';
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [summary, setSummary] = useState({ totalRevenue: 0, transactionCount: 0 });

  const fetchTransactions = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadFailed(false);
      }

      const transactionsRes = await transactionsApi.getMyTransactions({ page: currentPage, limit: 10 });
      const summaryRes = currentPage === 1
        ? await transactionsApi.getMySummary().catch(() => null)
        : null;

      const newTransactions = transactionsRes.data.transactions || [];
      const meta = transactionsRes.data.meta;

      if (append) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }

      setHasMore(meta ? meta.page < meta.totalPages : newTransactions.length === 10);
      setPage(currentPage);
      if (summaryRes) {
        setSummary(summaryRes.data);
      }
    } catch {
      if (!append) {
        setTransactions([]);
        setLoadFailed(true);
      }
      Taro.showToast({ title: '交易记录加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  usePullDownRefresh(() => {
    fetchTransactions(1, false);
  });

  useReachBottom(() => {
    if (hasMore && !loading && !loadingMore) {
      fetchTransactions(page + 1, true);
    }
  });

  return (
    <PageShell className='transactions-page' safeAreaBottom>
      <PageHeader
        title='消费记录'
        subtitle='查看你的历史交易与支付状态'
        eyebrow='ACTIVITY'
        fallbackUrl='/pages/membership/index'
      />

      <View className='transactions-page__section'>
        <SectionTitle
          eyebrow='SUMMARY'
          title='消费总览'
          subtitle='会员中心累计账单总览'
        />

        <AppCard className='transactions-page__summary-card'>
          <Text className='transactions-page__summary-label'>累计消费金额</Text>
          <View className='transactions-page__summary-amount'>
            <Price amount={summary.totalRevenue} size='xl' variant='default' />
          </View>

          <View className='transactions-page__summary-meta'>
            <Text className='transactions-page__summary-meta-label'>交易笔数</Text>
            <Text className='transactions-page__summary-meta-value'>{summary.transactionCount} 笔</Text>
          </View>
        </AppCard>
      </View>

      <View className='transactions-page__section'>
        <SectionTitle
          eyebrow='LEDGER'
          title='交易流水'
          subtitle='按时间倒序展示最近记录'
        />

        {loading && page === 1 ? (
          <Loading />
        ) : loadFailed ? (
          <AppCard className='transactions-page__empty-card'>
            <Empty
              title='消费记录加载失败'
              description='请检查网络后重试，或返回会员中心查看权益。'
              actionLabel='重新加载'
              onActionClick={() => fetchTransactions(1, false)}
            />
          </AppCard>
        ) : transactions.length > 0 ? (
          <AppCard padding='none' className='transactions-page__ledger-card'>
            {transactions.map((transaction, index) => (
              <View key={transaction.id}>
                <View className='transactions-page__item'>
                  <View className='transactions-page__item-main'>
                    <Text className='transactions-page__item-kind'>
                      {TransactionKinds.find((item) => item.value === transaction.kind)?.label || transaction.kind}
                    </Text>
                    <Text className='transactions-page__item-date'>{formatDate(transaction.happenedAt || transaction.createdAt)}</Text>
                    <Text className='transactions-page__item-code'>{transaction.transactionCode}</Text>
                  </View>

                  <View className='transactions-page__item-side'>
                    <StatusTag value={transaction.status} options={TransactionStatuses} size='small' />
                    <Price amount={transaction.amountCents} size='normal' variant='default' />
                  </View>
                </View>

                {index < transactions.length - 1 ? <Divider spacing='none' /> : null}
              </View>
            ))}
          </AppCard>
        ) : (
          <AppCard className='transactions-page__empty-card'>
            <Empty
              title='暂无消费记录'
              description='先去看看会员方案，或预约课程开始使用。'
              actionLabel='查看会员方案'
              onActionClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}
            />
          </AppCard>
        )}

        {hasMore && !loading && transactions.length > 0 ? (
          <View className='transactions-page__loading-more'>
            <Text className='transactions-page__loading-more-text'>{loadingMore ? '加载中...' : '上拉加载更多'}</Text>
          </View>
        ) : null}

        {!hasMore && transactions.length > 0 ? (
          <View className='transactions-page__loading-more'>
            <Text className='transactions-page__loading-more-text'>没有更多了</Text>
          </View>
        ) : null}
      </View>

      <View className='transactions-page__spacer' />
    </PageShell>
  );
}
