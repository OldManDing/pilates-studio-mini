import Taro from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import ProfileAccountCard from './components/ProfileAccountCard';
import ProfileMenuSection from './components/ProfileMenuSection';
import ProfileSignOutButton from './components/ProfileSignOutButton';
import type {
  ProfileAccountCardData,
  ProfileMenuItemData,
  ProfileMenuSectionData,
  ProfileSignOutData,
} from './components/types';
import './index.scss';

// Static shell placeholder: replace with profile/member mappers after
// the new visual shell is approved.
const accountCardData: ProfileAccountCardData = {
  avatarText: '林',
  name: '林女士',
  badgeLabel: 'GOLD',
  phone: '138****6688',
  stats: [
    {
      key: 'courses',
      value: '86',
      unit: '节',
      label: '累计课程',
    },
    {
      key: 'hours',
      value: '129',
      unit: 'h',
      label: '训练时长',
    },
    {
      key: 'months',
      value: '14',
      unit: '月',
      label: '入会时长',
    },
  ],
};

// Future mapping: account page navigation config.
const menuSections: ProfileMenuSectionData[] = [
  {
    key: 'service',
    label: 'SERVICE',
    items: [
      {
        key: 'bookings',
        icon: 'bookings',
        label: '我的预约',
        description: '查看与管理课程预约',
        route: '/pages/my-bookings/index',
      },
      {
        key: 'records',
        icon: 'records',
        label: '训练记录',
        description: '历史训练数据与统计',
        route: '/pages/my-bookings/index',
      },
      {
        key: 'membership',
        icon: 'membership',
        label: '会员中心',
        description: '权益、续费与账户管理',
        route: '/pages/membership/index',
      },
    ],
  },
  {
    key: 'support',
    label: 'SUPPORT',
    items: [
      {
        key: 'notifications',
        icon: 'notifications',
        label: '消息通知',
        description: '课程提醒与系统通知',
      },
      {
        key: 'support',
        icon: 'support',
        label: '帮助与反馈',
        description: '常见问题与意见反馈',
      },
      {
        key: 'settings',
        icon: 'settings',
        label: '设置',
        description: '账户安全与偏好设置',
      },
    ],
  },
];

const signOutData: ProfileSignOutData = {
  label: '退出登录',
};

export default function Profile() {
  const handleMenuClick = (item: ProfileMenuItemData) => {
    if (item.route) {
      Taro.navigateTo({ url: item.route });
      return;
    }

    Taro.showToast({ title: '静态壳阶段，功能稍后接入', icon: 'none' });
  };

  const handleSignOut = async () => {
    const result = await Taro.showModal({
      title: '退出登录',
      content: '静态壳阶段先保留退出入口，后续接入正式账号体系。',
      confirmText: '退出',
    });

    if (!result.confirm) {
      return;
    }

    Taro.removeStorageSync('token');
    Taro.showToast({ title: '已退出登录', icon: 'success' });
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <ScrollView className='profile-shell' scrollY enhanced showScrollbar={false}>
      <View className='profile-shell__content'>
        <View className='profile-shell__heading'>
          <Text className='profile-shell__eyebrow'>MY ACCOUNT</Text>
        </View>

        <ProfileAccountCard data={accountCardData} />

        {menuSections.map((section) => (
          <ProfileMenuSection key={section.key} data={section} onItemClick={handleMenuClick} />
        ))}

        <ProfileSignOutButton data={signOutData} onClick={handleSignOut} />
      </View>
    </ScrollView>
  );
}
