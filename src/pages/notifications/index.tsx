import { useMemo, useState } from 'react';
import { Text, View } from '@tarojs/components';
import { AppCard, Divider, Icon, PageHeader, PageShell, SectionTitle } from '../../components';
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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'course',
    title: '课程即将开始',
    body: '「流瑜伽进阶」将于今日 14:00 开课，请提前 15 分钟到达朝阳门店。',
    time: '09:30',
    timeLabel: '今日',
    status: 'unread',
  },
  {
    id: 'n2',
    type: 'course',
    title: '预约确认',
    body: '你已成功预约 4月7日「哈他瑜伽」16:00 - 17:00，王梦瑶教练。',
    time: '昨日',
    timeLabel: '04.05',
    status: 'unread',
  },
  {
    id: 'n3',
    type: 'member',
    title: '会员权益提醒',
    body: '你的 GOLD 年度金卡将于 2026.12.31 到期，剩余 271 天。提前续费可享专属优惠。',
    time: '3天前',
    timeLabel: '04.03',
    status: 'read',
  },
  {
    id: 'n4',
    type: 'system',
    title: '系统维护通知',
    body: '4月10日 02:00 – 06:00 进行系统维护，届时预约服务将暂停，请提前安排。',
    time: '4天前',
    timeLabel: '04.02',
    status: 'read',
  },
  {
    id: 'n5',
    type: 'course',
    title: '课程完成',
    body: '「普拉提塑形」已完成，本月已完成 12 节课程，继续保持！',
    time: '5天前',
    timeLabel: '04.01',
    status: 'read',
  },
  {
    id: 'n6',
    type: 'system',
    title: '新课程上线',
    body: '「空中瑜伽 · 入门」现已开放预约，由资深教练李芮带课，名额有限。',
    time: '1周前',
    timeLabel: '03.30',
    status: 'read',
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const unread = useMemo(
    () => notifications.filter((notification) => notification.status === 'unread'),
    [notifications],
  );
  const read = useMemo(
    () => notifications.filter((notification) => notification.status === 'read'),
    [notifications],
  );

  const unreadCount = unread.length;

  const handleMarkAllRead = () => {
    setNotifications((previous) => previous.map((notification) => ({ ...notification, status: 'read' })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((previous) => previous.map((notification) => (
      notification.id === id
        ? { ...notification, status: 'read' }
        : notification
    )));
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

  return (
    <PageShell className='notifications-page' safeAreaBottom>
      <PageHeader
        title='消息通知'
        subtitle={unreadCount > 0 ? `${unreadCount} 条未读消息` : '所有消息已读'}
        rightSlot={unreadCount > 0 ? (
          <View className='notifications-page__header-action' onClick={handleMarkAllRead}>
            <Icon name='check' className='notifications-page__header-action-icon' />
            <Text className='notifications-page__header-action-text'>全部已读</Text>
          </View>
        ) : undefined}
      />

      {unread.length > 0 ? (
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

      <View className='notifications-page__section'>
        <SectionTitle title='已读' actionLabel='EARLIER' actionTone='muted' />
        <AppCard className='notifications-list' padding='none'>
          {read.length === 0 ? (
            <View className='notifications-list__empty'>
              <Text className='notifications-list__empty-title'>暂无消息</Text>
              <Text className='notifications-list__empty-description'>新的通知将会显示在这里</Text>
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
      </View>
    </PageShell>
  );
}
