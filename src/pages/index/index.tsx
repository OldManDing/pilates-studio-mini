import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
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
import { syncCustomTabBarSelected } from '../../utils/tabbar';
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

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
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

function formatDurationLabel(start?: string, end?: string, fallback = '--min') {
  const duration = calculateMinutes(start, end);
  return duration > 0 ? `${duration}min` : fallback;
}

function formatRelativeDayLabel(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '明日';
  return '';
}

function getUpcomingDay(dateString?: string) {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '--';
  return padNumber(date.getDate());
}

function getUpcomingWeekday(dateString?: string) {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '--';
  return WEEKDAY_LABELS[date.getDay()];
}

function toHomeUpcomingItem(booking: Booking, index: number): HomeUpcomingItemData {
  const startsAt = booking.session?.startsAt;
  const endsAt = booking.session?.endsAt;
  const duration = calculateMinutes(startsAt, endsAt);
  const courseId = booking.session?.course?.id;

  return {
    key: booking.id || `booking-${index}`,
    day: getUpcomingDay(startsAt),
    weekday: getUpcomingWeekday(startsAt),
    label: formatRelativeDayLabel(startsAt),
    title: booking.session?.course?.name || '课程安排',
    description: '',
    meta: `${booking.session?.coach?.name || '教练待定'} · ${formatClock(startsAt)} · ${duration > 0 ? duration : '--'}min`,
    routeUrl: courseId ? `/pages/course-detail/index?id=${courseId}` : undefined,
  };
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
  if (membership.totalCredits <= 0) return `${membership.planName || '会员卡'} 当前权益为无限次，可继续安排训练。`;
  return `${membership.planName || '会员卡'} 当前剩余 ${membership.remainingCredits}/${membership.totalCredits} 次，可继续安排训练。`;
}

function getMembershipCreditsText(membership?: Membership | null) {
  if (!membership) return '--';
  if (membership.totalCredits <= 0) return '无限次';
  return `${membership.remainingCredits}/${membership.totalCredits}次`;
}

function getMembershipProgressPercent(membership?: Membership | null) {
  if (!membership) return 75;
  const ratio = Number.parseInt(getRemainingRatio(membership.startDate, membership.endDate), 10);
  return Number.isNaN(ratio) ? 0 : ratio;
}

function getBookingDisplayName(booking?: Booking | null) {
  return booking?.session?.course?.name || '今天还没有预约课程';
}

function getBookingDisplayMeta(booking?: Booking | null) {
  if (!booking?.session) return '可前往课程页选择适合的训练';
  return `${booking.session.coach?.name || '教练待定'} · 朝阳门店`;
}

function getCourseDisplayMeta(course?: Course | null) {
  if (!course) return '课程内容更新中';
  return `${course.coach?.name || '教练待定'} · 朝阳门店`;
}

