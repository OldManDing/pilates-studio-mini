import Taro, { useShareAppMessage } from '@tarojs/taro';
import { ScrollView, View } from '@tarojs/components';
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
import './index.scss';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function formatShellDate(date: Date) {
  return `${date.getFullYear()} · ${padNumber(date.getMonth() + 1)} · ${padNumber(date.getDate())} ${WEEKDAY_LABELS[date.getDay()]}`;
}

export default function Index() {
  useShareAppMessage(() => ({
    title: 'Pilates Studio - 专业普拉提工作室',
    path: '/pages/index/index',
  }));

  // Static shell data anchors: replace these view models with API mappers
  // after the visual direction is approved.
  const heroData: HomeHeroData = {
    eyebrow: 'HOME / MORNING RITUAL',
    dateLabel: formatShellDate(new Date()),
    badgeLabel: 'GOLD MEMBER',
    title: '早安，Mia',
    subtitle: '今天的首页先聚焦会员状态、预约动线与内容推荐，让后续 profile / booking / course 数据可以按区域接入。',
    profileCta: '查看我的资料',
  };

  // Future mapping: membersApi.getMyMemberships()
  const membershipData: HomeMembershipData = {
    label: 'MEMBERSHIP',
    status: '已生效',
    planName: 'Balanced Renewal Annual',
    description: '年度会员卡保持在轻盈、可续接的阅读节奏里，避免回到旧首页的功能看板感。',
    primaryMetricLabel: '剩余课次',
    primaryMetricValue: '18',
    secondaryMetricLabel: '有效期至',
    secondaryMetricValue: '2026.12.31',
    progressLabel: '春季训练周期',
    progressValue: '68%',
    primaryAction: '查看会员权益',
    secondaryAction: '预约下一节',
  };

  // Future mapping: bookingsApi.getMyBookings()
  const todayCourseData: HomeTodayCourseData = {
    label: 'TODAY COURSE',
    status: '已为你留位',
    timeRange: '18:30 – 19:25',
    duration: '55 min',
    title: 'Core Align Flow',
    meta: 'Luna 教练 · 朝阳门店',
    note: '到店前 15 分钟签到，课程结束后可直接续约下一节同主题训练。',
    primaryAction: '查看预约详情',
    secondaryAction: '进入预约页',
  };

  const serviceItems: HomeServiceItemData[] = [
    {
      key: 'booking',
      accent: 'mint',
      label: '预约课程',
      subtitle: 'BOOK',
      description: '快速进入课程页',
    },
    {
      key: 'membership',
      accent: 'violet',
      label: '会员权益',
      subtitle: 'MEMBER',
      description: '查看卡项与余额',
    },
    {
      key: 'records',
      accent: 'orange',
      label: '预约记录',
      subtitle: 'PLAN',
      description: '查看近期安排',
    },
    {
      key: 'courses',
      accent: 'pink',
      label: '精选课程',
      subtitle: 'CURATE',
      description: '进入内容推荐',
    },
  ];

  // Future mapping: bookingsApi.getMyBookings() aggregated monthly
  const monthlySummaryData: HomeMonthlySummaryData = {
    label: 'THIS MONTH',
    value: '06',
    unit: '节',
    description: '本月训练已经形成稳定节奏，首页壳层把主指标放大，右侧只保留两组辅助信息。',
    progressText: '月度节奏完成 72%',
    sideItems: [
      {
        key: 'duration',
        label: '训练时长',
        value: '05',
        unit: 'h',
        detail: '保持轻量但连续',
      },
      {
        key: 'focus',
        label: '本周重点',
        value: '03',
        unit: 'd',
        detail: '核心稳定 / 脊柱延展',
      },
    ],
  };

  // Future mapping: coursesApi.getAll()
  const curatedData: HomeCuratedData = {
    eyebrow: 'EDITOR’S PICK',
    caption: 'CURATED FOR TODAY',
    title: 'Reformer Reset Session',
    description: '把今日推荐做成更像内容编辑位的静态卡，而不是旧首页那种偏数据块的课程组件。',
    meta: '适合傍晚训练 · 低压恢复 · 55 分钟',
    cta: '查看课程',
    monogram: 'RR',
  };

  // Future mapping: bookingsApi.getMyBookings()
  const upcomingItems: HomeUpcomingItemData[] = [
    {
      key: 'upcoming-1',
      day: '13',
      weekday: 'MON',
      label: 'NEXT',
      title: 'Tower Strength Basics',
      description: 'Mia 教练 · 朝阳门店',
      meta: '19:00 – 19:55 · 55 min',
    },
    {
      key: 'upcoming-2',
      day: '15',
      weekday: 'WED',
      label: 'WEEK',
      title: 'Breath & Alignment Lab',
      description: 'Luna 教练 · 望京门店',
      meta: '18:20 – 19:10 · 小班预约',
    },
    {
      key: 'upcoming-3',
      day: '17',
      weekday: 'FRI',
      label: 'PLAN',
      title: 'Slow Core Evening Flow',
      description: 'Nora 教练 · 朝阳门店',
      meta: '20:00 – 20:50 · 50 min',
    },
  ];

  const studioData: HomeStudioData = {
    label: 'YOUR STUDIO',
    name: '朝阳门店',
    address: '朝阳区建国门外大街 1 号',
    hours: '营业时间 08:00 – 22:00',
    note: '当前阶段保留门店信息位，后续可接入真实门店与地图信息。',
    actionLabel: '导航前往',
  };

  const handleProfileClick = () => {
    Taro.switchTab({ url: '/pages/profile/index' });
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
      case 'records':
        handleBookingsEntry();
        break;
      default:
        break;
    }
  };

  const handleStudioClick = () => {
    Taro.showToast({ title: '静态壳阶段，地图稍后接入', icon: 'none' });
  };

  return (
    <ScrollView className='home-shell' scrollY enhanced showScrollbar={false}>
      <View className='home-shell__content'>
        <HomeHero data={heroData} onProfileClick={handleProfileClick} />

        <HomeMembershipCard
          data={membershipData}
          onPrimaryClick={handleMembershipPrimary}
          onSecondaryClick={handleCoursesEntry}
        />

        <HomeTodayCourseCard
          data={todayCourseData}
          onPrimaryClick={handleBookingsEntry}
          onSecondaryClick={handleCoursesEntry}
        />

        <HomeServiceBand items={serviceItems} onItemClick={handleServiceClick} />

        <HomeMonthlySummary data={monthlySummaryData} />

        <HomeCuratedCard data={curatedData} onClick={handleCoursesEntry} />

        <HomeUpcomingList data={upcomingItems} onMoreClick={handleBookingsEntry} />

        <HomeStudioCard data={studioData} onClick={handleStudioClick} />
      </View>
    </ScrollView>
  );
}
