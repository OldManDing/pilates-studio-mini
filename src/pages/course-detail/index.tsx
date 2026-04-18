import { useCallback, useMemo, useState } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { coursesApi, Course, CourseSession } from '../../api/courses';
import { bookingsApi } from '../../api/bookings';
import { membersApi, Member } from '../../api/members';
import { AppButton, AppCard, Divider, Empty, Icon, Loading } from '../../components';
import { CourseLevels, CourseTypes, Weekdays, getLabelByValue } from '../../constants/enums';
import './index.scss';

const HERO_IMAGE_BY_TYPE: Record<string, string> = {
  MAT: 'https://images.unsplash.com/photo-1649738247362-4e43a2665a77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3RyZXRjaGluZyUyMHdvbWFuJTIwc3R1ZGlvfGVufDF8fHx8MTc3NTQ4Mjc4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  REFORMER: 'https://images.unsplash.com/photo-1717500251741-cdbc93342d5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwcmVmb3JtZXIlMjBleGVyY2lzZXxlbnwxfHx8fDE3NzU0MTI0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  CADILLAC: 'https://images.unsplash.com/photo-1717500251741-cdbc93342d5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwcmVmb3JtZXIlMjBleGVyY2lzZXxlbnwxfHx8fDE3NzU0MTI0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  CHAIR: 'https://images.unsplash.com/photo-1761034114091-6d30447e25aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwY2xhc3MlMjBzdHVkaW8lMjBncm91cHxlbnwxfHx8fDE3NzU0ODI3ODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  BARREL: 'https://images.unsplash.com/photo-1761034114091-6d30447e25aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwY2xhc3MlMjBzdHVkaW8lMjBncm91cHxlbnwxfHx8fDE3NzU0ODI3ODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  PRIVATE: 'https://images.unsplash.com/photo-1682278763548-f349e3c73793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwemVuJTIwbWluZGZ1bG5lc3N8ZW58MXx8fHwxNzc1NDgyNzgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
};

const HERO_IMAGE_FALLBACK_BY_TYPE: Record<string, string> = {
  MAT: '/assets/ui/booking-yoga.svg',
  REFORMER: '/assets/ui/booking-pilates.svg',
  CADILLAC: '/assets/ui/booking-pilates.svg',
  CHAIR: '/assets/ui/booking-dark.svg',
  BARREL: '/assets/ui/booking-dark.svg',
  PRIVATE: '/assets/ui/booking-meditation.svg',
};

