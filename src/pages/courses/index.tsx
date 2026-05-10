import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Taro, { useDidShow, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { AppCard, Empty, Icon, Loading, PageShell, SectionTitle } from '../../components';
import { courseSessionsApi, type Course, type CourseSession } from '../../api/courses';
import BookingCategoryPills from './components/BookingCategoryPills';
import BookingCourseCard from './components/BookingCourseCard';
import BookingDateStrip from './components/BookingDateStrip';
import BookingHero from './components/BookingHero';
import type {
  BookingCategoryItemData,
  BookingCourseCardData,
  BookingDateItemData,
  BookingHeroData,
} from './components/types';
import { syncCustomTabBarSelected } from '../../utils/tabbar';
import { formatDurationMinutes, getSafeMiniImageSrc, getWeekdayLabel } from '../../utils/ui';
import { useMiniPageImage } from '../../hooks/useMiniPageImage';
import './index.scss';

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getCourseImageKind(type: Course['type']): BookingCourseCardData['imageKind'] {
  if (type === 'PRIVATE') {
    return 'meditation';
  }

  if (['MAT', 'REFORMER', 'CADILLAC', 'CHAIR', 'BARREL'].includes(type)) {
    return 'pilates';
  }

  return 'yoga';
}

function getCourseCategoryKey(type?: string) {
  if (!type) {
    return 'other';
  }

  if (type === 'PRIVATE') {
    return 'meditation';
  }

  if (['MAT', 'REFORMER', 'CADILLAC', 'CHAIR', 'BARREL'].includes(type)) {
    return 'pilates';
  }

  if (['YOGA', 'FLOW', 'STRETCH'].includes(type)) {
    return 'yoga';
  }

  return 'other';
}

async function fetchAllUpcomingSessions() {
  const pageSize = 50;
  const allSessions: CourseSession[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await courseSessionsApi.getUpcoming({ page: currentPage, limit: pageSize });
    allSessions.push(...(response.data.sessions || []));
    totalPages = response.data.meta?.totalPages || (response.data.sessions?.length === pageSize ? currentPage + 1 : currentPage);
    currentPage += 1;
  } while (currentPage <= totalPages);

  return allSessions;
}

export default function Courses() {
  const { imageSrc: coursesHeroImageSrc, refresh: refreshCoursesHeroImage } = useMiniPageImage('courses', '/assets/ui/hero-courses.jpg');
  const [selectedDateKey, setSelectedDateKey] = useState('date-0');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const initialFetchCompletedRef = useRef(false);

  useShareAppMessage(() => ({
    title: 'CareMe练习记录｜练习安排',
    path: '/pages/courses/index',
  }));

  useDidShow(() => {
    syncCustomTabBarSelected(1);
    void refreshCoursesHeroImage();

    if (initialFetchCompletedRef.current) {
      void fetchCourses();
    }
  });

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      setSessions(await fetchAllUpcomingSessions());
    } catch {
      setSessions([]);
      setLoadFailed(true);
      Taro.showToast({ title: '课程加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      initialFetchCompletedRef.current = true;
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  usePullDownRefresh(() => {
    void fetchCourses();
  });

  const heroData: BookingHeroData = {
    eyebrow: '课程预约',
    title: '预约课程',
    subtitle: '选择日期与课程类型',
    actionLabel: '我的预约',
    imageUrl: coursesHeroImageSrc,
  };

  const dateItems: BookingDateItemData[] = useMemo(
    () => {
      const today = new Date();
      return Array.from({ length: 14 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const key = `date-${index}`;
        return {
          key,
          weekday: getWeekdayLabel(date),
          day: String(date.getDate()).padStart(2, '0'),
          dateValue: formatDateKey(date),
          label: index === 0 ? '今天' : index === 1 ? '明天' : undefined,
          active: selectedDateKey === key,
        };
      });
    },
    [selectedDateKey],
  );

  const categoryItems: BookingCategoryItemData[] = useMemo(
    () => [
      { key: 'all', label: '全部', active: selectedCategoryKey === 'all' },
      { key: 'yoga', label: '瑜伽', active: selectedCategoryKey === 'yoga' },
      { key: 'pilates', label: '普拉提', active: selectedCategoryKey === 'pilates' },
      { key: 'meditation', label: '冥想', active: selectedCategoryKey === 'meditation' },
      { key: 'other', label: '其他', active: selectedCategoryKey === 'other' },
    ],
    [selectedCategoryKey],
  );

  const handleMyBookings = () => {
    Taro.navigateTo({ url: '/pages/my-bookings/index' });
  };

  const handleCourseItemClick = (item: BookingCourseCardData) => {
    if (!item.courseId) {
      Taro.showToast({ title: '课程信息暂未同步', icon: 'none' });
      return;
    }

    Taro.navigateTo({ url: `/pages/course-detail/index?id=${item.courseId}` });
  };

  const handleDateSelect = (key: BookingDateItemData['key']) => {
    setSelectedDateKey(key);
  };

  const handleCategorySelect = (key: BookingCategoryItemData['key']) => {
    setSelectedCategoryKey(key);
  };

  const handleResetFilters = () => {
    setSelectedDateKey('date-0');
    setSelectedCategoryKey('all');
  };

  const courseItems: BookingCourseCardData[] = useMemo(() => sessions.map((session) => {
    const course = session.course;
    const startsAt = session.startsAt ? new Date(session.startsAt) : null;
    const spots = Math.max(0, session.capacity - (session.bookedCount || 0));
    const courseType = course?.type || 'MAT';
    const durationMinutes = course?.durationMinutes || 0;
    const imageKind = getCourseImageKind(courseType);

    return {
      key: session.id,
      courseId: session.courseId || course?.id,
      title: course?.name || '未命名课程',
      imageUrl: getSafeMiniImageSrc(course?.coverImageUrl, imageKind === 'pilates' ? '/assets/ui/booking-pilates.svg' : imageKind === 'meditation' ? '/assets/ui/booking-meditation.svg' : '/assets/ui/booking-yoga.svg'),
      time: startsAt && !Number.isNaN(startsAt.getTime()) ? `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}` : '--:--',
      duration: formatDurationMinutes(durationMinutes, '待定'),
      instructor: session.coach?.name || '待安排',
      location: '门店待更新',
      spotsText: spots > 0 ? `余 ${spots} 位` : '已约满',
      imageKind,
      full: spots <= 0,
    };
  }), [sessions]);

  const filteredCourseItems = useMemo(() => {
    return courseItems.filter((item) => {
      const session = sessions.find((sessionItem) => sessionItem.id === item.key);
      const categoryKey = getCourseCategoryKey(session?.course?.type);
      const matchesCategory = selectedCategoryKey === 'all' || categoryKey === selectedCategoryKey;
      const selectedIndex = Number(selectedDateKey.replace('date-', ''));
      const selectedDate = dateItems[selectedIndex];
      const date = session?.startsAt ? new Date(session.startsAt) : null;
      const matchesDate = Boolean(date && !Number.isNaN(date.getTime()) && formatDateKey(date) === selectedDate?.dateValue);
      return matchesCategory && matchesDate;
    });
  }, [courseItems, sessions, dateItems, selectedCategoryKey, selectedDateKey]);

  const hasActiveFilters = selectedDateKey !== 'date-0' || selectedCategoryKey !== 'all';
  const courseCountLabel = `${filteredCourseItems.length} 节${hasActiveFilters ? ' · 可重置' : ''}`;

  return (
    <PageShell className='booking-page' reserveTabBarSpace flushTop>
      <View className='booking-page__content'>
        <BookingHero data={heroData} />

        <View className='booking-page__headline'>
          <View className='booking-page__headline-main'>
            <Text className='booking-page__headline-title'>{heroData.title}</Text>
            <Text className='booking-page__headline-subtitle'>{heroData.subtitle}</Text>
          </View>
          <Button className='booking-page__my-bookings' hoverClass='none' onClick={handleMyBookings}>
            <Text className='booking-page__my-bookings-text'>{heroData.actionLabel}</Text>
            <Icon name='chevron-right' className='booking-page__my-bookings-icon' />
          </Button>
        </View>

        <View className='booking-page__filters'>
          <BookingDateStrip items={dateItems} onSelect={handleDateSelect} />
          <BookingCategoryPills items={categoryItems} onSelect={handleCategorySelect} />
        </View>

        <View className='booking-page__section'>
          <SectionTitle
            title='可预约课程'
            actionLabel={courseCountLabel}
            actionTone='muted'
            onActionClick={hasActiveFilters ? handleResetFilters : undefined}
          />

          <View className='booking-page__list'>
            {loading ? (
              <Loading />
            ) : loadFailed ? (
              <AppCard className='booking-page__empty-card'>
                <Empty title='课程加载失败' description='请检查网络后重试。' actionLabel='重新加载' onActionClick={fetchCourses} />
              </AppCard>
            ) : filteredCourseItems.length > 0 ? (
              filteredCourseItems.map((item) => (
                <BookingCourseCard key={item.key} data={item} onClick={() => handleCourseItemClick(item)} />
              ))
            ) : (
              <AppCard className='booking-page__empty-card'>
                <Empty title='暂无课程' description='当前日期和分类暂无可预约课程，请切换条件再试。' actionLabel='重置筛选' onActionClick={handleResetFilters} />
              </AppCard>
            )}
          </View>
        </View>
      </View>
    </PageShell>
  );
}
