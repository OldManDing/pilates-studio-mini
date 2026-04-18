import { useMemo, useState } from 'react';
import Taro, { useShareAppMessage } from '@tarojs/taro';
import { View } from '@tarojs/components';
import { PageShell, SectionTitle } from '../../components';
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
import './index.scss';

export default function Courses() {
  const [selectedDateKey, setSelectedDateKey] = useState('d1');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');

  useShareAppMessage(() => ({
    title: 'Pilates Studio - 预约课程',
    path: '/pages/courses/index',
  }));

  const heroData: BookingHeroData = {
    eyebrow: 'COURSE BOOKING',
    title: '预约课程',
    subtitle: '选择日期与课程类型',
    actionLabel: '我的预约',
  };

  const dateItems: BookingDateItemData[] = useMemo(
    () => [
      { key: 'd1', weekday: 'MON', day: '06', label: '今天', active: selectedDateKey === 'd1' },
      { key: 'd2', weekday: 'TUE', day: '07', label: '明天', active: selectedDateKey === 'd2' },
      { key: 'd3', weekday: 'WED', day: '08', active: selectedDateKey === 'd3' },
      { key: 'd4', weekday: 'THU', day: '09', active: selectedDateKey === 'd4' },
      { key: 'd5', weekday: 'FRI', day: '10', active: selectedDateKey === 'd5' },
      { key: 'd6', weekday: 'SAT', day: '11', active: selectedDateKey === 'd6' },
      { key: 'd7', weekday: 'SUN', day: '12', active: selectedDateKey === 'd7' },
    ],
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

  const courseItems: BookingCourseCardData[] = [
    {
      key: 'course-1',
      title: '流瑜伽进阶',
      time: '09:00',
      duration: '60min',
      instructor: '林静怡',
      location: '朝阳门店',
      spotsText: '余 3 位',
      imageKind: 'yoga',
    },
    {
      key: 'course-2',
      title: '普拉提塑形 · 核心',
      time: '10:30',
      duration: '50min',
      instructor: '陈思雨',
      location: '朝阳门店',
      spotsText: '余 6 位',
      imageKind: 'pilates',
    },
    {
      key: 'course-3',
      title: '冥想疗愈',
      time: '14:00',
      duration: '45min',
      instructor: '张悦欣',
      location: '朝阳门店',
      spotsText: '余 8 位',
      imageKind: 'meditation',
    },
    {
      key: 'course-4',
      title: '哈他瑜伽',
      time: '16:00',
      duration: '60min',
      instructor: '王梦瑶',
      location: '朝阳门店',
      spotsText: '已约满',
      imageKind: 'dark',
      full: true,
    },
    {
      key: 'course-5',
      title: '阴瑜伽 · 深度放松',
      time: '19:00',
      duration: '75min',
      instructor: '林静怡',
      location: '朝阳门店',
      spotsText: '余 5 位',
      imageKind: 'yoga',
    },
  ];

  const handleMyBookings = () => {
    Taro.navigateTo({ url: '/pages/my-bookings/index' });
  };

  const handleCourseClick = () => {
    Taro.navigateTo({ url: '/pages/course-detail/index?id=static-demo' });
  };

  const handleDateSelect = (key: BookingDateItemData['key']) => {
    setSelectedDateKey(key);
  };

  const handleCategorySelect = (key: BookingCategoryItemData['key']) => {
    setSelectedCategoryKey(key);
  };

  const courseDateMap: Record<string, BookingDateItemData['key'][]> = {
    'course-1': ['d1', 'd2'],
    'course-2': ['d1', 'd3'],
    'course-3': ['d1', 'd4'],
    'course-4': ['d2', 'd5'],
    'course-5': ['d3', 'd6'],
  };

  const courseCategoryMap: Record<string, BookingCategoryItemData['key']> = {
    'course-1': 'yoga',
    'course-2': 'pilates',
    'course-3': 'meditation',
    'course-4': 'yoga',
    'course-5': 'yoga',
  };

  const filteredCourseItems = useMemo(() => {
    return courseItems.filter((item) => {
      const matchesCategory = selectedCategoryKey === 'all' || courseCategoryMap[item.key] === selectedCategoryKey;
      const matchesDate = (courseDateMap[item.key] || []).includes(selectedDateKey);
      return matchesCategory && matchesDate;
    });
  }, [courseItems, selectedCategoryKey, selectedDateKey]);

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
            actionLabel={`${filteredCourseItems.length} 节`}
            actionTone='muted'
          />

          <View className='booking-page__list'>
            {filteredCourseItems.map((item) => (
              <BookingCourseCard key={item.key} data={item} onClick={handleCourseClick} />
            ))}
          </View>
        </View>
      </View>
    </PageShell>
  );
}
