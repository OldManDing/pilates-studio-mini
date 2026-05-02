import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { ensureMiniProgramAuth } from '../../api/auth';
import { transactionsApi, Transaction, TransactionSummary } from '../../api/transactions';
import { getApiErrorMessage, isUnauthorizedApiError } from '../../api/request';
import { AppButton, AppCard, Divider, Empty, LoadMoreFooter, Loading, PageHeader, PageShell, Price, SectionTitle, StatusTag } from '../../components';
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
  const [authRequired, setAuthRequired] = useState(false);
  const [summaryLoadFailed, setSummaryLoadFailed] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);

  const fetchTransactions = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadFailed(false);
        setAuthRequired(false);
      }

      const transactionsRes = await transactionsApi.getMyTransactions({ page: currentPage, limit: 10 });
      let summaryRes = null;

      if (currentPage === 1) {
        try {
          summaryRes = await transactionsApi.getMySummary();
          setSummaryLoadFailed(false);
        } catch {
          setSummaryLoadFailed(true);
          setSummary(null);
        }
      }

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
    } catch (error) {
      if (!append) {
        setTransactions([]);
        setLoadFailed(true);
        setAuthRequired(isUnauthorizedApiError(error));
      }
      Taro.showToast({ title: getApiErrorMessage(error, '交易记录加载失败，请重试'), icon: 'none' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  const handleAuthRecover = useCallback(async () => {
    try {
      await ensureMiniProgramAuth({ interactive: true });
      await fetchTransactions(1, false);
      Taro.showToast({ title: '登录成功，已同步消费记录', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: getApiErrorMessage(error, '登录失败，请稍后重试'), icon: 'none' });
    }
  }, [fetchTransactions]);

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

  const completedRevenue = summary?.byStatus?.COMPLETED?.total ?? 0;

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
            {summary ? <Price amount={completedRevenue} size='xl' variant='default' /> : <Text className='transactions-page__summary-meta-value'>--</Text>}
          </View>

          <View className='transactions-page__summary-meta'>
            <Text className='transactions-page__summary-meta-label'>交易笔数</Text>
            <Text className='transactions-page__summary-meta-value'>{summary ? `${summary.transactionCount} 笔` : '--'}</Text>
          </View>

          {summary ? (
            <Text className='transactions-page__summary-meta-label'>累计消费金额仅统计已完成交易，待处理订单请以下方状态为准。</Text>
          ) : null}

          {summaryLoadFailed ? (
            <Text className='transactions-page__summary-meta-label'>消费总览同步失败，当前仅展示成功拉取的流水列表。</Text>
          ) : null}
        </AppCard>
      </View>

      <View className='transactions-page__section'>
        <SectionTitle
          eyebrow='LEDGER'
          title='交易流水'
          subtitle='按时间倒序展示最近记录'
        />

        {loading && page === 1 ? (
          <AppCard className='transactions-page__empty-card'>
            <Loading compact />
          </AppCard>
        ) : loadFailed ? (
          <AppCard className='transactions-page__empty-card'>
            <Empty
              title={authRequired ? '请先登录' : '消费记录加载失败'}
              description={authRequired ? '登录后即可同步消费记录与支付状态。' : '请检查网络后重试，或返回会员中心查看权益。'}
              actionLabel={authRequired ? '去登录' : '重新加载'}
              onActionClick={authRequired ? handleAuthRecover : () => fetchTransactions(1, false)}
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

        {transactions.length > 0 ? <LoadMoreFooter loading={loadingMore} hasMore={hasMore} /> : null}
      </View>

      <View className='transactions-page__spacer' />
    </PageShell>
  );
}
