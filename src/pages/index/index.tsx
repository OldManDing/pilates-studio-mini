import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
import { ScrollView, View } from '@tarojs/components';
import { Loading } from '../../components';
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
        membersApi.getProfile().catch(() => ({ data: { member: null as Member | null } })),
        membersApi.getMyMemberships().catch(() => ({ data: { memberships: [] as Membership[] } })),
        bookingsApi.getMyBookings({ page: 1, limit: 20 }).catch(() => ({ data: { bookings: [] as Booking[] } })),
        coursesApi.getAll({ page: 1, limit: 6, isActive: true }).catch(() => ({ data: { courses: [] as Course[] } })),
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
      subtitle: 'BOOK',
      description: '快速进入课程页',
    },
    {
      key: 'membership',
      accent: 'violet',
      label: '会员权益',
      subtitle: 'MEMBER',
      description: '查看卡项与余额',
    },
    {
      key: 'records',
      accent: 'orange',
      label: '预约记录',
      subtitle: 'PLAN',
      description: '查看近期安排',
    },
    {
      key: 'courses',
      accent: 'pink',
      label: '精选课程',
      subtitle: 'CURATE',
      description: '进入内容推荐',
    },
  ];

  const now = new Date();
  const activeMembership = memberships.find((membership) => membership.isActive) || null;
  const upcomingBookings = bookings
    .filter((booking) => isUpcomingBooking(booking) && booking.session)
    .sort((left, right) => new Date(left.session!.startsAt).getTime() - new Date(right.session!.startsAt).getTime());
  const todayBooking = upcomingBookings.find((booking) => booking.session && new Date(booking.session.startsAt).toDateString() === now.toDateString()) || upcomingBookings[0] || null;
  const monthCompleted = bookings.filter((booking) => booking.status === 'COMPLETED' && booking.session?.startsAt && new Date(booking.session.startsAt).getMonth() === now.getMonth());
  const monthMinutes = monthCompleted.reduce((sum, booking) => sum + calculateMinutes(booking.session?.startsAt, booking.session?.endsAt), 0);
  const curatedCourse = courses[0] || null;

  const heroData: HomeHeroData = {
    dateLabel: formatShellDate(now),
    badgeLabel: 'GOLD',
    title: `${getGreeting(now)}，${member?.name || '欢迎回来'}`,
    subtitle: todayBooking ? '今日已安排 1 节课程' : activeMembership ? `${activeMembership.planName || '会员权益'} 已生效` : '从一节舒展课程开始今天的练习。',
  };

  const membershipData: HomeMembershipData = {
    label: 'MEMBERSHIP',
    status: getMembershipStatus(activeMembership),
    planName: activeMembership?.planName || '尚未开通会员',
    description: getMembershipDescription(activeMembership),
    primaryMetricLabel: '剩余课次',
    primaryMetricValue: activeMembership ? String(activeMembership.remainingCredits) : '0',
    secondaryMetricLabel: '有效期至',
    secondaryMetricValue: formatDateLabel(activeMembership?.endDate),
    progressLabel: '当前训练周期',
    progressValue: getRemainingRatio(activeMembership?.startDate, activeMembership?.endDate),
    primaryAction: '查看会员权益',
    secondaryAction: '预约下一节',
  };

  const todayCourseData: HomeTodayCourseData = {
    label: 'TODAY COURSE',
    status: todayBooking?.status === 'PENDING' ? '待确认' : '已为你留位',
    timeRange: formatTimeRange(todayBooking?.session?.startsAt, todayBooking?.session?.endsAt),
    duration: `${calculateMinutes(todayBooking?.session?.startsAt, todayBooking?.session?.endsAt) || 55} min`,
    title: todayBooking?.session?.course?.name || curatedCourse?.name || '今日暂未预约课程',
    meta: `${todayBooking?.session?.coach?.name || curatedCourse?.coach?.name || '教练待定'} 教练 · 朝阳门店`,
    note: todayBooking ? '到店前 15 分钟签到，课程结束后可直接续约下一节同主题训练。' : '可先浏览课程页，选择适合今天节奏的课程。',
    primaryAction: '查看预约详情',
    secondaryAction: '进入预约页',
  };

  const monthlySummaryData: HomeMonthlySummaryData = {
    label: 'THIS MONTH',
    value: String(monthCompleted.length),
    unit: '节',
    description: '本月训练已经形成稳定节奏，首页壳层把主指标放大，右侧只保留两组辅助信息。',
    progressText: `月度节奏完成 ${Math.min(100, monthCompleted.length * 12)}%`,
    sideItems: [
      {
        key: 'duration',
        label: '训练时长',
        value: String(Math.round(monthMinutes / 60) || 0),
        unit: 'h',
        detail: '保持轻量但连续',
      },
      {
        key: 'focus',
        label: '本周重点',
        value: String(Math.min(7, upcomingBookings.length)),
        unit: 'd',
        detail: '核心稳定 / 脊柱延展',
      },
    ],
  };

  const curatedData: HomeCuratedData = {
    eyebrow: 'EDITOR’S PICK',
    caption: 'CURATED FOR TODAY',
    title: curatedCourse?.name || 'Reformer Reset Session',
    description: curatedCourse?.description || '把今日推荐做成更像内容编辑位的静态卡，而不是旧首页那种偏数据块的课程组件。',
    meta: `${curatedCourse?.type || 'PILATES'} · ${curatedCourse?.level || 'BEGINNER'} · ${curatedCourse?.durationMinutes || 55} min`,
    cta: '查看课程',
    monogram: 'RR',
  };

  const upcomingItems: HomeUpcomingItemData[] = (upcomingBookings.slice(0, 3).map((booking, index) => {
    const startsAt = booking.session?.startsAt || '';
    const date = startsAt ? new Date(startsAt) : now;
    return {
      key: booking.id,
      day: padNumber(date.getDate()),
      weekday: WEEKDAY_LABELS[date.getDay()],
      label: index === 0 ? 'NEXT' : index === 1 ? 'WEEK' : 'PLAN',
      title: booking.session?.course?.name || '预约课程',
      description: `${booking.session?.coach?.name || '教练待定'} 教练 · 朝阳门店`,
      meta: `${formatTimeRange(booking.session?.startsAt, booking.session?.endsAt)} · ${calculateMinutes(booking.session?.startsAt, booking.session?.endsAt)} min`,
    };
  })) || [];

  const studioData: HomeStudioData = {
    label: 'YOUR STUDIO',
    name: '朝阳门店',
    address: '朝阳区建国门外大街 1 号',
    hours: '营业时间 08:00 – 22:00',
    note: '当前阶段保留门店信息位，后续可接入真实门店与地图信息。',
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

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView className='home-shell' scrollY enhanced showScrollbar={false}>
      <View className='home-shell__content'>
        <HomeHero data={heroData} />

        <HomeMembershipCard
          data={membershipData}
          onPrimaryClick={handleMembershipPrimary}
          onSecondaryClick={handleCoursesEntry}
        />

        <HomeTodayCourseCard
          data={todayCourseData}
          onPrimaryClick={handleBookingsEntry}
          onSecondaryClick={handleCoursesEntry}
        />

        <HomeServiceBand items={serviceItems} onItemClick={handleServiceClick} />

        <HomeMonthlySummary data={monthlySummaryData} />

        <HomeCuratedCard data={curatedData} onClick={handleCoursesEntry} />

        <HomeUpcomingList data={upcomingItems} onMoreClick={handleBookingsEntry} />

        <HomeStudioCard data={studioData} onClick={handleStudioClick} />
      </View>
    </ScrollView>
  );
}
