import { useCallback, useEffect, useRef, useState } from 'react';
import Taro, { useDidShow, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { Loading, PageShell, SectionTitle } from '../../components';
import { bookingsApi, type Booking } from '../../api/bookings';
import { coursesApi, type Course } from '../../api/courses';
import { membersApi, type Member, type Membership } from '../../api/members';
import { settingsApi, type StudioSettings } from '../../api/settings';
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
import { formatMembershipCredits, formatMembershipDescription } from '../../utils/membership';
import { formatDurationMinutes, getSafeMiniImageSrc, getWeekdayLabel } from '../../utils/ui';
import { useMiniPageImage } from '../../hooks/useMiniPageImage';
import { STORAGE_KEYS } from '../../constants/storage';
import './index.scss';

const ACTIVE_BOOKING_STATUSES: Booking['status'][] = ['PENDING', 'CONFIRMED'];
const BOOKING_STATUS_LABEL_MAP: Record<Booking['status'], string> = {
  PENDING: '待确认',
  CONFIRMED: '已预约',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未到场',
};

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function formatShellDate(date: Date) {
  return `${date.getFullYear()}年${padNumber(date.getMonth() + 1)}月${padNumber(date.getDate())}日 ${getWeekdayLabel(date)}`;
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚上好';
}

function getDisplayMemberName(name?: string | null) {
  if (!name) {
    return '访客';
  }

  return name;
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

function formatDurationLabel(start?: string, end?: string, fallback = '时长待定') {
  const duration = calculateMinutes(start, end);
  return formatDurationMinutes(duration, fallback);
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
  return getWeekdayLabel(date);
}

function formatRefreshTime(date: Date) {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
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
    meta: `${booking.session?.coach?.name || '教练待定'} · ${formatClock(startsAt)} · ${formatDurationMinutes(duration)}`,
    routeUrl: courseId ? `/pages/course-detail/index?id=${courseId}` : undefined,
  };
}

function toHomeRecentItem(booking: Booking, index: number): HomeUpcomingItemData {
  const startsAt = booking.session?.startsAt;
  const endsAt = booking.session?.endsAt;
  const duration = calculateMinutes(startsAt, endsAt);
  const courseId = booking.session?.course?.id;

  return {
    key: booking.id || `recent-booking-${index}`,
    day: getUpcomingDay(startsAt),
    weekday: getUpcomingWeekday(startsAt),
    label: BOOKING_STATUS_LABEL_MAP[booking.status],
    title: booking.session?.course?.name || '课程安排',
    description: '',
    meta: `${booking.session?.coach?.name || '教练待定'} · ${formatClock(startsAt)} · ${formatDurationMinutes(duration)}`,
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
  if (!membership) return '当前还没有已生效会员卡，可前往会员中心选择适合的训练方案。';
  return formatMembershipDescription(membership);
}

function calculateDurationDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = end - start;

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getMembershipCreditsText(membership?: Membership | null) {
  if (!membership) return '--';
  return formatMembershipCredits(membership);
}

function getMembershipProgressPercent(membership?: Membership | null) {
  if (!membership) return 75;
  const ratio = Number.parseInt(getRemainingRatio(membership.startDate, membership.endDate), 10);
  return Number.isNaN(ratio) ? 0 : ratio;
}

function getBookingDisplayName(booking?: Booking | null) {
  return booking?.session?.course?.name || '今天还没有预约课程';
}

function getBookingDisplayMeta(booking?: Booking | null, studioName?: string) {
  if (!booking?.session) return '可前往课程页选择适合的训练';
  return `${booking.session.coach?.name || '教练待定'} · ${studioName || '门店待更新'}`;
}

function getCourseDisplayMeta(course?: Course | null, studioName?: string) {
  if (!course) return '课程内容更新中';
  return `${course.coach?.name || '教练待定'} · ${studioName || '门店待更新'}`;
}

function getCourseCaption(course?: Course | null) {
  if (!course) return '课程更新';
  const duration = formatDurationMinutes(course.durationMinutes);
  return `${course.level || '适合你的训练'} · ${duration}`;
}

function getTodayCourseSummary(todayBooking: Booking | null, activeMembership: Membership | null) {
  if (todayBooking) {
    return {
      heroSubtitle: '今日已安排 1 节课程',
      courseLabel: '今日课程',
      courseStatus: todayBooking.status === 'PENDING' ? '待确认' : '已为你留位',
      courseSubtitle: '今日训练安排',
      note: '到店前 15 分钟签到，课程结束后可直接续约下一节同主题训练。',
    };
  }

  if (activeMembership) {
    return {
      heroSubtitle: `${activeMembership.planName || '会员权益'} 已生效`,
      courseLabel: '下一节课程',
      courseStatus: '下一节待安排',
      courseSubtitle: '近期最近可预约场次',
      note: '今天还没有预约课程，可先浏览课程页，选择适合当前节奏的下一节训练。',
    };
  }

  return {
    heroSubtitle: '从一节舒展课程开始今天的练习。',
    courseLabel: '课程推荐',
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
  const { imageSrc: homeHeroImageSrc, fallbackImageSrc: homeHeroFallbackImageSrc, refresh: refreshHomeHeroImage } = useMiniPageImage('home', '/assets/ui/hero-studio.jpg');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [lastRefreshLabel, setLastRefreshLabel] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
  const initialFetchCompletedRef = useRef(false);
  const refreshGuideCheckedRef = useRef(false);

  useShareAppMessage(() => ({
    title: '愈己CareMe工作室｜专业训练预约',
    path: '/pages/index/index',
  }));

  useDidShow(() => {
    syncCustomTabBarSelected(0);
    void refreshHomeHeroImage();

    if (initialFetchCompletedRef.current) {
      void fetchData('resume');
    }
  });

  const fetchData = useCallback(async (source: 'initial' | 'pull' | 'manual' | 'resume' = 'initial') => {
    try {
      if (source === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [profileRes, membershipsRes, bookingsRes, coursesRes, studioRes] = await Promise.allSettled([
        membersApi.getProfile({ showLoading: false }),
        membersApi.getMyMemberships({ showLoading: false }),
        fetchAllMyBookings().then((items) => ({ data: { bookings: items } })),
        coursesApi.getAll({ page: 1, limit: 6, isActive: true }, { showLoading: false }),
        settingsApi.getStudio(),
      ]);

      const hasFailedSection = [profileRes, membershipsRes, bookingsRes, coursesRes, studioRes].some((result) => result.status === 'rejected');

      setLoadFailed(hasFailedSection);
      setMember(profileRes.status === 'fulfilled' ? profileRes.value.data.member : null);
      setMemberships(membershipsRes.status === 'fulfilled' ? membershipsRes.value.data.memberships || [] : []);
      setBookings(bookingsRes.status === 'fulfilled' ? bookingsRes.value.data.bookings || [] : []);
      setCourses(coursesRes.status === 'fulfilled' ? coursesRes.value.data.courses || [] : []);
      setStudioSettings(studioRes.status === 'fulfilled' ? studioRes.value.data : null);

      if (source === 'pull' || source === 'manual') {
        setLastRefreshLabel(formatRefreshTime(new Date()));
        Taro.showToast({
          title: hasFailedSection ? '已刷新，部分内容未同步' : '页面已刷新',
          icon: 'none',
        });
      } else if (source === 'resume') {
        setLastRefreshLabel(formatRefreshTime(new Date()));
      }
    } catch {
      setLoadFailed(true);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      if (source === 'initial') {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
      initialFetchCompletedRef.current = true;
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    void fetchData('initial');
  }, [fetchData]);

  useEffect(() => {
    if (loading || refreshGuideCheckedRef.current) {
      return;
    }

    refreshGuideCheckedRef.current = true;

    if (Taro.getStorageSync(STORAGE_KEYS.homeRefreshGuideShown)) {
      return;
    }

    Taro.setStorageSync(STORAGE_KEYS.homeRefreshGuideShown, true);
    Taro.showModal({
      title: '页面刷新提示',
      content: '首页支持下拉刷新。需要同步课程、会员或预约信息时，请在首页向下滑动，系统会自动获取最新内容。',
      confirmText: '知道了',
      showCancel: false,
    });
  }, [loading]);

  usePullDownRefresh(() => {
    void fetchData('pull');
  });

  const serviceItems: HomeServiceItemData[] = [
    {
      key: 'booking',
      accent: 'mint',
      label: '预约课程',
      subtitle: '快速预约',
      description: '快速进入课程页',
    },
    {
      key: 'records',
      accent: 'violet',
      label: '训练记录',
      subtitle: '训练记录',
      description: '查看近期安排',
    },
    {
      key: 'coaches',
      accent: 'orange',
      label: '我的教练',
      subtitle: '教练',
      description: '查看常用教练',
    },
    {
      key: 'courses',
      accent: 'pink',
      label: '课程表',
      subtitle: '课表',
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
  const activeMembershipDurationDays = calculateDurationDays(activeMembership?.startDate, activeMembership?.endDate);
  const membershipDerivedMonthlyGoal = activeMembership && activeMembership.totalCredits > 0 && activeMembershipDurationDays > 0
    ? Math.max(1, Math.round((activeMembership.totalCredits / activeMembershipDurationDays) * 30))
    : 16;
  const monthlyGoalPercent = Math.min(100, Math.round((monthlySessions / membershipDerivedMonthlyGoal) * 100));
  const curatedCourse = courses[0] || null;
  const todayCourseSummary = getTodayCourseSummary(todayBooking, activeMembership);
  const studioName = studioSettings?.studioName?.trim() || '门店待更新';
  const studioAddress = studioSettings?.address?.trim() || '地址待更新';
  const studioBusinessHours = studioSettings?.businessHours?.trim() || '';

  const heroData: HomeHeroData = {
    dateLabel: formatShellDate(now),
    badgeLabel: activeMembership ? '会员' : '访客',
    badgeTone: activeMembership ? 'accent' : 'muted',
    title: `${getGreeting(now)}，${getDisplayMemberName(member?.name)}`,
    subtitle: todayCourseSummary.heroSubtitle,
    imageUrl: getSafeMiniImageSrc(homeHeroImageSrc, homeHeroFallbackImageSrc),
  };

  const membershipData: HomeMembershipData = {
    label: '会员权益',
    status: activeMembership ? '详情' : getMembershipStatus(activeMembership),
    planName: activeMembership?.planName || '尚未开通会员',
    description: getMembershipDescription(activeMembership),
    primaryMetricLabel: '有效期至',
    primaryMetricValue: activeMembership ? formatDateLabel(activeMembership.endDate) : '--.--.--',
    secondaryMetricLabel: '课程权益',
    secondaryMetricValue: getMembershipCreditsText(activeMembership),
    progressLabel: activeMembership ? '进度' : '状态',
    progressValue: activeMembership ? getRemainingDays(activeMembership.endDate) : '待开通',
    progressPercent: activeMembership ? getMembershipProgressPercent(activeMembership) : 0,
    primaryAction: activeMembership ? '立即预约课程' : '开通会员',
    secondaryAction: activeMembership ? '查看详情' : '先看课程',
  };

  const todayCourseData: HomeTodayCourseData = {
    label: todayBooking ? todayCourseSummary.courseLabel : '',
    status: '',
    headerStatus: todayCourseSummary.courseStatus,
    subtitle: todayBooking ? todayCourseSummary.courseSubtitle : '',
    timeRange: todayBooking ? formatTimeRange(todayBooking.session?.startsAt, todayBooking.session?.endsAt) : '--:-- – --:--',
    duration: todayBooking ? formatDurationLabel(todayBooking.session?.startsAt, todayBooking.session?.endsAt) : '待安排',
    title: getBookingDisplayName(todayBooking),
    meta: getBookingDisplayMeta(todayBooking, studioName),
    note: todayBooking ? todayCourseSummary.note : '',
    primaryAction: todayBooking ? '查看详情' : '去预约课程',
    secondaryAction: todayBooking ? '改约' : activeMembership ? '查看全部课程' : '查看会员方案',
  };

  const monthlySummaryData: HomeMonthlySummaryData = {
    label: '本月课程',
    value: String(monthlySessions),
    unit: '次',
    description: '本月训练概览',
    progressText: `月度目标完成 ${monthlyGoalPercent}%`,
    sideItems: [
      {
        key: 'duration',
        label: '时长',
        value: String(monthlyHours),
        unit: '小时',
        detail: '',
      },
      {
        key: 'focus',
        label: '连续',
        value: monthlySessions > 0 ? String(monthlySessions) : '--',
        unit: '次',
        detail: '',
      },
    ],
  };

  const curatedData: HomeCuratedData = {
    eyebrow: '精选课程',
    caption: getCourseCaption(curatedCourse),
    title: curatedCourse?.name || '暂无推荐课程',
    description: '',
    meta: getCourseDisplayMeta(curatedCourse, studioName),
    cta: '预约',
    monogram: '',
    imageUrl: getSafeMiniImageSrc(curatedCourse?.coverImageUrl, '/assets/ui/booking-pilates.svg'),
    fallbackImageUrl: '/assets/ui/home-curated.svg',
  };

  const recentBookings = bookings
    .filter((booking) => Boolean(booking.session?.startsAt) && booking.session)
    .sort((left, right) => new Date(right.session?.startsAt || '').getTime() - new Date(left.session?.startsAt || '').getTime());

  const upcomingItems = upcomingBookings.length > 0
    ? upcomingBookings.slice(0, 2).map(toHomeUpcomingItem)
    : recentBookings.slice(0, 2).map(toHomeRecentItem);
  const usingRecentBookingFallback = upcomingBookings.length === 0 && recentBookings.length > 0;

  const studioData: HomeStudioData = {
    label: '我的门店',
    name: studioName,
    address: studioAddress,
    hours: studioBusinessHours ? `营业时间 ${studioBusinessHours}` : '营业时间待更新',
    note: '',
    actionLabel: '导航前往',
    imageUrl: studioSettings?.imageUrl?.trim() || undefined,
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
    const hasAddress = Boolean(studioSettings?.address?.trim());
    if (!hasAddress) {
      Taro.showToast({ title: '门店地址待更新', icon: 'none' });
      return;
    }

    Taro.openLocation({
      latitude: 39.9242,
      longitude: 116.4335,
      name: studioName,
      address: studioAddress,
      scale: 16,
    });
  };

  const handleUpcomingItemClick = (item: HomeUpcomingItemData) => {
    if (item.routeUrl) {
      Taro.navigateTo({ url: item.routeUrl });
      return;
    }

    Taro.showToast({ title: '当前课程详情暂不可用', icon: 'none' });
  };

  if (loading) {
    return (
      <PageShell className='home-page' reserveTabBarSpace>
        <View className='home-page__content'>
          <Loading compact />
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell className='home-page' reserveTabBarSpace flushTop>
        <View className='home-page__content'>
        <HomeHero data={heroData} />

        {loadFailed || refreshing ? (
          <View className={`home-page__notice ${refreshing ? 'home-page__notice--refreshing' : ''}`}>
            <View className='home-page__notice-main'>
              <Text className='home-page__notice-text'>
                {refreshing ? '正在刷新首页内容…' : '部分内容暂未同步'}
              </Text>
              <Text className='home-page__notice-meta'>
                {refreshing
                  ? '请稍候，刷新完成后会自动更新内容。'
                  : `请下拉页面重新同步${lastRefreshLabel ? `，上次尝试 ${lastRefreshLabel}` : ''}`}
              </Text>
            </View>
          </View>
        ) : null}

        <View className='home-page__section'>
          <HomeMembershipCard
            data={membershipData}
            onPrimaryClick={activeMembership ? handleCoursesEntry : handleMembershipPrimary}
            onDetailClick={handleMembershipPrimary}
            onSecondaryClick={activeMembership ? handleMembershipPrimary : handleCoursesEntry}
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
            onPrimaryClick={todayBooking ? handleBookingsEntry : handleCoursesEntry}
            onSecondaryClick={todayBooking ? handleCoursesEntry : activeMembership ? handleCoursesEntry : handleMembershipPrimary}
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
            actionLabel='精选'
            actionTone='muted'
          />
          <HomeCuratedCard data={curatedData} onClick={handleCoursesEntry} />
        </View>

        <View className='home-page__section'>
          <SectionTitle
            title='近期安排'
            subtitle={usingRecentBookingFallback ? '当前无待上课安排，已展示最近预约记录' : undefined}
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
