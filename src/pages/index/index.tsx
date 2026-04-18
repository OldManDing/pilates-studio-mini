import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { Loading, PageShell, SectionTitle } from '../../components';
import { bookingsApi, type Booking } from '../../api/bookings';
import { coursesApi, type Course } from '../../api/courses';
import { membersApi, type Member, type Membership } from '../../api/members';
import HomeCuratedCard from './components/HomeCuratedCard';
import HomeHero from './components/HomeHero';
import HomeMembershipCard from './components/HomeMembershipCard';
import HomeMonthlySummary from './components/HomeMonthlySummary';
import HomeServiceBand from './components/HomeServiceBand';
import HomeStudioCard from './components/HomeStudioCard';
import HomeTodayCourseCard from './components/HomeTodayCourseCard';
import HomeUpcomingList from './components/HomeUpcomingList';
import type {
  HomeCuratedData,
  HomeHeroData,
  HomeMembershipData,
  HomeMonthlySummaryData,
  HomeServiceItemData,
  HomeStudioData,
  HomeTodayCourseData,
  HomeUpcomingItemData,
} from './components/types';
import './index.scss';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const ACTIVE_BOOKING_STATUSES: Booking['status'][] = ['PENDING', 'CONFIRMED'];

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function formatShellDate(date: Date) {
  return `${date.getFullYear()} · ${padNumber(date.getMonth() + 1)} · ${padNumber(date.getDate())} ${WEEKDAY_LABELS[date.getDay()]}`;
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚上好';
}

function getDisplayMemberName(name?: string | null) {
  if (!name) {
    return '林女士';
  }

  if (name.endsWith('女士') || name.endsWith('先生') || name.endsWith('小姐')) {
    return name;
  }

  return `${name}女士`;
}

function getRemainingDays(endDate?: string) {
  if (!endDate) {
    return '--天';
  }

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) {
    return '--天';
  }

  const diff = end.getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return `${days}天`;
}

function formatDateLabel(dateString?: string) {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '--';
  return `${date.getFullYear()}.${padNumber(date.getMonth() + 1)}.${padNumber(date.getDate())}`;
}

