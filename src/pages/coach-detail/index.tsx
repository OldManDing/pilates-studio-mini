import { useState, useCallback, useMemo } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import { coachesApi, Coach } from '../../api/coaches';
import { CourseSession } from '../../api/courses';
import { AppButton, AppCard, Divider, Empty, FloatingBackButton, Icon, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import { getLabelByValue, CourseTypes, Weekdays } from '../../constants/enums';
import { formatDurationMinutes } from '../../utils/ui';
import './index.scss';

const COACH_SCHEDULE_TIMEOUT_MS = 12000;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateLabel(value?: string) {
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

function getDurationMinutes(start?: string, end?: string) {
  if (!start || !end) {
    return 0;
  }

  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.round(diff / (1000 * 60));
}

function getWeekdayLabel(value?: string) {
  if (!value) {
    return '待定';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '待定';
  }

  const weekday = Weekdays.find((item) => item.value === date.getDay())?.label;
  return weekday || '待定';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    }),
    timeoutPromise,
  ]);
}

export default function CoachDetail() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [schedule, setSchedule] = useState<CourseSession[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleLoadFailed, setScheduleLoadFailed] = useState(false);
  const [coachId, setCoachId] = useState('');
  const [coachIdMissing, setCoachIdMissing] = useState(false);

  const fetchScheduleData = useCallback(async (id: string) => {
    try {
      setScheduleLoading(true);
      setScheduleLoadFailed(false);

      const scheduleRes = await withTimeout(
        coachesApi.getSchedule(id, { from: new Date().toISOString() }),
        COACH_SCHEDULE_TIMEOUT_MS,
        '教练排课加载超时',
      );

      setSchedule(scheduleRes.data.sessions || []);
    } catch {
      setSchedule([]);
      setScheduleLoadFailed(true);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setLoadFailed(false);
      setCoachIdMissing(false);
      setCoach(null);
      setSchedule([]);
      setScheduleLoading(true);
      setScheduleLoadFailed(false);

      const coachRes = await coachesApi.getById(id);
      const selectedCoach = coachRes.data.coach;

      if (!selectedCoach) {
        throw new Error('教练不存在');
      }

      setCoach(selectedCoach);
      void fetchScheduleData(id);
    } catch {
      setLoadFailed(true);
      setCoach(null);
      setSchedule([]);
      setScheduleLoading(false);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [fetchScheduleData]);

  useLoad((options) => {
    if (options?.id) {
      setCoachId(options.id);
      fetchData(options.id);
      return;
    }

    setLoading(false);
    setCoachIdMissing(true);
  });

  const upcomingSchedule = useMemo(() => {
    return [...schedule].sort((left, right) => {
      const leftTime = new Date(left.startsAt).getTime();
      const rightTime = new Date(right.startsAt).getTime();

      const safeLeft = Number.isNaN(leftTime) ? Number.MAX_SAFE_INTEGER : leftTime;
      const safeRight = Number.isNaN(rightTime) ? Number.MAX_SAFE_INTEGER : rightTime;

      return safeLeft - safeRight;
    });
  }, [schedule]);

  if (loading) {
    return (
      <PageShell safeAreaBottom>
        <PageHeader title='教练详情' subtitle='正在同步教练资料' fallbackUrl='/pages/coaches/index' />
        <AppCard>
          <Loading compact />
        </AppCard>
      </PageShell>
    );
  }

  if (!coach) {
    const emptyTitle = coachIdMissing ? '教练信息缺失' : loadFailed ? '教练加载失败' : '教练不存在';
    const emptySubtitle = coachIdMissing
      ? '缺少教练编号，请返回教练列表重新选择'
      : loadFailed
        ? '网络异常或教练信息暂时不可用'
        : '该教练可能已下架或链接已失效';
    const emptyDescription = coachIdMissing
      ? '当前入口没有携带教练编号，无法定位要查看的教练。请返回教练列表重新选择。'
      : loadFailed
        ? '请检查网络后重试，或返回教练列表重新选择。'
        : '请返回教练列表重新选择。';
    const canRetryCoachLoad = loadFailed && Boolean(coachId);

    return (
      <PageShell safeAreaBottom>
        <PageHeader title={emptyTitle} subtitle={emptySubtitle} fallbackUrl='/pages/coaches/index' />
        <AppCard>
          <Empty title={emptyTitle} description={emptyDescription} />
          {canRetryCoachLoad ? (
            <View className='coach-detail-page__error-action'>
              <AppButton size='medium' variant='primary' onClick={() => fetchData(coachId)}>
                重新加载
              </AppButton>
            </View>
          ) : (
            <View className='coach-detail-page__error-action'>
              <AppButton size='medium' variant='outline' onClick={() => Taro.redirectTo({ url: '/pages/coaches/index' })}>
                返回教练列表
              </AppButton>
            </View>
          )}
        </AppCard>
      </PageShell>
    );
  }

  const heroImage = coach.avatar || '/assets/ui/booking-dark.svg';
  const coachName = coach.name || '未命名教练';
  const specialties = coach.specialties || [];
  const certifications = coach.certifications || [];
  const courseSummaryMap = new Map<string, { type?: string }>();
  (coach.courses || []).forEach((course) => {
    if (course.id) {
      courseSummaryMap.set(course.id, course);
    }
  });
  upcomingSchedule.forEach((session) => {
    const sessionCourseId = session.course?.id || session.courseId;
    if (sessionCourseId) {
      courseSummaryMap.set(sessionCourseId, { type: session.course?.type });
    }
  });
  const totalCourses = courseSummaryMap.size;

  const trainingTypeTags = Array.from(
    new Set(
      Array.from(courseSummaryMap.values())
        .map((course) => (course.type ? getLabelByValue(CourseTypes, course.type) : ''))
        .filter(Boolean),
    ),
  );

  const handlePhoneClick = () => {
    if (!coach.phone) {
      Taro.showToast({ title: '暂无联系电话', icon: 'none' });
      return;
    }

    Taro.makePhoneCall({ phoneNumber: coach.phone });
  };

  const handleEmailClick = () => {
    if (!coach.email) {
      Taro.showToast({ title: '暂无邮箱', icon: 'none' });
      return;
    }

    Taro.setClipboardData({
      data: coach.email,
      success: () => {
        Taro.showToast({ title: '邮箱已复制', icon: 'success' });
      },
    });
  };

  return (
    <View className='coach-detail-page'>
      <FloatingBackButton fallbackUrl='/pages/coaches/index' theme='light' />
      <View className='coach-detail-page__hero'>
        <Image className='coach-detail-page__hero-image' src={heroImage} mode='aspectFill' />
        <View className='coach-detail-page__hero-mask' />
        <View className='coach-detail-page__hero-text'>
          <Text className='coach-detail-page__subtitle'>教练档案</Text>
          <Text className='coach-detail-page__title'>{coachName}</Text>
        </View>
      </View>

      <View className='coach-detail-page__body'>
        <AppCard className='coach-detail-page__info-card'>
          <View className='coach-detail-page__identity'>
            <View className='coach-detail-page__avatar-wrap'>
              {coach.avatar ? (
                <Image className='coach-detail-page__avatar-image' src={coach.avatar} mode='aspectFill' />
              ) : (
                <Text className='coach-detail-page__avatar-text'>{coachName.slice(0, 1)}</Text>
              )}
            </View>

            <View className='coach-detail-page__identity-content'>
              <Text className='coach-detail-page__identity-name'>{coachName}</Text>
              <Text className='coach-detail-page__identity-meta'>
                {coach.isActive ? '排课中' : '未排课'} · {totalCourses} 门课程
              </Text>
            </View>
          </View>

          <Divider spacing='none' />

          <View className='coach-detail-page__meta-row coach-detail-page__meta-row--clickable' onClick={handlePhoneClick}>
            <Text className='coach-detail-page__meta-label'>电话</Text>
            <Text className='coach-detail-page__meta-value'>{coach.phone || '暂无联系电话'}</Text>
          </View>

          <Divider spacing='none' />

          <View className='coach-detail-page__meta-row coach-detail-page__meta-row--clickable' onClick={handleEmailClick}>
            <Text className='coach-detail-page__meta-label'>邮箱</Text>
            <Text className='coach-detail-page__meta-value'>{coach.email || '暂无邮箱'}</Text>
          </View>
        </AppCard>

        <View className='coach-detail-page__section'>
          <SectionTitle
            eyebrow='介绍'
            title='教练介绍'
            subtitle='基于当前公开资料与排课信息'
          />

          <AppCard>
            <Text className='coach-detail-page__about'>
              {coach.bio || '暂无教练介绍，后续将补充训练背景与授课风格说明。'}
            </Text>
          </AppCard>
        </View>

        <View className='coach-detail-page__section'>
          <SectionTitle
            eyebrow='认证'
            title='认证与专长'
            subtitle='展示认证、专长方向与授课类型'
          />

          <AppCard>
            {certifications.length > 0 ? (
              <View className='coach-detail-page__qualification-list'>
                {certifications.map((certification, index) => (
                  <View key={`${certification}-${index}`} className='coach-detail-page__qualification-item'>
                    <Text className='coach-detail-page__qualification-dot' />
                    <Text className='coach-detail-page__qualification-text'>{certification}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className='coach-detail-page__hint'>暂无认证信息</Text>
            )}

            {(specialties.length > 0 || trainingTypeTags.length > 0) ? (
              <View className='coach-detail-page__tag-groups'>
                {specialties.length > 0 ? (
                  <View className='coach-detail-page__tag-row'>
                    {specialties.map((specialty, index) => (
                      <Text key={`${specialty}-${index}`} className='coach-detail-page__tag'>
                        {specialty}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {trainingTypeTags.length > 0 ? (
                  <View className='coach-detail-page__tag-row'>
                    {trainingTypeTags.map((tag, index) => (
                      <Text key={`${tag}-${index}`} className='coach-detail-page__tag coach-detail-page__tag--muted'>
                        {tag}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </AppCard>
        </View>

        <View className='coach-detail-page__section'>
          <SectionTitle
            eyebrow='排课'
            title='近期排课'
            subtitle='按时间升序展示即将开始的课程场次'
          />

          <AppCard padding='none' className='coach-detail-page__schedule-card'>
            {scheduleLoading ? (
              <View className='coach-detail-page__empty-wrap'>
                <Loading compact />
              </View>
            ) : scheduleLoadFailed ? (
              <View className='coach-detail-page__empty-wrap'>
                <Empty
                  title='近期排课加载失败'
                  description='请检查网络后重试，或返回教练列表重新选择。'
                  actionLabel='重新加载'
                  onActionClick={() => void fetchScheduleData(coachId || coach.id)}
                />
              </View>
            ) : upcomingSchedule.length > 0 ? (
              upcomingSchedule.map((session, index) => {
                const startDate = new Date(session.startsAt);
                const monthDay = Number.isNaN(startDate.getTime())
                  ? '--.--'
                  : `${pad(startDate.getMonth() + 1)}.${pad(startDate.getDate())}`;

                const duration = getDurationMinutes(session.startsAt, session.endsAt);

                return (
                  <View key={session.id}>
                    <View className='coach-detail-page__schedule-item'>
                      <View className='coach-detail-page__schedule-date'>
                        <Text className='coach-detail-page__schedule-day'>{monthDay}</Text>
                        <Text className='coach-detail-page__schedule-weekday'>{getWeekdayLabel(session.startsAt)}</Text>
                      </View>

                      <View className='coach-detail-page__schedule-content'>
                        <Text className='coach-detail-page__schedule-course'>{session.course?.name || '未知课程'}</Text>
                        <View className='coach-detail-page__schedule-meta-row'>
                          <Icon name='clock' className='coach-detail-page__schedule-meta-icon' />
                          <Text className='coach-detail-page__schedule-meta'>
                            {formatTimeRange(session.startsAt, session.endsAt)} · {formatDurationMinutes(duration)}
                          </Text>
                        </View>
                        <View className='coach-detail-page__schedule-meta-row'>
                          <Icon name='pin' className='coach-detail-page__schedule-meta-icon' />
                          <Text className='coach-detail-page__schedule-date-label'>{formatDateLabel(session.startsAt)}</Text>
                        </View>
                      </View>

                      <Text className='coach-detail-page__schedule-kind'>
                        {session.course?.type ? getLabelByValue(CourseTypes, session.course.type) : '待定'}
                      </Text>
                    </View>

                    {index < upcomingSchedule.length - 1 ? <Divider spacing='none' /> : null}
                  </View>
                );
              })
            ) : (
              <View className='coach-detail-page__empty-wrap'>
                <Empty
                  title='暂无排课'
                  description='这位教练近期暂未开放排课，可返回课程页查看其他可约课程。'
                  actionLabel='查看课程'
                  onActionClick={() => Taro.switchTab({ url: '/pages/courses/index' })}
                />
              </View>
            )}
          </AppCard>
        </View>

        <View className='coach-detail-page__spacer' />
      </View>
    </View>
  );
}
