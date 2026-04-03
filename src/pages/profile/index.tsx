import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { membersApi, Member } from '../../api/members';
import { Loading, Empty } from '../../components';
import './index.scss';

const MENU_ITEMS = [
  { icon: '📋', label: '我的预约', url: '/pages/my-bookings/index', color: '#43c7ab' },
  { icon: '💳', label: '会员卡', url: '/pages/membership/index', color: '#8b7cff' },
  { icon: '💰', label: '消费记录', url: '/pages/transactions/index', color: '#ffb760' },
  { icon: '👤', label: '个人信息', action: 'profile', color: '#ff8da8' },
  { icon: '📞', label: '联系我们', action: 'contact', color: '#35a090' },
  { icon: '⚙️', label: '设置', action: 'settings', color: '#6f8198' },
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await membersApi.getProfile().catch(() => ({ data: { member: null } }));
      setMember(res.data.member);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  usePullDownRefresh(() => {
    fetchProfile();
  });

  const handleMenuClick = (item: typeof MENU_ITEMS[0]) => {
    if (item.url) {
      Taro.navigateTo({ url: item.url });
    } else if (item.action === 'contact') {
      Taro.showModal({
        title: '联系我们',
        content: '客服电话：400-123-4567\n工作时间：周一至周日 9:00-21:00',
        showCancel: false,
      });
    } else if (item.action === 'settings') {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    } else if (item.action === 'profile') {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  const handleLogin = () => {
    Taro.showToast({ title: '请使用微信登录', icon: 'none' });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View className="profile">
      <ScrollView className="profile__content" scrollY enhanced showScrollbar={false}>
        {/* Header Card */}
        <View className="profile__header">
          <View className="profile__user-info">
            <Image
              className="profile__avatar"
              src={member?.avatar || '/assets/default-avatar.png'}
            />
            <View className="profile__user-meta">
              {member ? (
                <>
                  <Text className="profile__name">{member.name}</Text>
                  <Text className="profile__phone">{member.phone}</Text>
                </>
              ) : (
                <>
                  <Text className="profile__name" onClick={handleLogin}>点击登录</Text>
                  <Text className="profile__phone">登录后享受更多服务</Text>
                </>
              )}
            </View>
          </View>
          {member && (
            <View className="profile__stats">
              <View className="profile__stat">
                <Text className="profile__stat-value">0</Text>
                <Text className="profile__stat-label">已完成课程</Text>
              </View>
              <View className="profile__stat">
                <Text className="profile__stat-value">0</Text>
                <Text className="profile__stat-label">会员卡</Text>
              </View>
              <View className="profile__stat">
                <Text className="profile__stat-value">0</Text>
                <Text className="profile__stat-label">消费记录</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu List */}
        <View className="profile__menu">
          {MENU_ITEMS.map((item, index) => (
            <View
              key={index}
              className="profile__menu-item"
              onClick={() => handleMenuClick(item)}
            >
              <View
                className="profile__menu-icon"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                <Text>{item.icon}</Text>
              </View>
              <Text className="profile__menu-label">{item.label}</Text>
              <Text className="profile__menu-arrow">›</Text>
            </View>
          ))}
        </View>

        {/* Version Info */}
        <View className="profile__footer">
          <Text className="profile__version">Pilates Studio v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
