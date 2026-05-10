import { useCallback, useMemo, useRef, useState } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { ensureMiniProgramAuth } from '../../api/auth';
import { coursesApi, Course, CourseSession } from '../../api/courses';
import { bookingsApi } from '../../api/bookings';
import { membersApi, Member } from '../../api/members';
import { getApiErrorMessage } from '../../api/request';
import { AppButton, AppCard, Divider, Empty, FloatingBackButton, Icon, Loading, PageHeader, PageShell } from '../../components';
import { CourseLevels, CourseTypes, Weekdays, getLabelByValue } from '../../constants/enums';
import { showSafeToast } from '../../utils/feedback';
import { formatDurationMinutes, getSafeMiniImageSrc } from '../../utils/ui';
import { requestBookingSubscribeAuthorization } from '../../utils/wechatSubscribe';
import './index.scss';

const HERO_IMAGE_FALLBACK_BY_TYPE: Record<string, string> = {
  MAT: '/assets/ui/booking-yoga.svg',
  REFORMER: '/assets/ui/booking-pilates.svg',
  CADILLAC: '/assets/ui/booking-pilates.svg',
  CHAIR: '/assets/ui/booking-dark.svg',
  BARREL: '/assets/ui/booking-dark.svg',
  PRIVATE: '/assets/ui/booking-meditation.svg',
};

