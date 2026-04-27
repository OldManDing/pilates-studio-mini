import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { AppCard, Divider, Empty, Icon, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import { notificationsApi, type NotificationItem as ApiNotificationItem } from '../../api/notifications';
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
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function formatDateLabel(value?: string) {
  if (!value) return '--.--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--.--';
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const response = await notificationsApi.getMy({ page: 1, limit: 50 }, { showLoading: false });
      setNotifications((response.data.notifications || []).map(toNotificationItem));
    } catch {
      setNotifications([]);
      setLoadFailed(true);
      Taro.showToast({ title: '消息加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  usePullDownRefresh(() => {
    fetchNotifications();
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
      await Promise.all(unreadIds.map((id) => notificationsApi.markMyAsRead(id)));
      setNotifications((previous) => previous.map((notification) => ({ ...notification, status: 'read' as const })));
    } catch {
      Taro.showToast({ title: '标记失败，请稍后重试', icon: 'none' });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markMyAsRead(id);
      setNotifications((previous) => previous.map((notification) => (
        notification.id === id
          ? { ...notification, status: 'read' as const }
          : notification
      )));
    } catch {
      Taro.showToast({ title: '标记失败，请稍后重试', icon: 'none' });
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
    return <Loading />;
  }

  return (
    <PageShell className='notifications-page' safeAreaBottom>
      <PageHeader
        title='消息通知'
        subtitle={unreadCount > 0 ? `${unreadCount} 条未读消息` : '所有消息已读'}
        fallbackUrl='/pages/profile/index'
        rightSlot={unreadCount > 0 ? (
          <View className={`notifications-page__header-action ${markingAllRead ? 'notifications-page__header-action--disabled' : ''}`} onClick={handleMarkAllRead}>
            <Icon name='check' className='notifications-page__header-action-icon' />
            <Text className='notifications-page__header-action-text'>{markingAllRead ? '标记中' : '一键设为已读'}</Text>
          </View>
        ) : undefined}
      />

      {loadFailed ? (
        <View className='notifications-page__section'>
          <AppCard className='notifications-list notifications-list--empty'>
            <Empty title='消息加载失败' description='请检查网络后重试。' actionLabel='重新加载' onActionClick={fetchNotifications} />
          </AppCard>
        </View>
      ) : unread.length > 0 ? (
        <View className='notifications-page__section'>
          <SectionTitle title='未读' actionLabel='UNREAD' actionTone='muted' />
          <AppCard className='notifications-list' padding='none'>
            {unread.map((notification, index) => (
              <View key={notification.id}>
                <View className='notifications-list__item' onClick={() => handleMarkRead(notification.id)}>
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
                </View>

                {index < unread.length - 1 ? <Divider spacing='none' className='notifications-list__divider' /> : null}
              </View>
            ))}
          </AppCard>
        </View>
      ) : null}

        {!loadFailed ? <View className='notifications-page__section'>
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
    </PageShell>
  );
}
