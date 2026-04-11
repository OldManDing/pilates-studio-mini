import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { bookingsApi, Booking } from '../../api/bookings';
import { membersApi, Member, Membership } from '../../api/members';
import { Loading } from '../../components';
import './index.scss';

type MenuAction = 'profile' | 'contact' | 'settings';

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  description: string;
  url?: string;
  action?: MenuAction;
};

type MenuSection = {
  label: 'SERVICE' | 'SUPPORT';
  items: MenuItem[];
};

const MENU_SECTIONS: MenuSection[] = [
  {
    label: 'SERVICE',
    items: [
      {
        key: 'bookings',
        icon: 'BK',
        label: '我的预约',
        description: '查看与管理课程预约',
        url: '/pages/my-bookings/index',
      },
      {
        key: 'records',
        icon: 'TR',
        label: '训练记录',
        description: '历史训练数据与统计',
        url: '/pages/my-bookings/index',
      },
      {
        key: 'membership',
        icon: 'MB',
        label: '会员中心',
        description: '权益、续费与账户管理',
        url: '/pages/membership/index',
      },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      {
        key: 'notifications',
        icon: 'NT',
        label: '消息通知',
        description: '课程提醒与系统通知',
        action: 'settings',
      },
      {
        key: 'contact',
        icon: 'HP',
        label: '帮助与反馈',
        description: '常见问题与意见反馈',
        action: 'contact',
      },
      {
        key: 'settings',
        icon: 'ST',
        label: '设置',
        description: '账户安全与使用偏好',
        action: 'settings',
      },
    ],
  },
];

type StatItem = {
  key: string;
  value: string;
  unit: string;
  label: string;
};