const TYPE_SUBTITLE_MAP: Record<string, string> = {
  MAT: '垫上普拉提',
  REFORMER: '器械普拉提',
  CADILLAC: '凯迪拉克床',
  CHAIR: '稳踏椅训练',
  BARREL: '脊柱矫正桶',
  PRIVATE: '私教课程',
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

function isSessionBookable(session: CourseSession) {
  const endsAt = new Date(session.endsAt).getTime();
  return session.isActive !== false && (Number.isNaN(endsAt) || endsAt > Date.now());
}

export default function CourseDetail() {
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [courseLoadFailed, setCourseLoadFailed] = useState(false);
  const [courseIdMissing, setCourseIdMissing] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [heroImageSrc, setHeroImageSrc] = useState('');
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const bookingInFlightRef = useRef(false);

  const fetchData = useCallback(async (id: string, options: { showPageLoading?: boolean } = {}) => {
    const showPageLoading = options.showPageLoading !== false;

    try {
      if (showPageLoading) {
        setLoading(true);
      }
      setCourseLoadFailed(false);
      setCourseIdMissing(false);
      const [courseRes, sessionsRes, profileRes] = await Promise.all([
        coursesApi.getById(id, { showLoading: false }),
        coursesApi.getSessions(id, { upcoming: true }, { showLoading: false }),
        membersApi.getProfile({ showLoading: false })
          .then((response) => ({ response, failed: false }))
          .catch(() => ({ response: { data: { member: null as Member | null } }, failed: true })),
      ]);
      setCourse(courseRes.data.course);
      setSessions((sessionsRes.data.sessions || []).filter(isSessionBookable));
      setMember(profileRes.response.data.member || null);
      setProfileLoadFailed(profileRes.failed);
      const nextHero = getSafeMiniImageSrc(courseRes.data.course.coverImageUrl, HERO_IMAGE_FALLBACK_BY_TYPE[courseRes.data.course.type] || '/assets/ui/booking-yoga.svg');
      setHeroImageSrc(nextHero);
    } catch {
      if (showPageLoading) {
        setCourse(null);
        setSessions([]);
        setCourseLoadFailed(true);
        showSafeToast({ title: '课程加载失败', icon: 'none' });
      } else {
        showSafeToast({ title: '预约成功，课程余位稍后同步', icon: 'none' });
      }
    } finally {
      if (showPageLoading) {
        setLoading(false);
      }
    }
  }, []);

  useLoad((options) => {
    if (options?.id) {
      const nextCourseId = String(options.id);
      setCourseId(nextCourseId);
      fetchData(nextCourseId);
      return;
    }

    setCourseLoadFailed(true);
    setCourseIdMissing(true);
    setLoading(false);
  });

  const sortedSessions = useMemo(() => {
    if (sessions.length === 0) {
      return [];
    }

    return [...sessions].sort((left, right) => {
      const leftTime = new Date(left.startsAt).getTime();
      const rightTime = new Date(right.startsAt).getTime();
      return leftTime - rightTime;
    });
  }, [sessions]);

  const featuredSession = sortedSessions.find((session) => getSessionSpots(session, course?.maxCapacity || 0) > 0) || sortedSessions[0] || null;

  const handleBooking = async (selectedSession?: CourseSession) => {
    if (!course || sortedSessions.length === 0) {
      showSafeToast({ title: '暂无可约场次', icon: 'none' });
      return;
    }

    if (profileLoadFailed) {
      showSafeToast({ title: '会员信息加载失败，请下拉重试', icon: 'none' });
      return;
    }

    if (!member?.id) {
      Taro.switchTab({ url: '/pages/profile/index' });
      return;
    }

    if (!selectedSession && sortedSessions.length > 1) {
      setSessionPickerOpen(true);
      return;
    }

    if (bookingLoading || bookingInFlightRef.current) {
      return;
    }

    bookingInFlightRef.current = true;

    try {
      const targetSession = selectedSession || featuredSession;

      if (!targetSession) {
        showSafeToast({ title: '场次信息无效，请重试', icon: 'none' });
        return;
      }

      if (getSessionSpots(targetSession, course.maxCapacity) <= 0) {
        showSafeToast({ title: '该场次已约满，请选择其他场次', icon: 'none' });
        return;
      }

      setSessionPickerOpen(false);
      setBookingLoading(true);
      await requestBookingSubscribeAuthorization();
      await bookingsApi.create({ memberId: member.id, sessionId: targetSession.id, source: 'MINI_PROGRAM' }, { showLoading: false });
      showSafeToast({ title: '预约成功', icon: 'success' });
      setBooked(true);
      void fetchData(course.id, { showPageLoading: false });
    } catch (error) {
      showSafeToast({ title: getApiErrorMessage(error, '预约失败，请稍后重试'), icon: 'none' });
    } finally {
      bookingInFlightRef.current = false;
      setBookingLoading(false);
    }
  };

  const handleLoginAndReload = async () => {
    const targetCourseId = course?.id || courseId;

    if (!targetCourseId) {
      showSafeToast({ title: '课程信息缺失，请返回重试', icon: 'none' });
      return;
    }

    try {
      await ensureMiniProgramAuth({ interactive: true });
      await fetchData(targetCourseId);
      showSafeToast({ title: '登录成功，请继续预约', icon: 'success' });
    } catch (error) {
      showSafeToast({ title: getApiErrorMessage(error, '登录失败，请稍后重试'), icon: 'none' });
    }
  };

  if (loading) {
    return (
      <PageShell safeAreaBottom>
        <PageHeader title='课程详情' subtitle='正在同步课程资料' pageKey='courses' fallbackUrl='/pages/courses/index' />
        <AppCard>
          <Loading compact />
        </AppCard>
      </PageShell>
    );
  }

  if (!course) {
    const emptyTitle = courseIdMissing ? '课程信息缺失' : courseLoadFailed ? '课程加载失败' : '课程不存在';
    const emptySubtitle = courseIdMissing
      ? '缺少课程编号，请返回课程列表重新选择'
      : courseLoadFailed
        ? '网络异常或课程暂时不可用'
        : '该课程可能已下架或链接已失效';
    const emptyDescription = courseIdMissing
      ? '当前入口没有携带课程编号，无法定位要预约的课程。请返回课程列表重新选择。'
      : courseLoadFailed
        ? '请检查网络后重试，或返回课程列表重新选择。'
        : '请返回课程列表重新选择。';
    const canRetryCourseLoad = courseLoadFailed && Boolean(courseId);

    return (
      <PageShell safeAreaBottom>
        <PageHeader title={emptyTitle} subtitle={emptySubtitle} pageKey='courses' fallbackUrl='/pages/courses/index' />
        <AppCard>
          <Empty
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={canRetryCourseLoad ? '重新加载' : '返回课程列表'}
            actionVariant={canRetryCourseLoad ? 'primary' : 'outline'}
            onActionClick={canRetryCourseLoad ? () => fetchData(courseId) : () => Taro.switchTab({ url: '/pages/courses/index' })}
          />
        </AppCard>
      </PageShell>
    );
  }

  const subtitle = TYPE_SUBTITLE_MAP[course.type] || getLabelByValue(CourseTypes, course.type);
  const heroImageFallback = HERO_IMAGE_FALLBACK_BY_TYPE[course.type] || '/assets/ui/booking-yoga.svg';
  const instructorName = course.coach?.name || '待安排';
  const instructorDescription = course.coach?.bio || '基于当前课程资料展示教练公开信息。';
  const sessionDate = featuredSession?.startsAt;
  const timeRange = formatTimeRange(featuredSession?.startsAt, featuredSession?.endsAt);
  const durationMinutes = getDurationMinutes(featuredSession?.startsAt, featuredSession?.endsAt, course.durationMinutes);
  const dateLabel = getDateLabel(sessionDate);
  const spots = getSessionSpots(featuredSession, course.maxCapacity);
  const totalSpots = getSessionTotal(featuredSession, course.maxCapacity);
  const usedSpots = Math.max(0, totalSpots - spots);
  const isFull = sortedSessions.length > 0
    ? sortedSessions.every((session) => getSessionSpots(session, course.maxCapacity) <= 0)
    : totalSpots > 0 && spots <= 0;
  const progress = totalSpots > 0 ? Math.round((usedSpots / totalSpots) * 100) : 0;
  const tags = [
    getLabelByValue(CourseTypes, course.type),
    getLabelByValue(CourseLevels, course.level),
    formatDurationMinutes(course.durationMinutes),
  ];
  const shouldGuideLogin = !profileLoadFailed && !member?.id;
  const canBook = Boolean(featuredSession) && !isFull && !booked && !shouldGuideLogin && !profileLoadFailed;
  const ctaDisabled = bookingLoading || (!profileLoadFailed && !shouldGuideLogin && !canBook && Boolean(featuredSession));
  const ctaLabel = bookingLoading
    ? '预约中…'
    : booked
      ? '已预约成功'
      : !featuredSession
        ? '查看全部课程'
        : profileLoadFailed
          ? '重新同步资料'
          : shouldGuideLogin
            ? '登录后预约'
            : isFull
              ? '已约满'
              : sortedSessions.length > 1
                ? '选择场次预约'
                : '立即预约';

  const handleCtaClick = () => {
    if (ctaDisabled) {
      return;
    }

    if (!featuredSession) {
      Taro.switchTab({ url: '/pages/courses/index' });
      return;
    }

    if (profileLoadFailed) {
      fetchData(course.id);
      return;
    }

    if (shouldGuideLogin) {
      handleLoginAndReload();
      return;
    }

    void handleBooking();
  };

  return (
    <View className='course-detail-page'>
      <FloatingBackButton fallbackUrl='/pages/courses/index' theme='light' />
      <ScrollView className='course-detail-page__scroll' scrollY showScrollbar={false}>
        <View className='course-detail-page__hero'>
          <Image className='course-detail-page__hero-image' src={heroImageSrc || heroImageFallback} mode='aspectFill' onError={() => setHeroImageSrc(heroImageFallback)} />
          <View className='course-detail-page__hero-mask' />
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
              <Text className='course-detail-page__duration'>{formatDurationMinutes(durationMinutes)}</Text>
              <Text className='course-detail-page__date-label'>{dateLabel}</Text>
            </View>

            <Text className='course-detail-page__date-value'>{formatDate(sessionDate)}</Text>

            <Divider spacing='none' />

            <View className='course-detail-page__meta-row'>
              <Icon name='pin' className='course-detail-page__meta-icon' />
              <View>
                <Text className='course-detail-page__meta-title'>课程教室</Text>
                <Text className='course-detail-page__meta-desc'>CareMe练习记录</Text>
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
            <AppCard>
              <Text className='course-detail-page__about'>{course.description || '暂无课程介绍'}</Text>
              {shouldGuideLogin ? (
                <View className='course-detail-page__error-action'>
                  <AppButton size='small' variant='outline' onClick={handleLoginAndReload}>登录同步后预约</AppButton>
                </View>
              ) : null}
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
                <Empty
                  title='暂无课程安排'
                  description='当前课程暂未开放可预约场次，可返回课程列表继续浏览。'
                  actionLabel='返回课程列表'
                  onActionClick={() => Taro.switchTab({ url: '/pages/courses/index' })}
                />
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
              disabled={ctaDisabled}
              loading={bookingLoading}
              onClick={handleCtaClick}
            >
              {ctaLabel}
            </AppButton>
          )}
        </View>
      </View>

      {sessionPickerOpen ? (
        <View className='course-detail-page__session-picker'>
          <View className='course-detail-page__session-picker-mask' onClick={() => setSessionPickerOpen(false)} />
          <View className='course-detail-page__session-picker-panel'>
            <View className='course-detail-page__session-picker-head'>
              <View>
                <Text className='course-detail-page__session-picker-title'>选择预约场次</Text>
                <Text className='course-detail-page__session-picker-desc'>请选择一个可预约时间</Text>
              </View>
              <View className='course-detail-page__session-picker-close' onClick={() => setSessionPickerOpen(false)}>
                关闭
              </View>
            </View>

            <ScrollView className='course-detail-page__session-picker-list' scrollY showScrollbar={false}>
              {sortedSessions.map((session) => {
                const sessionSpots = getSessionSpots(session, course.maxCapacity);
                const sessionDisabled = sessionSpots <= 0 || bookingLoading;

                return (
                  <View
                    key={session.id}
                    className={`course-detail-page__session-option ${sessionDisabled ? 'course-detail-page__session-option--disabled' : ''}`}
                    onClick={() => {
                      if (sessionDisabled) {
                        return;
                      }

                      void handleBooking(session);
                    }}
                  >
                    <View className='course-detail-page__session-option-main'>
                      <Text className='course-detail-page__session-option-date'>{formatDate(session.startsAt)} · {getDateLabel(session.startsAt)}</Text>
                      <Text className='course-detail-page__session-option-time'>{formatTimeRange(session.startsAt, session.endsAt)}</Text>
                    </View>
                    <Text className='course-detail-page__session-option-spots'>{sessionSpots > 0 ? `余 ${sessionSpots} 位` : '已约满'}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}
