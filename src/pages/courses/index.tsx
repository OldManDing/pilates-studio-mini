import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro';
import { View } from '@tarojs/components';
import { AppButton, AppCard, Empty, Loading, PageShell, SectionTitle } from '../../components';
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
  const [selectedDateKey, setSelectedDateKey] = useState('date-0');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sessions, setSessions] = useState<CourseSession[]>([]);

  useShareAppMessage(() => ({
    title: 'Pilates Studio - 预约课程',
    path: '/pages/courses/index',
  }));

  useDidShow(() => {
    syncCustomTabBarSelected(1);
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
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const heroData: BookingHeroData = {
    eyebrow: 'COURSE BOOKING',
    title: '预约课程',
    subtitle: '选择日期与课程类型',
    actionLabel: '我的预约',
  };

  const dateItems: BookingDateItemData[] = useMemo(
    () => {
      const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const today = new Date();
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const key = `date-${index}`;
        return {
          key,
          weekday: weekdays[date.getDay()],
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
    ],
    [selectedCategoryKey],
  );

  const handleMyBookings = () => {
    Taro.navigateTo({ url: '/pages/my-bookings/index' });
  };

  const handleCourseItemClick = (item: BookingCourseCardData) => {
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
      courseId: session.courseId || course?.id || session.id,
      title: course?.name || '未命名课程',
      time: startsAt && !Number.isNaN(startsAt.getTime()) ? `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}` : '--:--',
      duration: durationMinutes > 0 ? `${durationMinutes}min` : '待定',
      instructor: session.coach?.name || '待安排',
      location: '朝阳门店',
      spotsText: spots > 0 ? `余 ${spots} 位` : '已约满',
      imageKind,
      full: spots <= 0,
    };
  }), [sessions]);

  const filteredCourseItems = useMemo(() => {
    return courseItems.filter((item) => {
      const session = sessions.find((sessionItem) => sessionItem.id === item.key);
      const categoryKey = item.imageKind === 'pilates' ? 'pilates' : item.imageKind === 'meditation' ? 'meditation' : 'yoga';
      const matchesCategory = selectedCategoryKey === 'all' || categoryKey === selectedCategoryKey;
      const selectedIndex = Number(selectedDateKey.replace('date-', ''));
      const selectedDate = dateItems[selectedIndex];
      const date = session?.startsAt ? new Date(session.startsAt) : null;
      const matchesDate = Boolean(date && !Number.isNaN(date.getTime()) && formatDateKey(date) === selectedDate?.dateValue);
      return matchesCategory && matchesDate;
    });
  }, [courseItems, sessions, dateItems, selectedCategoryKey, selectedDateKey]);

  const hasActiveFilters = selectedDateKey !== 'date-0' || selectedCategoryKey !== 'all';

  return (
    <PageShell className='booking-page' reserveTabBarSpace>
      <View className='booking-page__content'>
        <BookingHero data={heroData} onActionClick={handleMyBookings} />

        <View className='booking-page__filters'>
          <BookingDateStrip items={dateItems} onSelect={handleDateSelect} />
          <BookingCategoryPills items={categoryItems} onSelect={handleCategorySelect} />
        </View>

        <View className='booking-page__section'>
          <SectionTitle
            title='可预约课程'
            actionLabel={hasActiveFilters ? '重置筛选' : `${filteredCourseItems.length} 节`}
            actionTone='muted'
            onActionClick={hasActiveFilters ? handleResetFilters : undefined}
          />

          <View className='booking-page__list'>
            {loading ? (
              <Loading />
            ) : loadFailed ? (
              <AppCard className='booking-page__empty-card'>
                <Empty title='课程加载失败' description='请检查网络后重试。' />
                <AppButton size='small' variant='primary' onClick={fetchCourses}>重新加载</AppButton>
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
