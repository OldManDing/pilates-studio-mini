import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { bookingsApi, type Booking } from '../../api/bookings';
import { membersApi, type Member, type Membership } from '../../api/members';
import { ensureMiniProgramAuth } from '../../api/auth';
import { AppButton, Empty, Loading, PageShell } from '../../components';
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
import { syncCustomTabBarSelected } from '../../utils/tabbar';
import { STORAGE_KEYS } from '../../constants/storage';
import { writeStorage } from '../../utils/storage';
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

function calculateMinutes(start?: string, end?: string) {
  if (!start || !end) {
    return 0;
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const diff = endTime - startTime;

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.round(diff / (1000 * 60));
}

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateLabel(dateString?: string) {
  if (!dateString) {
    return '--';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.getFullYear()}.${padNumber(date.getMonth() + 1)}.${padNumber(date.getDate())}`;
}

interface FetchProfileOptions {
  throwOnError?: boolean;
}

async function fetchAllMyBookings() {
  const pageSize = 50;
  const allBookings: Booking[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await bookingsApi.getMyBookings({ page: currentPage, limit: pageSize }, { showLoading: false });
    allBookings.push(...(response.data.bookings || []));
    totalPages = response.data.meta?.totalPages || (response.data.bookings?.length === pageSize ? currentPage + 1 : currentPage);
    currentPage += 1;
  } while (currentPage <= totalPages);

  return allBookings;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);

  useDidShow(() => {
    syncCustomTabBarSelected(2);
  });

  const fetchProfile = useCallback(async (options: FetchProfileOptions = {}) => {
    try {
      setLoading(true);

      const profileRes = await membersApi.getProfile({ showLoading: false });
      const nextMember = profileRes.data.member;

      setMember(nextMember);
      setProfileLoadFailed(false);
      if (nextMember) {
        writeStorage(STORAGE_KEYS.profile, {
          phone: getMaskedPhone(nextMember.phone),
          hasBoundPhone: Boolean(nextMember.phone),
        });
      }

      const [membershipsRes, bookingItems] = await Promise.all([
        membersApi.getMyMemberships({ showLoading: false })
          .catch(() => ({ data: { memberships: nextMember?.memberships || [] } })),
        fetchAllMyBookings().catch(() => []),
      ]);

      setMemberships(membershipsRes.data.memberships || nextMember?.memberships || []);
      setBookings(bookingItems);
    } catch {
      setProfileLoadFailed(true);
      Taro.showToast({ title: '加载失败', icon: 'none' });
      if (options.throwOnError) {
        throw new Error('个人资料同步失败');
      }
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
    const completedMinutes = bookings
      .filter((booking) => booking.status === 'COMPLETED')
      .reduce((sum, booking) => sum + calculateMinutes(booking.session?.startsAt, booking.session?.endsAt), 0);
    const totalBookings = bookings.length;
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
        value: member ? String(Math.round(completedMinutes / 60) || 0) : '--',
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
      membershipLabel: activeMembership ? 'ACTIVE MEMBERSHIP' : 'GUEST MODE',
      membershipTitle: activeMembership?.planName || '尚未开通会员',
      membershipDescription: activeMembership
        ? `${activeMembership.totalCredits <= 0 ? '无限次权益' : `剩余 ${activeMembership.remainingCredits}/${activeMembership.totalCredits} 次`} · 有效期至 ${formatDateLabel(activeMembership.endDate)}`
        : '登录后即可同步会员权益、课次余额与训练记录。',
      stats,
    };
  }, [activeMembership, bookings, member]);

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
          route: '/pages/training-records/index',
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
          route: '/pages/notifications/index',
        },
        {
          key: 'support',
          icon: 'support',
          label: '帮助与反馈',
          description: '常见问题与意见反馈',
          route: '/pages/help/index',
        },
        {
          key: 'settings',
          icon: 'settings',
          label: '设置',
          description: '账户安全与偏好设置',
          route: '/pages/settings/index',
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
    }
  };

  const handleLogin = async () => {
    if (loggingIn) {
      return;
    }

    try {
      setLoggingIn(true);
      await ensureMiniProgramAuth();
      await fetchProfile({ throwOnError: true });
      Taro.showToast({ title: '登录成功', icon: 'success' });
    } catch {
      Taro.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
    } finally {
      setLoggingIn(false);
    }
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
    Taro.removeStorageSync(STORAGE_KEYS.profile);
    setMember(null);
    setMemberships([]);
    setBookings([]);
    setProfileLoadFailed(false);
    Taro.showToast({ title: '已退出登录', icon: 'success' });
    Taro.switchTab({ url: '/pages/index/index' });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <PageShell className='profile-page' reserveTabBarSpace>
      <View className='profile-page__content'>
        <View className='profile-page__header'>
          <Text className='profile-page__eyebrow'>MY ACCOUNT</Text>
        </View>

        <ProfileAccountCard data={accountCardData} />

        {profileLoadFailed ? (
          <View className='profile-page__login-panel'>
            <Empty
              title='资料同步失败'
              description='当前网络或登录状态异常，请重新同步会员资料。'
              actionLabel='重新同步'
              onActionClick={() => fetchProfile()}
            />
          </View>
        ) : !member ? (
          <View className='profile-page__login-panel'>
            <Text className='profile-page__login-title'>登录同步会员资料</Text>
            <Text className='profile-page__login-desc'>使用微信登录后，可同步会员权益、预约记录和训练数据。</Text>
            <AppButton className='profile-page__login-button' size='large' loading={loggingIn} disabled={loggingIn} onClick={handleLogin}>
              {loggingIn ? '登录中...' : '微信登录'}
            </AppButton>
          </View>
        ) : null}

        {menuSections.map((section) => (
          <ProfileMenuSection key={section.key} data={section} onItemClick={handleMenuClick} />
        ))}

        {member ? <ProfileSignOutButton data={signOutData} onClick={handleSignOut} /> : null}
      </View>
    </PageShell>
  );
}