const TYPE_SUBTITLE_MAP: Record<string, string> = {
  MAT: 'MAT PILATES',
  REFORMER: 'REFORMER PILATES',
  CADILLAC: 'CADILLAC PILATES',
  CHAIR: 'CHAIR PILATES',
  BARREL: 'BARREL PILATES',
  PRIVATE: 'PRIVATE SESSION',
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDate(value?: string) {
  if (!value) {
    return '--.--.--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--.--.--';
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function formatTimeRange(start?: string, end?: string) {
  if (!start || !end) {
    return '--:-- – --:--';
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '--:-- – --:--';
  }

  return `${pad(startDate.getHours())}:${pad(startDate.getMinutes())} – ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
}

function getDurationMinutes(start?: string, end?: string, fallback = 0) {
  if (!start || !end) {
    return fallback;
  }

  const diff = new Date(end).getTime() - new Date(start).getTime();

  if (Number.isNaN(diff) || diff <= 0) {
    return fallback;
  }

  return Math.round(diff / (1000 * 60));
}

function getDateLabel(value?: string) {
  if (!value) {
    return '待定';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '待定';
  }

  const now = new Date();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDiff = Math.round((dateStart - nowStart) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    return '今日';
  }

  if (dayDiff === 1) {
    return '明日';
  }

  const weekday = Weekdays.find((item) => item.value === date.getDay())?.shortLabel || '';
  return `周${weekday}`;
}

function getSessionSpots(session: CourseSession | null, fallback: number) {
  if (!session) {
    return fallback;
  }

  const left = session.capacity - (session.bookedCount || 0);
  return Math.max(0, left);
}

function getSessionTotal(session: CourseSession | null, fallback: number) {
  if (!session) {
    return fallback;
  }

  return Math.max(0, session.capacity);
}

export default function CourseDetail() {
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [heroImageSrc, setHeroImageSrc] = useState('');

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const [courseRes, sessionsRes, profileRes] = await Promise.all([
        coursesApi.getById(id),
        coursesApi.getSessions(id, { upcoming: true }),
        membersApi.getProfile({ showLoading: false }).catch(() => ({ data: { member: null as Member | null } })),
      ]);
      setCourse(courseRes.data.course);
      setSessions(sessionsRes.data.sessions || []);
      setMember(profileRes.data.member || null);
      const nextHero = HERO_IMAGE_BY_TYPE[courseRes.data.course.type] || HERO_IMAGE_FALLBACK_BY_TYPE[courseRes.data.course.type] || '/assets/ui/booking-yoga.svg';
      setHeroImageSrc(nextHero);
    } catch (error) {
      console.error('Failed to fetch course detail:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useLoad((options) => {
    if (options?.id) {
      fetchData(options.id);
      return;
    }

    setLoading(false);
  });

  const featuredSession = useMemo(() => {
    if (sessions.length === 0) {
      return null;
    }

    const sorted = [...sessions].sort((left, right) => {
      const leftTime = new Date(left.startsAt).getTime();
      const rightTime = new Date(right.startsAt).getTime();
      return leftTime - rightTime;
    });

    return sorted[0];
  }, [sessions]);

  const handleBooking = async () => {
    if (!featuredSession || !course) {
      Taro.showToast({ title: '暂无可约场次', icon: 'none' });
      return;
    }

    if (!member?.id) {
      Taro.showToast({ title: '请先登录会员账号', icon: 'none' });
      return;
    }

    try {
      setBookingLoading(true);
      await bookingsApi.create({ memberId: member.id, sessionId: featuredSession.id });
      Taro.showToast({ title: '预约成功', icon: 'success' });
      setBooked(true);
      fetchData(course.id);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!course) {
    return <Empty title='课程不存在' />;
  }

  const subtitle = TYPE_SUBTITLE_MAP[course.type] || getLabelByValue(CourseTypes, course.type);
  const heroImageFallback = HERO_IMAGE_FALLBACK_BY_TYPE[course.type] || '/assets/ui/booking-yoga.svg';
  const instructorName = course.coach?.name || '待安排';
  const instructorDescription = `${instructorName}教练 · 8年教学经验`;
  const sessionDate = featuredSession?.startsAt;
  const timeRange = formatTimeRange(featuredSession?.startsAt, featuredSession?.endsAt);
  const durationMinutes = getDurationMinutes(featuredSession?.startsAt, featuredSession?.endsAt, course.durationMinutes);
  const dateLabel = getDateLabel(sessionDate);
  const spots = getSessionSpots(featuredSession, course.maxCapacity);
  const totalSpots = getSessionTotal(featuredSession, course.maxCapacity);
  const usedSpots = Math.max(0, totalSpots - spots);
  const isFull = totalSpots > 0 && spots <= 0;
  const progress = totalSpots > 0 ? Math.round((usedSpots / totalSpots) * 100) : 0;
  const tags = [
    getLabelByValue(CourseTypes, course.type),
    getLabelByValue(CourseLevels, course.level),
    `${course.durationMinutes}min`,
  ];
  const canBook = Boolean(featuredSession) && !isFull && !booked;
  const ctaLabel = bookingLoading ? '预约中...' : booked ? '已预约成功' : isFull ? '已约满' : '立即预约';

  return (
    <View className='course-detail-page'>
      <ScrollView className='course-detail-page__scroll' scrollY showScrollbar={false}>
        <View className='course-detail-page__hero'>
          <Image className='course-detail-page__hero-image' src={heroImageSrc || heroImageFallback} mode='aspectFill' onError={() => setHeroImageSrc(heroImageFallback)} />
          <View className='course-detail-page__hero-mask' />

          <View
            className='course-detail-page__back'
            onClick={async () => {
              try {
                await Taro.navigateBack({ delta: 1 });
              } catch (error) {
                Taro.switchTab({ url: '/pages/courses/index' });
              }
            }}
          >
            <Icon name='chevron-left' className='course-detail-page__back-icon' />
          </View>

          <View className='course-detail-page__hero-text'>
            <Text className='course-detail-page__subtitle'>{subtitle}</Text>
            <Text className='course-detail-page__title'>{course.name}</Text>
          </View>
        </View>

        <View className='course-detail-page__body'>
          <AppCard className='course-detail-page__info-card' padding='medium'>
            <View className='course-detail-page__time-row'>
              <Icon name='clock' className='course-detail-page__time-icon' />
              <Text className='course-detail-page__time-value'>{timeRange}</Text>
              <Text className='course-detail-page__duration'>{durationMinutes}min</Text>
              <Text className='course-detail-page__date-label'>{dateLabel}</Text>
            </View>

            <Text className='course-detail-page__date-value'>{formatDate(sessionDate)}</Text>

            <Divider spacing='none' />

            <View className='course-detail-page__meta-row'>
              <Icon name='pin' className='course-detail-page__meta-icon' />
              <View>
                <Text className='course-detail-page__meta-title'>课程教室</Text>
                <Text className='course-detail-page__meta-desc'>Pilates Studio · 朝阳门店</Text>
              </View>
            </View>

            <Divider spacing='none' />

            <View className='course-detail-page__meta-row'>
              <Icon name='dot' className='course-detail-page__meta-icon' />
              <View className='course-detail-page__capacity'>
                <View className='course-detail-page__capacity-head'>
                  <Text className='course-detail-page__meta-title'>{isFull ? '已约满' : `余 ${spots} 个名额`}</Text>
                  <Text className='course-detail-page__meta-desc'>{usedSpots}/{totalSpots}</Text>
                </View>
                <View className='course-detail-page__capacity-track'>
                  <View
                    className={`course-detail-page__capacity-fill ${isFull ? 'course-detail-page__capacity-fill--full' : ''}`}
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </View>
            </View>
          </AppCard>

          <View className='course-detail-page__section'>
            <Text className='course-detail-page__section-label'>INSTRUCTOR</Text>
            <AppCard>
              <View className='course-detail-page__instructor'>
                <View className='course-detail-page__instructor-avatar'>
                  {course.coach?.avatar ? (
                    <Image className='course-detail-page__instructor-avatar-image' src={course.coach.avatar} mode='aspectFill' />
                  ) : (
                    <Text className='course-detail-page__instructor-avatar-text'>{instructorName.slice(0, 1)}</Text>
                  )}
                </View>
                <View className='course-detail-page__instructor-content'>
                  <Text className='course-detail-page__instructor-name'>{instructorName}</Text>
                  <Text className='course-detail-page__instructor-desc'>{instructorDescription}</Text>
                </View>
              </View>
            </AppCard>
          </View>

          <View className='course-detail-page__section'>
            <Text className='course-detail-page__section-label course-detail-page__section-label--muted'>ABOUT</Text>
            <AppCard>
              <Text className='course-detail-page__about'>{course.description || '暂无课程介绍'}</Text>
              <View className='course-detail-page__tags'>
                {tags.map((tag, index) => (
                  <Text
                    key={tag}
                    className={`course-detail-page__tag ${index === tags.length - 1 ? 'course-detail-page__tag--gold' : ''}`}
                  >
                    {tag}
                  </Text>
                ))}
              </View>
            </AppCard>
          </View>

          {!featuredSession ? (
            <View className='course-detail-page__section'>
              <AppCard>
                <Empty title='暂无课程安排' description='敬请期待' />
              </AppCard>
            </View>
          ) : null}

          <View className='course-detail-page__bottom-spacer' />
        </View>
      </ScrollView>

      <View className='course-detail-page__cta-wrap'>
        <View className='course-detail-page__cta-line' />
        <View className='course-detail-page__cta-inner'>
          {booked ? (
            <View className='course-detail-page__success'>
                <Icon name='check' className='course-detail-page__success-icon' />
              <Text className='course-detail-page__success-text'>已预约成功</Text>
            </View>
          ) : (
            <AppButton
              className='course-detail-page__cta-button'
              size='medium'
              variant='primary'
              disabled={!canBook || bookingLoading}
              onClick={handleBooking}
            >
              {ctaLabel}
            </AppButton>
          )}
        </View>
      </View>
    </View>
  );
}
