import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { transactionsApi, Transaction } from '../../api/transactions';
import { Loading, Empty, Price, StatusTag } from '../../components';
import { TransactionStatuses, TransactionKinds } from '../../constants/enums';
import './index.scss';

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [summary, setSummary] = useState({ totalRevenue: 0, transactionCount: 0 });

  const fetchTransactions = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (currentPage === 1) setLoading(true);

      const [transactionsRes, summaryRes] = await Promise.all([
        transactionsApi.getMyTransactions({ page: currentPage, limit: 10 }),
        transactionsApi.getMySummary(),
      ]);

      const newTransactions = transactionsRes.data.transactions || [];
      const meta = transactionsRes.data.meta;

      if (append) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }

      setHasMore(meta ? meta.page < meta.totalPages : newTransactions.length === 10);
      setPage(currentPage);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
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
    if (hasMore && !loading) {
      fetchTransactions(page + 1, true);
    }
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View className="transactions">
      {/* Summary Card */}
      <View className="transactions__summary">
        <Text className="transactions__summary-title">累计消费</Text>
        <Price amount={summary.totalRevenue} size="xl" variant="primary" />
        <Text className="transactions__summary-count">共 {summary.transactionCount} 笔交易</Text>
      </View>

      {/* Transaction List */}
      <ScrollView className="transactions__list" scrollY enhanced showScrollbar={false}>
        {loading && page === 1 ? (
          <Loading />
        ) : transactions.length > 0 ? (
          <View className="transactions__items">
            {transactions.map((transaction) => (
              <View key={transaction.id} className="transactions__item">
                <View className="transactions__item-header">
                  <View className="transactions__item-info">
                    <Text className="transactions__item-kind">
                      {TransactionKinds.find(k => k.value === transaction.kind)?.label || transaction.kind}
                    </Text>
                    <Text className="transactions__item-date">{formatDate(transaction.createdAt)}</Text>
                  </View>
                  <Price amount={transaction.amountCents} size="normal" variant="default" />
                </View>
                <View className="transactions__item-footer">
                  <Text className="transactions__item-code">{transaction.transactionCode}</Text>
                  <StatusTag value={transaction.status} options={TransactionStatuses} size="small" />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Empty title="暂无消费记录" description="去购买会员卡或预约课程吧" />
        )}
        {hasMore && !loading && transactions.length > 0 && (
          <View className="transactions__loading-more">
            <Text className="transactions__loading-more-text">加载中...</Text>
          </View>
        )}
        {!hasMore && transactions.length > 0 && (
          <View className="transactions__no-more">
            <Text className="transactions__no-more-text">没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
