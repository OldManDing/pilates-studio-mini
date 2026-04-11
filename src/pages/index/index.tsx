import { useCallback, useState } from 'react';
import Taro, { useLoad, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { coursesApi, Course } from '../../api/courses';
import { bookingsApi, Booking } from '../../api/bookings';
import { membersApi, Member, Membership } from '../../api/members';
import { Loading } from '../../components';
import './index.scss';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const ACTIVE_BOOKING_STATUSES: Booking['status'][] = ['PENDING', 'CONFIRMED'];

type QuickActionType = 'booking' | 'profile' | 'bookings' | 'schedule' | 'coach';
type BookingWithSession = Booking & { session: NonNullable<Booking['session']> };

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function formatHeroDate(date: Date) {
  return `${date.getFullYear()} · ${padNumber(date.getMonth() + 1)} · ${padNumber(date.getDate())} ${WEEKDAY_LABELS[date.getDay()]}`;
}

function formatDisplayDate(dateString: string, separator = '.') {
  if (!dateString) {
    return '--';
  }

  const date = new Date(dateString);
  return `${date.getFullYear()}${separator}${padNumber(date.getMonth() + 1)}${separator}${padNumber(date.getDate())}`;
}

function formatMonthDay(dateString: string) {
  if (!dateString) {
    return '--';
  }

  const date = new Date(dateString);
  return `${padNumber(date.getMonth() + 1)}月${padNumber(date.getDate())}日`;
}

function formatClock(dateString: string) {
  if (!dateString) {
    return '--:--';
  }

  const date = new Date(dateString);
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function formatTimeRange(start: string, end: string) {
  return `${formatClock(start)} – ${formatClock(end)}`;
}

function calculateMinutes(start: string, end: string) {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const diff = endTime - startTime;

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.round(diff / (1000 * 60));
}

function getRemainingDays(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getRemainingRatio(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const total = end - start;
  const remaining = end - Date.now();

  if (Number.isNaN(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
}

function isSameDay(dateString: string, targetDate: Date) {
  const date = new Date(dateString);

  return (
    date.getFullYear() === targetDate.getFullYear()
    && date.getMonth() === targetDate.getMonth()
    && date.getDate() === targetDate.getDate()
  );
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour < 12) {
    return '早安';
  }

  if (hour < 18) {
    return '午安';
  }

  return '晚上好';
}

function hasSession(booking: Booking): booking is BookingWithSession {
  return Boolean(booking.session?.startsAt && booking.session?.endsAt);
}

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [coursesRes, membershipsRes, profileRes, bookingsRes] = await Promise.all([
        coursesApi.getAll({ limit: 4, isActive: true }).catch(() => ({ data: { courses: [] as Course[] } })),
        membersApi.getMyMemberships().catch(() => ({ data: { memberships: [] as Membership[] } })),
        membersApi.getProfile().catch(() => ({ data: { member: null as Member | null } })),
        bookingsApi.getMyBookings({ page: 1, limit: 10 }).catch(() => ({ data: { bookings: [] as Booking[] } })),
      ]);

      setCourses(coursesRes.data.courses || []);
      setMemberships(membershipsRes.data.memberships || []);
      setMember(profileRes.data.member);
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useLoad(() => {
    fetchData();
  });

  usePullDownRefresh(() => {
    fetchData();
  });

  useShareAppMessage(() => {
    return {
      title: 'Pilates Studio - 专业普拉提工作室',
      path: '/pages/index/index',
    };
  });

  const handleCourseClick = (course: Course) => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${course.id}` });
  };

  const handleQuickAction = (type: QuickActionType) => {
    switch (type) {
      case 'booking':
        Taro.switchTab({ url: '/pages/courses/index' });
        break;
      case 'profile':
        Taro.switchTab({ url: '/pages/profile/index' });
        break;
      case 'bookings':
        Taro.navigateTo({ url: '/pages/my-bookings/index' });
        break;
      case 'schedule':
        Taro.switchTab({ url: '/pages/courses/index' });
        break;
      case 'coach':
        Taro.switchTab({ url: '/pages/profile/index' });
        break;
    }
  };

  if (loading) {
    return <Loading />;
  }

  const now = new Date();
  const activeMembership = memberships.find((membership) => membership.isActive) || null;
  const featuredCourses = courses.slice(0, 3);
  const activeMembershipCount = memberships.filter((membership) => membership.isActive).length;
  const totalRemainingCredits = memberships.reduce((sum, membership) => sum + membership.remainingCredits, 0);
  const upcomingBookings = bookings
    .filter(hasSession)
    .filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status))
    .sort((left, right) => new Date(left.session.startsAt).getTime() - new Date(right.session.startsAt).getTime());
  const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED');
  const monthCompletedBookings = completedBookings.filter((booking) => {
    if (!booking.session?.startsAt) return false;
    const date = new Date(booking.session.startsAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthDurationMinutes = monthCompletedBookings.reduce((sum, booking) => {
    if (!booking.session?.startsAt || !booking.session?.endsAt) return sum;
    return sum + calculateMinutes(booking.session.startsAt, booking.session.endsAt);
  }, 0);
  const recentScheduleItems = upcomingBookings.slice(0, 2);
  const todayBookings = upcomingBookings.filter((booking) => isSameDay(booking.session.startsAt, now));
  const todayBooking = todayBookings[0] || null;
  const nextBooking = upcomingBookings.find((booking) => new Date(booking.session.startsAt).getTime() >= now.getTime()) || null;
  const membershipRemainingDays = activeMembership ? getRemainingDays(activeMembership.endDate) : 0;
  const membershipProgress = activeMembership ? getRemainingRatio(activeMembership.startDate, activeMembership.endDate) : 0;
  const heroTitle = member?.name ? `${getGreeting(now)}，${member.name}` : `${getGreeting(now)}，欢迎回来`;
  const heroSubtitle = todayBookings.length > 0
    ? `今日已安排 ${todayBookings.length} 节课程`
    : nextBooking
      ? `下一节课程将在 ${formatMonthDay(nextBooking.session.startsAt)} 开始`
      : activeMembership
        ? `${activeMembership.planName || '会员权益'} 已生效`
        : '从一节舒展课程开始今天的练习';

  const serviceItems: Array<{ label: string; sub: string; type: QuickActionType }> = [
    { label: '预约课程', sub: 'BOOKING', type: 'booking' },
    { label: '训练记录', sub: 'RECORD', type: 'bookings' },
    { label: '我的教练', sub: 'COACH', type: 'coach' },
    { label: '课程表', sub: 'SCHEDULE', type: 'schedule' },
  ];

  const renderTodayCard = () => {
    if (todayBooking) {
      const courseId = todayBooking.session.course?.id;

      return (
        <>
          <View className='home__today-meta'>
            <Text className='home__today-time'>{formatTimeRange(todayBooking.session.startsAt, todayBooking.session.endsAt)}</Text>
            <Text className='home__today-length'>{calculateMinutes(todayBooking.session.startsAt, todayBooking.session.endsAt)}min</Text>
          </View>
          <Text className='home__today-title'>{todayBooking.session.course?.name || '已预约课程'}</Text>
            <Text className='home__today-desc'>
              {todayBooking.session.coach?.name || '待分配教练'} · 朝阳门店
            </Text>
            <View className='home__today-actions'>
              <View
                className='home__button home__button--primary home__button--flex'
                onClick={() => (courseId ? Taro.navigateTo({ url: `/pages/course-detail/index?id=${courseId}` }) : Taro.navigateTo({ url: '/pages/my-bookings/index' }))}
              >
                <Text className='home__button-text home__button-text--primary'>查看详情</Text>
              </View>
              <View className='home__button home__button--ghost' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })}>
                <Text className='home__button-text home__button-text--ghost'>改约</Text>
              </View>
            </View>
        </>
      );
    }

    if (nextBooking) {
      const courseId = nextBooking.session.course?.id;

      return (
        <>
          <View className='home__today-meta'>
            <Text className='home__today-time'>{formatMonthDay(nextBooking.session.startsAt)} · {formatTimeRange(nextBooking.session.startsAt, nextBooking.session.endsAt)}</Text>
            <Text className='home__today-length'>即将开始</Text>
          </View>
          <Text className='home__today-title'>{nextBooking.session.course?.name || '下一节课程'}</Text>
            <Text className='home__today-desc'>
              {nextBooking.session.coach?.name || '待分配教练'} · 朝阳门店
            </Text>
            <View className='home__today-actions'>
              <View
                className='home__button home__button--primary home__button--flex'
                onClick={() => (courseId ? Taro.navigateTo({ url: `/pages/course-detail/index?id=${courseId}` }) : Taro.navigateTo({ url: '/pages/my-bookings/index' }))}
              >
                <Text className='home__button-text home__button-text--primary'>查看课程</Text>
              </View>
              <View className='home__button home__button--ghost' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })}>
                <Text className='home__button-text home__button-text--ghost'>改约</Text>
              </View>
            </View>
        </>
      );
    }

    if (featuredCourses[0]) {
      const recommendedCourse = featuredCourses[0];

      return (
        <>
          <View className='home__today-meta'>
            <Text className='home__today-time'>今日暂未预约</Text>
            <Text className='home__today-length'>推荐课程</Text>
          </View>
          <Text className='home__today-title'>{recommendedCourse.name}</Text>
          <Text className='home__today-desc'>
            {recommendedCourse.coach?.name || '精品课程推荐'} · {recommendedCourse.durationMinutes}min
          </Text>
          <View className='home__today-actions'>
            <View className='home__button home__button--primary home__button--flex' onClick={() => handleQuickAction('booking')}>
              <Text className='home__button-text home__button-text--primary'>立即预约课程</Text>
            </View>
            <View className='home__button home__button--ghost' onClick={() => handleCourseClick(recommendedCourse)}>
              <Text className='home__button-text home__button-text--ghost'>查看详情</Text>
            </View>
          </View>
        </>
      );
    }

    return (
      <>
        <View className='home__today-meta'>
          <Text className='home__today-time'>今日暂未预约</Text>
          <Text className='home__today-length'>随时开始</Text>
        </View>
        <Text className='home__today-title'>为自己安排一节训练课程</Text>
        <Text className='home__today-desc'>浏览课程表，选择适合今天节奏的普拉提练习。</Text>
        <View className='home__today-actions'>
          <View className='home__button home__button--primary home__button--flex' onClick={() => handleQuickAction('booking')}>
            <Text className='home__button-text home__button-text--primary'>去预约课程</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <ScrollView className='home' scrollY enhanced showScrollbar={false}>
      <View className='home__hero'>
        <View className='home__hero-top'>
          <Text className='home__hero-date'>{formatHeroDate(now)}</Text>
          <View className='home__hero-badge'>
            <View className='home__hero-badge-dot' />
            <Text className='home__hero-badge-text'>GOLD</Text>
          </View>
        </View>
        <Text className='home__hero-title'>{heroTitle}</Text>
        <Text className='home__hero-subtitle'>{heroSubtitle}</Text>
      </View>

      <View className='home__content'>
        {activeMembership ? (
          <View className='home__section'>
            <View className='home__panel home__membership-card'>
              <View className='home__membership-head'>
                <Text className='home__membership-label'>MEMBERSHIP</Text>
                <Text className='home__membership-link' onClick={() => handleQuickAction('profile')}>详情</Text>
              </View>
              <Text className='home__membership-name'>{activeMembership.planName || '当前会员卡'}</Text>
              <View className='home__membership-stats'>
                <View className='home__membership-stat'>
                  <Text className='home__membership-stat-label'>有效期至</Text>
                  <Text className='home__membership-stat-value'>{formatDisplayDate(activeMembership.endDate)}</Text>
                </View>
                <View className='home__membership-stat home__membership-stat--right'>
                  <Text className='home__membership-stat-label'>剩余课次</Text>
                  <Text className='home__membership-stat-value'>{activeMembership.remainingCredits}</Text>
                </View>
              </View>
              <View className='home__membership-progress'>
                <View className='home__membership-progress-track'>
                  <View className='home__membership-progress-fill' style={{ width: `${membershipProgress}%` }} />
                </View>
                <Text className='home__membership-progress-text'>剩余 {membershipRemainingDays} 天</Text>
              </View>
              <View className='home__divider' />
              <View className='home__button home__button--primary' onClick={() => handleQuickAction('booking')}>
                <Text className='home__button-text home__button-text--primary'>立即预约课程</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className='home__section'>
            <View className='home__panel home__membership-card home__membership-card--empty'>
              <View className='home__membership-head'>
                <Text className='home__membership-label'>MEMBERSHIP</Text>
                <Text className='home__membership-link' onClick={() => handleQuickAction('profile')}>查看</Text>
              </View>
              <Text className='home__membership-name'>解锁完整会员权益</Text>
              <Text className='home__membership-empty-desc'>查看可用会员卡、管理课次并安排未来训练计划。</Text>
              <View className='home__membership-stats'>
                <View className='home__membership-stat'>
                  <Text className='home__membership-stat-label'>有效卡</Text>
                  <Text className='home__membership-stat-value'>{activeMembershipCount}</Text>
                </View>
                <View className='home__membership-stat home__membership-stat--right'>
                  <Text className='home__membership-stat-label'>剩余课次</Text>
                  <Text className='home__membership-stat-value'>{totalRemainingCredits}</Text>
                </View>
              </View>
              <View className='home__divider' />
              <View className='home__button home__button--primary' onClick={() => handleQuickAction('profile')}>
                <Text className='home__button-text home__button-text--primary'>进入我的主页</Text>
              </View>
            </View>
          </View>
        )}

        <View className='home__section'>
          <View className='home__section-heading'>
            <Text className='home__section-title'>今日课程</Text>
            <View className='home__section-status'>
              <View className='home__section-status-dot' />
              <Text className='home__section-status-text'>{todayBooking ? '已预约' : nextBooking ? '即将开始' : '待安排'}</Text>
            </View>
          </View>
          <View className='home__panel home__today-card'>
            {renderTodayCard()}
          </View>
        </View>

        <View className='home__section'>
          <View className='home__panel home__service-band'>
            {serviceItems.map((item) => (
              <View key={item.type} className='home__service-item' onClick={() => handleQuickAction(item.type)}>
                <Text className='home__service-item-label'>{item.label}</Text>
                <Text className='home__service-item-sub'>{item.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className='home__section'>
          <Text className='home__simple-title'>本月训练</Text>
          <View className='home__panel home__summary-card'>
            <View className='home__summary-main'>
              <Text className='home__summary-label'>SESSIONS</Text>
              <View className='home__summary-main-row'>
                <Text className='home__summary-main-value'>{monthCompletedBookings.length}</Text>
                <Text className='home__summary-main-unit'>次</Text>
              </View>
            </View>
            <View className='home__summary-divider' />
            <View className='home__summary-side'>
              <View className='home__summary-side-item'>
                <Text className='home__summary-side-label'>时长</Text>
                <View className='home__summary-side-row'>
                  <Text className='home__summary-side-value'>{Math.round(monthDurationMinutes / 60)}</Text>
                  <Text className='home__summary-side-unit'>h</Text>
                </View>
              </View>
              <View className='home__summary-side-item'>
                <Text className='home__summary-side-label'>连续</Text>
                <View className='home__summary-side-row'>
                  <Text className='home__summary-side-value'>{todayBookings.length > 0 ? 1 : 0}</Text>
                  <Text className='home__summary-side-unit'>d</Text>
                </View>
              </View>
            </View>
            <View className='home__summary-progress'>
              <View className='home__summary-progress-track'>
                <View className='home__summary-progress-fill' style={{ width: `${Math.min(100, monthCompletedBookings.length * 8)}%` }} />
              </View>
              <Text className='home__summary-progress-text'>月度目标完成 {Math.min(100, monthCompletedBookings.length * 8)}%</Text>
            </View>
          </View>
        </View>

        <View className='home__section'>
          <View className='home__section-heading'>
            <Text className='home__section-title'>精选推荐</Text>
            <Text className='home__section-caption'>CURATED</Text>
          </View>
          {featuredCourses[0] ? (
            <View className='home__featured-card' onClick={() => handleCourseClick(featuredCourses[0])}>
              <View className='home__featured-image-wrap'>
                <Image className='home__featured-image' src='/assets/tabbar/course-active.png' mode='aspectFill' />
                <View className='home__featured-image-overlay' />
                <Text className='home__featured-image-meta'>明日 18:30 · {featuredCourses[0].durationMinutes}MIN</Text>
              </View>
              <View className='home__featured-body'>
                <View className='home__featured-copy'>
                  <Text className='home__featured-title'>{featuredCourses[0].name}</Text>
                  <Text className='home__featured-desc'>{featuredCourses[0].coach?.name || '精品课程'} · 朝阳门店</Text>
                  <Text className='home__featured-note'>根据你的训练节奏推荐</Text>
                </View>
                <View className='home__featured-action'>
                  <Text className='home__featured-action-text'>预约</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className='home__panel home__empty-card'>
              <Text className='home__empty-card-title'>精选课程即将上线</Text>
              <Text className='home__empty-card-desc'>稍后下拉刷新，查看最新课程安排。</Text>
            </View>
          )}
        </View>

        <View className='home__section'>
          <View className='home__section-heading'>
            <Text className='home__section-title'>近期安排</Text>
            <Text className='home__section-link' onClick={() => handleQuickAction('bookings')}>全部</Text>
          </View>
          <View className='home__panel home__schedule-card'>
            {recentScheduleItems.length > 0 ? recentScheduleItems.map((booking, index) => (
              <View key={booking.id} className='home__schedule-item'>
                <View className='home__schedule-date'>
                  <Text className='home__schedule-day'>{padNumber(new Date(booking.session.startsAt).getDate())}</Text>
                  <Text className='home__schedule-weekday'>{WEEKDAY_LABELS[new Date(booking.session.startsAt).getDay()]}</Text>
                </View>
                <View className='home__schedule-line' />
                <View className='home__schedule-meta'>
                  <View className='home__schedule-title-row'>
                    <Text className='home__schedule-title'>{booking.session.course?.name || '已预约课程'}</Text>
                    {index === 0 ? <Text className='home__schedule-tag'>明日</Text> : null}
                  </View>
                  <Text className='home__schedule-desc'>{booking.session.coach?.name || '待分配教练'} · {formatClock(booking.session.startsAt)} · {calculateMinutes(booking.session.startsAt, booking.session.endsAt)}min</Text>
                </View>
                <Text className='home__schedule-arrow'>›</Text>
              </View>
            )) : (
              <View className='home__empty-state-compact'>
                <Text className='home__empty-card-title'>近期暂无安排</Text>
                <Text className='home__empty-card-desc'>完成预约后，这里会显示你的下一节课程。</Text>
              </View>
            )}
          </View>
        </View>

        <View className='home__section home__section--studio'>
          <View className='home__studio-card'>
            <View className='home__studio-top'>
              <View>
                <Text className='home__studio-label'>YOUR STUDIO</Text>
                <Text className='home__studio-name'>朝阳门店</Text>
              </View>
              <View className='home__studio-pin'>⌖</View>
            </View>
            <Text className='home__studio-address'>朝阳区建国门外大街 1 号</Text>
            <Text className='home__studio-hours'>营业时间 08:00 – 22:00</Text>
            <View className='home__studio-button'>
              <Text className='home__studio-button-text'>导航前往</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