function getCourseCaption(course?: Course | null) {
  if (!course) return 'COURSE UPDATE';
  const duration = course.durationMinutes > 0 ? `${course.durationMinutes}min` : '时长待定';
  return `${course.level || '适合你的训练'} · ${duration}`;
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

  useDidShow(() => {
    syncCustomTabBarSelected(0);
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, membershipsRes, bookingsRes, coursesRes] = await Promise.all([
        membersApi.getProfile({ showLoading: false }).catch(() => ({ data: { member: null as Member | null } })),
        membersApi.getMyMemberships({ showLoading: false }).catch(() => ({ data: { memberships: [] as Membership[] } })),
        fetchAllMyBookings().then((items) => ({ data: { bookings: items } })).catch(() => ({ data: { bookings: [] as Booking[] } })),
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
      key: 'coaches',
      accent: 'orange',
      label: '我的教练',
      subtitle: 'COACH',
      description: '查看常用教练',
    },
    {
      key: 'courses',
      accent: 'pink',
      label: '课程表',
      subtitle: 'SCHEDULE',
      description: '进入课程安排',
    },
  ];

  const now = new Date();
  const activeMembership = memberships.find((membership) => membership.isActive) || null;
  const upcomingBookings = bookings
    .filter((booking) => isUpcomingBooking(booking) && booking.session)
    .sort((left, right) => new Date(left.session?.startsAt || '').getTime() - new Date(right.session?.startsAt || '').getTime());
  const todayBooking = upcomingBookings.find((booking) => {
    const startsAt = booking.session?.startsAt;
    if (!startsAt) return false;
    const startsAtDate = new Date(startsAt);
    if (Number.isNaN(startsAtDate.getTime())) return false;
    return isSameDay(startsAtDate, now);
  }) || null;
  const completedThisMonth = bookings.filter((booking) => {
    const startsAt = booking.session?.startsAt;
    if (booking.status !== 'COMPLETED' || !startsAt) return false;
    const startsAtDate = new Date(startsAt);
    if (Number.isNaN(startsAtDate.getTime())) return false;
    return isSameMonth(startsAtDate, now);
  });
  const completedMinutes = completedThisMonth.reduce((total, booking) => total + calculateMinutes(booking.session?.startsAt, booking.session?.endsAt), 0);
  const monthlySessions = completedThisMonth.length;
  const monthlyHours = Math.round(completedMinutes / 60);
  const monthlyGoalPercent = Math.min(100, Math.round((monthlySessions / 16) * 100));
  const curatedCourse = courses[0] || null;
  const todayCourseSummary = getTodayCourseSummary(todayBooking, activeMembership);

  const heroData: HomeHeroData = {
    dateLabel: formatShellDate(now),
    badgeLabel: 'GOLD',
    badgeTone: 'accent',
    title: `${getGreeting(now)}，${getDisplayMemberName(member?.name)}`,
    subtitle: todayCourseSummary.heroSubtitle,
  };

  const membershipData: HomeMembershipData = {
    label: 'MEMBERSHIP',
    status: activeMembership ? '详情' : getMembershipStatus(activeMembership),
    planName: activeMembership?.planName || '',
    description: getMembershipDescription(activeMembership),
    primaryMetricLabel: '有效期至',
    primaryMetricValue: activeMembership ? formatDateLabel(activeMembership.endDate) : '--.--.--',
    secondaryMetricLabel: '课程权益',
    secondaryMetricValue: getMembershipCreditsText(activeMembership),
    progressLabel: '',
    progressValue: activeMembership ? getRemainingDays(activeMembership.endDate) : '--天',
    progressPercent: getMembershipProgressPercent(activeMembership),
    primaryAction: '立即预约课程',
    secondaryAction: '改约',
  };

  const todayCourseData: HomeTodayCourseData = {
    label: todayBooking ? todayCourseSummary.courseLabel : '',
    status: '',
    headerStatus: todayCourseSummary.courseStatus,
    subtitle: todayBooking ? todayCourseSummary.courseSubtitle : '',
    timeRange: todayBooking ? formatTimeRange(todayBooking.session?.startsAt, todayBooking.session?.endsAt) : '--:-- – --:--',
    duration: todayBooking ? formatDurationLabel(todayBooking.session?.startsAt, todayBooking.session?.endsAt) : '待安排',
    title: getBookingDisplayName(todayBooking),
    meta: getBookingDisplayMeta(todayBooking),
    note: todayBooking ? todayCourseSummary.note : '',
    primaryAction: '查看详情',
    secondaryAction: '改约',
  };

  const monthlySummaryData: HomeMonthlySummaryData = {
    label: 'SESSIONS',
    value: String(monthlySessions),
    unit: '次',
    description: '本月训练概览',
    progressText: `月度目标完成 ${monthlyGoalPercent}%`,
    sideItems: [
      {
        key: 'duration',
        label: '时长',
        value: String(monthlyHours),
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
    caption: getCourseCaption(curatedCourse),
    title: curatedCourse?.name || '暂无推荐课程',
    description: '',
    meta: getCourseDisplayMeta(curatedCourse),
    cta: '预约',
    monogram: '',
    imageUrl: '/assets/ui/booking-pilates.svg',
    fallbackImageUrl: '/assets/ui/home-curated.svg',
  };

  const upcomingItems = upcomingBookings.slice(0, 2).map(toHomeUpcomingItem);

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
      case 'coaches':
        Taro.navigateTo({ url: '/pages/my-coaches/index' });
        break;
      case 'records':
        Taro.navigateTo({ url: '/pages/training-records/index' });
        break;
      default:
        break;
    }
  };

  const handleStudioClick = () => {
    Taro.openLocation({
      latitude: 39.9242,
      longitude: 116.4335,
      name: 'Pilates Studio 朝阳门店',
      address: '北京市朝阳区朝阳门外大街 88 号',
      scale: 16,
    });
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
