import Taro, { useShareAppMessage } from '@tarojs/taro';
import { ScrollView, View } from '@tarojs/components';
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
  useShareAppMessage(() => ({
    title: 'Pilates Studio - 预约课程',
    path: '/pages/courses/index',
  }));

  // Static shell data anchors: replace with API mappers after visual direction is approved.
  const heroData: BookingHeroData = {
    eyebrow: 'COURSE BOOKING',
    title: '预约课程',
    subtitle: '选择日期与课程类型',
    actionLabel: '我的预约',
  };

  const dateItems: BookingDateItemData[] = [
    { key: 'd1', weekday: 'MON', day: '06', label: '今天', active: true },
    { key: 'd2', weekday: 'TUE', day: '07', label: '明天' },
    { key: 'd3', weekday: 'WED', day: '08' },
    { key: 'd4', weekday: 'THU', day: '09' },
    { key: 'd5', weekday: 'FRI', day: '10' },
    { key: 'd6', weekday: 'SAT', day: '11' },
    { key: 'd7', weekday: 'SUN', day: '12' },
  ];

  const categoryItems: BookingCategoryItemData[] = [
    { key: 'all', label: '全部', active: true },
    { key: 'yoga', label: '瑜伽' },
    { key: 'pilates', label: '普拉提' },
    { key: 'meditation', label: '冥想' },
  ];

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

  return (
    <ScrollView className='booking-shell' scrollY enhanced showScrollbar={false}>
      <View className='booking-shell__content'>
        <BookingHero data={heroData} onActionClick={handleMyBookings} />
        <BookingDateStrip items={dateItems} />
        <BookingCategoryPills items={categoryItems} />

        <View className='booking-shell__section-head'>
          <View className='booking-shell__section-title'>可预约课程</View>
          <View className='booking-shell__section-count'>5 节</View>
        </View>

        <View className='booking-shell__list'>
          {courseItems.map((item) => (
            <BookingCourseCard key={item.key} data={item} onClick={handleCourseClick} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