function formatClock(dateString?: string) {
  if (!dateString) return '--:--';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '--:--';
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function formatTimeRange(start?: string, end?: string) {
  return `${formatClock(start)} – ${formatClock(end)}`;
}

function calculateMinutes(start?: string, end?: string) {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const diff = endTime - startTime;
  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Math.round(diff / (1000 * 60));
}

function getRemainingRatio(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return '0%';
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const total = end - start;
  const remaining = end - Date.now();
  if (Number.isNaN(total) || total <= 0) return '0%';
  return `${Math.max(0, Math.min(100, Math.round((remaining / total) * 100)))}%`;
}

function getMembershipStatus(membership?: Membership | null) {
  return membership?.isActive ? '已生效' : '待开通';
}

function getMembershipDescription(membership?: Membership | null) {
  if (!membership) return '当前还没有已生效会员卡，可先保留视觉卡位等待后续接入。';
  return `${membership.planName || '会员卡'} 当前剩余 ${membership.remainingCredits}/${membership.totalCredits} 次，可继续安排训练。`;
}

function getTodayCourseSummary(todayBooking: Booking | null, activeMembership: Membership | null) {
  if (todayBooking) {
    return {
      heroSubtitle: '今日已安排 1 节课程',
      courseLabel: 'TODAY COURSE',
      courseStatus: todayBooking.status === 'PENDING' ? '待确认' : '已为你留位',
      courseSubtitle: '今日训练安排',
      note: '到店前 15 分钟签到，课程结束后可直接续约下一节同主题训练。',
    };
  }

  if (activeMembership) {
    return {
      heroSubtitle: `${activeMembership.planName || '会员权益'} 已生效`,
      courseLabel: 'NEXT COURSE',
      courseStatus: '下一节待安排',
      courseSubtitle: '近期最近可预约场次',
      note: '今天还没有预约课程，可先浏览课程页，选择适合当前节奏的下一节训练。',
    };
  }

  return {
    heroSubtitle: '从一节舒展课程开始今天的练习。',
    courseLabel: 'COURSE PICK',
    courseStatus: '等待预约',
    courseSubtitle: '推荐你先完成第一节体验课',
    note: '还没有会员与预约记录，先从课程页选择一节入门课程开启练习。',
  };
}

function isUpcomingBooking(booking: Booking) {
  if (!booking.session?.startsAt) return false;
  return ACTIVE_BOOKING_STATUSES.includes(booking.status) && new Date(booking.session.startsAt).getTime() >= Date.now();
}

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useShareAppMessage(() => ({
    title: 'Pilates Studio - 专业普拉提工作室',
    path: '/pages/index/index',
  }));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, membershipsRes, bookingsRes, coursesRes] = await Promise.all([
        membersApi.getProfile({ showLoading: false }).catch(() => ({ data: { member: null as Member | null } })),
        membersApi.getMyMemberships({ showLoading: false }).catch(() => ({ data: { memberships: [] as Membership[] } })),
        bookingsApi.getMyBookings({ page: 1, limit: 20 }, { showLoading: false }).catch(() => ({ data: { bookings: [] as Booking[] } })),
        coursesApi.getAll({ page: 1, limit: 6, isActive: true }, { showLoading: false }).catch(() => ({ data: { courses: [] as Course[] } })),
      ]);

      setMember(profileRes.data.member);
      setMemberships(membershipsRes.data.memberships || []);
      setBookings(bookingsRes.data.bookings || []);
      setCourses(coursesRes.data.courses || []);
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
      console.error('Failed to fetch home shell data:', error);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePullDownRefresh(() => {
    fetchData();
  });

  const serviceItems: HomeServiceItemData[] = [
    {
      key: 'booking',
      accent: 'mint',
      label: '预约课程',
      subtitle: 'BOOKING',
      description: '快速进入课程页',
    },
    {
      key: 'records',
      accent: 'violet',
      label: '训练记录',
      subtitle: 'RECORD',
      description: '查看近期安排',
    },
    {
      key: 'membership',
      accent: 'orange',
      label: '我的教练',
      subtitle: 'COACH',
      description: '查看会员与教练信息',
    },
    {
      key: 'courses',
      accent: 'pink',
      label: '课程表',
      subtitle: 'SCHEDULE',
      description: '进入课程安排',
    },
  ];

  const now = new Date('2026-01-06T09:00:00');
  const activeMembership = memberships.find((membership) => membership.isActive) || null;
  const upcomingBookings = bookings
    .filter((booking) => isUpcomingBooking(booking) && booking.session)
    .sort((left, right) => new Date(left.session!.startsAt).getTime() - new Date(right.session!.startsAt).getTime());
  const curatedCourse = courses[0] || null;

  const heroData: HomeHeroData = {
    dateLabel: '2026 · 01 · 06 MON',
    badgeLabel: 'GOLD',
    badgeTone: 'accent',
    title: '早安，林女士',
    subtitle: '今日已安排 1 节课程',
  };

  const membershipData: HomeMembershipData = {
    label: 'MEMBERSHIP',
    status: '详情',
    planName: '',
    description: '查看当前会员权益、有效期与课程使用进度',
    primaryMetricLabel: '有效期至',
    primaryMetricValue: '2026.12.31',
    secondaryMetricLabel: '课程权益',
    secondaryMetricValue: '无限次',
    progressLabel: '',
    progressValue: '271天',
    progressPercent: 75,
    primaryAction: '立即预约课程',
    secondaryAction: '改约',
  };

  const todayCourseData: HomeTodayCourseData = {
    label: '',
    status: '',
    headerStatus: '已预约',
    subtitle: '',
    timeRange: '14:00 – 15:30',
    duration: '90min',
    title: '流瑜伽进阶',
    meta: '林静怡教练 · 朝阳门店',
    note: '',
    primaryAction: '查看详情',
    secondaryAction: '改约',
  };

  const monthlySummaryData: HomeMonthlySummaryData = {
    label: 'SESSIONS',
    value: '12',
    unit: '次',
    description: '本月训练概览',
    progressText: '月度目标完成 75%',
    sideItems: [
      {
        key: 'duration',
        label: '时长',
        value: '18',
        unit: 'h',
        detail: '',
      },
      {
        key: 'focus',
        label: '连续',
        value: '7',
        unit: 'd',
        detail: '',
      },
    ],
  };

  const curatedData: HomeCuratedData = {
    eyebrow: 'CURATED',
    caption: '明日 18:30 · 50min',
    title: '普拉提塑形 · 核心进阶',
    description: '',
    meta: '陈思雨教练 · 朝阳门店',
    cta: '预约',
    monogram: '',
    imageUrl: 'https://images.unsplash.com/photo-1771270786606-f5a0e57db762?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwc3R1ZGlvJTIwbWluaW1hbHxlbnwxfHx8fDE3NzUzNzczNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    fallbackImageUrl: '/assets/ui/home-curated.svg',
  };

  const upcomingItems: HomeUpcomingItemData[] = [
    {
      key: 'booking-1',
      day: '07',
      weekday: 'TUE',
      label: '明日',
      title: '哈他瑜伽',
      description: '',
      meta: '王梦瑶 · 16:00 · 60min',
      routeUrl: '/pages/course-detail/index?id=3',
    },
    {
      key: 'booking-2',
      day: '08',
      weekday: 'WED',
      label: '',
      title: '冥想疗愈',
      description: '',
      meta: '张悦欣 · 19:30 · 45min',
      routeUrl: '/pages/course-detail/index?id=4',
    },
  ];

  const studioData: HomeStudioData = {
    label: 'YOUR STUDIO',
    name: '朝阳门店',
    address: '朝阳区建国门外大街 1 号',
    hours: '营业时间 08:00 – 22:00',
    note: '',
    actionLabel: '导航前往',
  };

  const handleMembershipPrimary = () => {
    Taro.navigateTo({ url: '/pages/membership/index' });
  };

  const handleCoursesEntry = () => {
    Taro.switchTab({ url: '/pages/courses/index' });
  };

  const handleBookingsEntry = () => {
    Taro.navigateTo({ url: '/pages/my-bookings/index' });
  };

  const handleServiceClick = (key: HomeServiceItemData['key']) => {
    switch (key) {
      case 'booking':
      case 'courses':
        handleCoursesEntry();
        break;
      case 'membership':
        handleMembershipPrimary();
        break;
      case 'records':
        handleBookingsEntry();
        break;
      default:
        break;
    }
  };

  const handleStudioClick = () => {
    Taro.showToast({ title: '静态壳阶段，地图稍后接入', icon: 'none' });
  };

  const handleUpcomingItemClick = (item: HomeUpcomingItemData) => {
    if (item.routeUrl) {
      Taro.navigateTo({ url: item.routeUrl });
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <PageShell className='home-page' reserveTabBarSpace>
      <View className='home-page__content'>
        <HomeHero data={heroData} />

        <View className='home-page__section'>
          <HomeMembershipCard
            data={membershipData}
            onPrimaryClick={handleMembershipPrimary}
            onDetailClick={handleMembershipPrimary}
          />
        </View>

        <View className='home-page__section'>
          <View className='home-page__today-header'>
            <Text className='home-page__today-title'>今日课程</Text>
            <View className='home-page__today-status'>
              <View className='home-page__today-status-dot' />
              <Text className='home-page__today-status-text'>{todayCourseData.headerStatus}</Text>
            </View>
          </View>
          <HomeTodayCourseCard
            data={todayCourseData}
            onPrimaryClick={handleBookingsEntry}
            onSecondaryClick={handleCoursesEntry}
          />
        </View>

        <View className='home-page__section'>
          <HomeServiceBand items={serviceItems} onItemClick={handleServiceClick} />
        </View>

        <View className='home-page__section'>
          <SectionTitle
            title='本月训练'
          />
          <HomeMonthlySummary data={monthlySummaryData} />
        </View>

        <View className='home-page__section'>
          <SectionTitle
            title='精选推荐'
            actionLabel='CURATED'
            actionTone='muted'
          />
          <HomeCuratedCard data={curatedData} onClick={handleCoursesEntry} />
        </View>

        <View className='home-page__section'>
          <SectionTitle
            title='近期安排'
            actionLabel='全部'
            actionTone='muted'
            actionIcon='chevron-right'
            onActionClick={handleBookingsEntry}
          />
          <HomeUpcomingList data={upcomingItems} onItemClick={handleUpcomingItemClick} />
        </View>

        <View className='home-page__section home-page__section--studio'>
          <HomeStudioCard data={studioData} onClick={handleStudioClick} />
        </View>
      </View>
    </PageShell>
  );
}
