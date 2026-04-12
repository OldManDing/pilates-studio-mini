import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import { bookingsApi, type Booking } from '../../api/bookings';
import { membersApi, type Member, type Membership } from '../../api/members';
import { Loading } from '../../components';
import ProfileAccountCard from './components/ProfileAccountCard';
import ProfileMenuSection from './components/ProfileMenuSection';
import ProfileSignOutButton from './components/ProfileSignOutButton';
import type {
  ProfileAccountCardData,
  ProfileMenuItemData,
  ProfileMenuSectionData,
  ProfileSignOutData,
  ProfileStatData,
} from './components/types';
import './index.scss';

function getMaskedPhone(phone?: string) {
  if (!phone) {
    return '登录后同步会员资料';
  }

  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function getDisplayName(member: Member | null) {
  return member?.name || '微信用户';
}

function getMemberInitial(member: Member | null) {
  return member?.name?.slice(0, 1).toUpperCase() || 'P';
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
      console.error('Failed to fetch profile shell data:', error);
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

  const activeMembership = useMemo(() => memberships.find((membership) => membership.isActive) || null, [memberships]);

  const accountCardData = useMemo<ProfileAccountCardData>(() => {
    const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED').length;
    const totalBookings = bookings.length;
    const activeMembershipCount = memberships.filter((membership) => membership.isActive).length;
    const joinedMonths = getJoinedMonths(member?.joinedAt);

    const stats: ProfileStatData[] = [
      {
        key: 'courses',
        value: member ? String(completedBookings || totalBookings) : '--',
        unit: '节',
        label: '累计课程',
      },
      {
        key: 'hours',
        value: member ? String(activeMembershipCount) : '--',
        unit: 'h',
        label: '训练时长',
      },
      {
        key: 'months',
        value: member ? String(joinedMonths) : '--',
        unit: '月',
        label: '入会时长',
      },
    ];

    return {
      avatarText: getMemberInitial(member),
      avatarUrl: member?.avatar,
      name: getDisplayName(member),
      badgeLabel: activeMembership ? 'GOLD' : 'GUEST',
      phone: getMaskedPhone(member?.phone),
      stats,
    };
  }, [activeMembership, bookings, member, memberships]);

  const menuSections = useMemo<ProfileMenuSectionData[]>(() => [
    {
      key: 'service',
      label: 'SERVICE',
      items: [
        {
          key: 'bookings',
          icon: 'bookings',
          label: '我的预约',
          description: '查看与管理课程预约',
          route: '/pages/my-bookings/index',
        },
        {
          key: 'records',
          icon: 'records',
          label: '训练记录',
          description: '历史训练数据与统计',
          route: '/pages/my-bookings/index',
        },
        {
          key: 'membership',
          icon: 'membership',
          label: '会员中心',
          description: '权益、续费与账户管理',
          route: '/pages/membership/index',
        },
      ],
    },
    {
      key: 'support',
      label: 'SUPPORT',
      items: [
        {
          key: 'notifications',
          icon: 'notifications',
          label: '消息通知',
          description: '课程提醒与系统通知',
        },
        {
          key: 'support',
          icon: 'support',
          label: '帮助与反馈',
          description: '常见问题与意见反馈',
        },
        {
          key: 'settings',
          icon: 'settings',
          label: '设置',
          description: '账户安全与偏好设置',
        },
      ],
    },
  ], []);

  const signOutData: ProfileSignOutData = {
    label: '退出登录',
  };

  const handleMenuClick = (item: ProfileMenuItemData) => {
    if (item.route) {
      Taro.navigateTo({ url: item.route });
      return;
    }

    if (item.key === 'support') {
      Taro.showModal({
        title: '帮助与反馈',
        content: '常见问题与反馈通道整理中，如需帮助请联系门店顾问。',
        showCancel: false,
      });
      return;
    }

    Taro.showToast({ title: '功能开发中', icon: 'none' });
  };

  const handleSignOut = async () => {
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
    <ScrollView className='profile-shell' scrollY enhanced showScrollbar={false}>
      <View className='profile-shell__content'>
        <View className='profile-shell__heading'>
          <Text className='profile-shell__eyebrow'>MY ACCOUNT</Text>
        </View>

        <ProfileAccountCard data={accountCardData} />

        {menuSections.map((section) => (
          <ProfileMenuSection key={section.key} data={section} onItemClick={handleMenuClick} />
        ))}

        <ProfileSignOutButton data={signOutData} onClick={handleSignOut} />
      </View>
    </ScrollView>
  );
}