function getMaskedPhone(phone?: string) {
  if (!phone) {
    return '登录后同步会员资料';
  }

  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function getDisplayName(member: Member | null) {
  if (!member?.name) {
    return '微信用户';
  }

  return member.name;
}

function getMemberInitial(member: Member | null) {
  if (!member?.name) {
    return 'P';
  }

  return member.name.slice(0, 1).toUpperCase();
}

function getJoinedMonths(joinedAt?: string) {
  if (!joinedAt) {
    return 0;
  }

  const joinedDate = new Date(joinedAt);

  if (Number.isNaN(joinedDate.getTime())) {
    return 0;
  }

  const now = new Date();
  const months = (now.getFullYear() - joinedDate.getFullYear()) * 12 + (now.getMonth() - joinedDate.getMonth());

  return Math.max(0, months || (now.getDate() >= joinedDate.getDate() ? 1 : 0));
}

function getBadgeLabel() {
  return 'GOLD';
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const [profileRes, membershipsRes, bookingsRes] = await Promise.all([
        membersApi.getProfile().catch(() => ({ data: { member: null as Member | null } })),
        membersApi.getMyMemberships().catch(() => ({ data: { memberships: [] as Membership[] } })),
        bookingsApi.getMyBookings({ page: 1, limit: 100 }).catch(() => ({ data: { bookings: [] as Booking[] } })),
      ]);

      setMember(profileRes.data.member);
      setMemberships(membershipsRes.data.memberships || profileRes.data.member?.memberships || []);
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  usePullDownRefresh(() => {
    fetchProfile();
  });

  const activeMembership = useMemo(() => {
    return memberships.find((membership) => membership.isActive) || null;
  }, [memberships]);

  const statItems = useMemo<StatItem[]>(() => {
    const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED').length;
    const totalBookings = bookings.length;
    const activeMembershipCount = memberships.filter((membership) => membership.isActive).length;
    const joinedMonths = getJoinedMonths(member?.joinedAt);

    return [
      {
        key: 'bookings',
        value: member ? String(completedBookings || totalBookings) : '--',
        unit: '节',
        label: '累计课程',
      },
      {
        key: 'memberships',
        value: member ? String(activeMembershipCount) : '--',
        unit: 'h',
        label: '训练时长',
      },
      {
        key: 'joined',
        value: member ? String(joinedMonths) : '--',
        unit: '月',
        label: '入会时长',
      },
    ];
  }, [bookings, member, memberships]);

  const handleMenuClick = (item: MenuItem) => {
    if (item.url) {
      Taro.navigateTo({ url: item.url });
      return;
    }

    if (item.action === 'contact') {
      Taro.showModal({
        title: '帮助与反馈',
        content: '常见问题与反馈通道整理中，如需帮助请联系门店顾问。',
        showCancel: false,
      });
      return;
    }

    if (item.action === 'settings') {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  const handleBottomAction = async () => {
    const hasToken = Boolean(Taro.getStorageSync('token'));

    if (!hasToken) {
      Taro.showToast({ title: '请使用微信登录', icon: 'none' });
      return;
    }

    const result = await Taro.showModal({
      title: '退出登录',
      content: '退出后将清除当前小程序内的登录状态。',
      confirmText: '退出',
      confirmColor: '#C4A574',
    });

    if (!result.confirm) {
      return;
    }

    Taro.removeStorageSync('token');
    setMember(null);
    setMemberships([]);
    setBookings([]);
    Taro.showToast({ title: '已退出登录', icon: 'success' });
    Taro.switchTab({ url: '/pages/index/index' });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View className='profile'>
      <ScrollView className='profile__content' scrollY enhanced showScrollbar={false}>
        <View className='profile__shell'>
          <View className='profile__heading'>
            <Text className='profile__eyebrow'>MY ACCOUNT</Text>
          </View>

          <View className='profile__section'>
            <View className='profile__card profile__card--profile'>
              <View className='profile__card-top'>
                <View className='profile__avatar-wrap'>
                  {member?.avatar ? (
                    <Image className='profile__avatar-image' src={member.avatar} mode='aspectFill' />
                  ) : (
                    <View className='profile__avatar-fallback'>
                      <Text className='profile__avatar-text'>{getMemberInitial(member)}</Text>
                    </View>
                  )}
                </View>

                <View className='profile__identity'>
                  <View className='profile__identity-row'>
                    <Text className='profile__name'>{getDisplayName(member)}</Text>
                    <View className='profile__badge'>
                      <View className='profile__badge-dot' />
                      <Text className='profile__badge-text'>{getBadgeLabel()}</Text>
                    </View>
                  </View>

                  <Text className='profile__phone'>{getMaskedPhone(member?.phone)}</Text>
                  <Text className='profile__meta'>
                    {member?.memberCode
                      ? `会员编号 ${member.memberCode}`
                      : '登录后查看会员编号与训练资料'}
                  </Text>
                </View>
              </View>

              <View className='profile__stats'>
                {statItems.map((item, index) => (
                  <View key={item.key} className='profile__stat'>
                    <View className='profile__stat-value-row'>
                      <Text className='profile__stat-value'>{item.value}</Text>
                      <Text className='profile__stat-unit'>{item.unit}</Text>
                    </View>
                    <Text className='profile__stat-label'>{item.label}</Text>
                    {index < statItems.length - 1 ? <View className='profile__stat-divider' /> : null}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {MENU_SECTIONS.map((section) => (
            <View key={section.label} className='profile__section'>
              <Text className='profile__section-label'>{section.label}</Text>
              <View className='profile__card profile__card--menu'>
                {section.items.map((item, index) => (
                  <View key={item.key}>
                    <View className='profile__menu-item' onClick={() => handleMenuClick(item)}>
                      <View className='profile__menu-icon'>
                        <Text className='profile__menu-icon-text'>{item.icon}</Text>
                      </View>

                      <View className='profile__menu-body'>
                        <Text className='profile__menu-title'>{item.label}</Text>
                        <Text className='profile__menu-desc'>{item.description}</Text>
                      </View>

                      <Text className='profile__menu-arrow'>〉</Text>
                    </View>
                    {index < section.items.length - 1 ? <View className='profile__menu-divider' /> : null}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View className='profile__section profile__section--bottom'>
            <View className='profile__signout' onClick={handleBottomAction}>
              <Text className='profile__signout-icon'>⇥</Text>
              <Text className='profile__signout-text'>退出登录</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
