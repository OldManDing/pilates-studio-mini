import { useState, useCallback, useMemo } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import { coachesApi, Coach } from '../../api/coaches';
import { CourseSession } from '../../api/courses';
import { AppButton, AppCard, Divider, Empty, Icon, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import { getLabelByValue, CourseTypes, Weekdays } from '../../constants/enums';
import './index.scss';

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

export default function CoachDetail() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [schedule, setSchedule] = useState<CourseSession[]>([]);
  const [coachId, setCoachId] = useState('');

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const [coachRes, scheduleRes] = await Promise.all([
        coachesApi.getById(id),
        coachesApi.getSchedule(id, { from: new Date().toISOString() }),
      ]);
      setCoach(coachRes.data.coach);
      setSchedule(scheduleRes.data.sessions || []);
    } catch {
      setLoadFailed(true);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useLoad((options) => {
    if (options?.id) {
      setCoachId(options.id);
      fetchData(options.id);
      return;
    }

    setLoading(false);
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
    return <Loading />;
  }

  if (!coach) {
    return (
      <PageShell safeAreaBottom>
        <PageHeader title={loadFailed ? '教练加载失败' : '教练不存在'} subtitle={loadFailed ? '网络异常或教练信息暂时不可用' : '该教练可能已下架或链接已失效'} fallbackUrl='/pages/coaches/index' />
        <AppCard>
          <Empty title={loadFailed ? '教练加载失败' : '教练不存在'} description={loadFailed ? '请检查网络后重试，或返回教练列表重新选择。' : '请返回教练列表重新选择。'} />
          {loadFailed ? (
            <View className='coach-detail-page__error-action'>
              <AppButton size='small' variant='primary' onClick={() => fetchData(coachId)}>
                重新加载
              </AppButton>
            </View>
          ) : null}
        </AppCard>
      </PageShell>
    );
  }

  const heroImage = coach.avatar || '/assets/ui/booking-dark.svg';
  const coachName = coach.name || '未命名教练';
  const specialties = coach.specialties || [];
  const certifications = coach.certifications || [];
  const totalCourses = coach.courses?.length || 0;

  const trainingTypeTags = Array.from(new Set((coach.courses || []).map((course) => getLabelByValue(CourseTypes, course.type))));

  return (
    <View className='coach-detail-page'>
      <View className='coach-detail-page__hero'>
        <Image className='coach-detail-page__hero-image' src={heroImage} mode='aspectFill' />
        <View className='coach-detail-page__hero-mask' />

        <View
          className='coach-detail-page__back'
          onClick={async () => {
            try {
              await Taro.navigateBack({ delta: 1 });
            } catch {
              Taro.redirectTo({ url: '/pages/coaches/index' });
            }
          }}
        >
          <Icon name='chevron-left' className='coach-detail-page__back-icon' />
          <Text className='coach-detail-page__back-label'>返回</Text>
        </View>

        <View className='coach-detail-page__hero-text'>
          <Text className='coach-detail-page__subtitle'>COACH PROFILE</Text>
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

          <View className='coach-detail-page__meta-row'>
            <Text className='coach-detail-page__meta-label'>电话</Text>
            <Text className='coach-detail-page__meta-value'>{coach.phone || '--'}</Text>
          </View>

          <Divider spacing='none' />

          <View className='coach-detail-page__meta-row'>
            <Text className='coach-detail-page__meta-label'>邮箱</Text>
            <Text className='coach-detail-page__meta-value'>{coach.email || '--'}</Text>
          </View>
        </AppCard>

        <View className='coach-detail-page__section'>
          <SectionTitle
            eyebrow='ABOUT'
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
            eyebrow='QUALIFICATIONS'
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
            eyebrow='SCHEDULE'
            title='近期排课'
            subtitle='按时间升序展示即将开始的课程场次'
          />

          <AppCard padding='none' className='coach-detail-page__schedule-card'>
            {upcomingSchedule.length > 0 ? (
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
                            {formatTimeRange(session.startsAt, session.endsAt)} · {duration > 0 ? `${duration}min` : '--min'}
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
                <Empty title='暂无排课' description='敬请期待' />
              </View>
            )}
          </AppCard>
        </View>

        <View className='coach-detail-page__spacer' />
      </View>
    </View>
  );
}
