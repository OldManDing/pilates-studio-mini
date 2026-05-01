import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { AppButton, AppCard, Divider, Empty, Icon, LoadMoreFooter, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import { notificationsApi, type NotificationItem as ApiNotificationItem } from '../../api/notifications';
import { getApiErrorMessage } from '../../api/request';
import './index.scss';

type NotificationType = 'course' | 'system' | 'member';
type NotificationStatus = 'unread' | 'read';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  timeLabel: string;
  status: NotificationStatus;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatTimeLabel(value?: string) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  const now = new Date();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDiff = Math.round((todayStart - dateStart) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (dayDiff === 1) return '昨日';
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff}天前`;
  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  }

  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function formatDateLabel(value?: string) {
  if (!value) return '--.--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--.--';
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function getNotificationType(notification: ApiNotificationItem): NotificationType {
  if (notification.type.includes('COURSE') || notification.type.includes('BOOKING')) return 'course';
  if (notification.type.includes('MEMBER') || notification.type.includes('PAYMENT')) return 'member';
  return 'system';
}

function toNotificationItem(notification: ApiNotificationItem): NotificationItem {
  const eventTime = notification.sentAt || notification.createdAt;

  return {
    id: notification.id,
    type: getNotificationType(notification),
    title: notification.title,
    body: notification.content,
    time: formatTimeLabel(eventTime),
    timeLabel: formatDateLabel(eventTime),
    status: notification.status === 'READ' ? 'read' : 'unread',
  };
}

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingReadIds, setMarkingReadIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadFailed(false);
      }

      const pageSize = 20;
      const response = await notificationsApi.getMy({ page: currentPage, limit: pageSize }, { showLoading: false });
      const nextItems = (response.data.notifications || []).map(toNotificationItem);

      setNotifications((previous) => {
        if (!append) {
          return nextItems;
        }

        const existedIds = new Set(previous.map((item) => item.id));
        const deduped = nextItems.filter((item) => !existedIds.has(item.id));
        return [...previous, ...deduped];
      });

      const nextHasMore = response.data.meta
        ? response.data.meta.page < response.data.meta.totalPages
        : nextItems.length === pageSize;
      setHasMore(nextHasMore);
      setPage(currentPage);
    } catch (error) {
      if (!append) {
        setLoadFailed(true);
      }
      Taro.showToast({ title: getApiErrorMessage(error, '消息加载失败'), icon: 'none' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  usePullDownRefresh(() => {
    fetchNotifications(1, false);
  });

  useReachBottom(() => {
    if (loading || loadingMore || !hasMore || loadFailed) {
      return;
    }

    fetchNotifications(page + 1, true);
  });

  const unread = useMemo(
    () => notifications.filter((notification) => notification.status === 'unread'),
    [notifications],
  );
  const read = useMemo(
    () => notifications.filter((notification) => notification.status === 'read'),
    [notifications],
  );

  const unreadCount = unread.length;

  const handleMarkAllRead = async () => {
    const unreadIds = unread.map((notification) => notification.id);
    if (unreadIds.length === 0 || markingAllRead) {
      return;
    }

    try {
      setMarkingAllRead(true);
      const results = await Promise.allSettled(unreadIds.map((id) => notificationsApi.markMyAsRead(id).then(() => id)));
      const succeededIds = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value);

      if (succeededIds.length > 0) {
        setNotifications((previous) => previous.map((notification) => (
          succeededIds.includes(notification.id) ? { ...notification, status: 'read' as const } : notification
        )));
      }

      if (succeededIds.length < unreadIds.length) {
        const firstRejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
        Taro.showToast({ title: getApiErrorMessage(firstRejected?.reason, succeededIds.length > 0 ? '部分消息标记失败' : '标记失败，请稍后重试'), icon: 'none' });
      }
    } catch (error) {
      Taro.showToast({ title: getApiErrorMessage(error, '标记失败，请稍后重试'), icon: 'none' });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (markingReadIds.includes(id)) {
      return;
    }

    try {
      setMarkingReadIds((previous) => [...previous, id]);
      await notificationsApi.markMyAsRead(id);
      setNotifications((previous) => previous.map((notification) => (
        notification.id === id
          ? { ...notification, status: 'read' as const }
          : notification
      )));
    } catch (error) {
      Taro.showToast({ title: getApiErrorMessage(error, '标记失败，请稍后重试'), icon: 'none' });
    } finally {
      setMarkingReadIds((previous) => previous.filter((item) => item !== id));
    }
  };

  const getIconChipClass = (type: NotificationType, isRead: boolean) => {
    if (isRead) {
      return 'notifications-list__icon notifications-list__icon--read';
    }

    if (type === 'system') {
      return 'notifications-list__icon notifications-list__icon--system';
    }

    return 'notifications-list__icon notifications-list__icon--gold';
  };

  const getIconName = (type: NotificationType) => {
    if (type === 'course') return 'clock' as const;
    if (type === 'member') return 'alert-circle' as const;
    return 'info' as const;
  };

  if (loading) {
    return (
      <PageShell className='notifications-page' safeAreaBottom>
        <PageHeader title='消息通知' subtitle='正在同步消息' fallbackUrl='/pages/profile/index' />
        <AppCard>
          <Loading compact />
        </AppCard>
      </PageShell>
    );
  }

  return (
    <PageShell className='notifications-page' safeAreaBottom>
      <PageHeader
        title='消息通知'
        subtitle={unreadCount > 0 ? `${unreadCount} 条未读消息` : '所有消息已读'}
        fallbackUrl='/pages/profile/index'
        rightSlot={unreadCount > 0 ? (
          <AppButton className='notifications-page__header-action' size='small' variant='outline' disabled={markingAllRead} loading={markingAllRead} onClick={handleMarkAllRead}>
            <Icon name='check' className='notifications-page__header-action-icon' />
            <Text className='notifications-page__header-action-text'>{markingAllRead ? '标记中' : '一键设为已读'}</Text>
          </AppButton>
        ) : undefined}
      />

      {loadFailed && notifications.length === 0 ? (
        <View className='notifications-page__section'>
          <AppCard className='notifications-list notifications-list--empty'>
            <Empty title='消息加载失败' description='请检查网络后重试。' actionLabel='重新加载' onActionClick={() => fetchNotifications(1, false)} />
          </AppCard>
        </View>
      ) : unread.length > 0 ? (
        <View className='notifications-page__section'>
          <SectionTitle title='未读' actionLabel='UNREAD' actionTone='muted' />
          <AppCard className='notifications-list' padding='none'>
            {unread.map((notification, index) => (
              <View key={notification.id}>
                <Button className={`notifications-list__item ${markingReadIds.includes(notification.id) ? 'notifications-list__item--pending' : ''}`} hoverClass='none' onClick={() => handleMarkRead(notification.id)}>
                  <View className={getIconChipClass(notification.type, false)}>
                    <Icon name={getIconName(notification.type)} className='notifications-list__icon-image' />
                  </View>

                  <View className='notifications-list__body'>
                    <View className='notifications-list__heading-row'>
                      <View className='notifications-list__title-wrap'>
                        <Text className='notifications-list__title'>{notification.title}</Text>
                        <View className='notifications-list__dot' />
                      </View>
                      <Text className='notifications-list__time notifications-list__time--unread'>{notification.time}</Text>
                    </View>
                    <Text className='notifications-list__description'>{notification.body}</Text>
                  </View>
                </Button>

                {index < unread.length - 1 ? <Divider spacing='none' className='notifications-list__divider' /> : null}
              </View>
            ))}
          </AppCard>
        </View>
      ) : null}

        {!(loadFailed && notifications.length === 0) ? <View className='notifications-page__section'>
          <SectionTitle title='已读' actionLabel='EARLIER' actionTone='muted' />
          <AppCard className='notifications-list' padding='none'>
            {read.length === 0 && unread.length === 0 ? (
              <View className='notifications-list__empty'>
                <Text className='notifications-list__empty-title'>暂无消息</Text>
                <Text className='notifications-list__empty-description'>新的通知会在这里显示，记得先查看未读消息。</Text>
              </View>
            ) : read.length === 0 ? (
              <View className='notifications-list__empty'>
                <Text className='notifications-list__empty-title'>暂无已读消息</Text>
                <Text className='notifications-list__empty-description'>点开未读消息后会自动归档到这里。</Text>
              </View>
            ) : (
            read.map((notification, index) => (
              <View key={notification.id}>
                <View className='notifications-list__item notifications-list__item--read'>
                  <View className={getIconChipClass(notification.type, true)}>
                    <Icon name={getIconName(notification.type)} className='notifications-list__icon-image notifications-list__icon-image--read' />
                  </View>

                  <View className='notifications-list__body'>
                    <View className='notifications-list__heading-row'>
                      <Text className='notifications-list__title notifications-list__title--read'>{notification.title}</Text>
                      <Text className='notifications-list__time'>{notification.timeLabel}</Text>
                    </View>
                    <Text className='notifications-list__description notifications-list__description--read'>{notification.body}</Text>
                  </View>
                </View>

                {index < read.length - 1 ? <Divider spacing='none' className='notifications-list__divider' /> : null}
              </View>
            ))
          )}
        </AppCard>
      </View> : null}

      {!loadFailed && notifications.length > 0 ? (
        <View className='notifications-page__section'>
          <LoadMoreFooter loading={loadingMore} hasMore={hasMore} />
        </View>
      ) : null}
    </PageShell>
  );
}
