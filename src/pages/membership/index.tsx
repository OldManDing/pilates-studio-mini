import { useState, useEffect, useCallback } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { membersApi, Membership as MembershipType } from '../../api/members';
import { membershipPlansApi, MembershipPlan } from '../../api/membershipPlans';
import { Loading, Empty, Price } from '../../components';
import { PlanCategories } from '../../constants/enums';
import './index.scss';

export default function Membership() {
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<MembershipType[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'mine' | 'plans'>('mine');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [membershipsRes, plansRes] = await Promise.all([
        membersApi.getMyMemberships().catch(() => ({ data: { memberships: [] } })),
        membershipPlansApi.getActive(),
      ]);
      setMemberships(membershipsRes.data.memberships || []);
      setPlans(plansRes.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch membership data:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePullDownRefresh(() => {
    fetchData();
  });

  const getStatusText = (membership: MembershipType) => {
    if (!membership.isActive) return '已失效';
    const now = new Date();
    const endDate = new Date(membership.endDate);
    if (endDate < now) return '已过期';
    if (membership.remainingCredits <= 0) return '次数用尽';
    return '有效';
  };

  const getStatusClass = (membership: MembershipType) => {
    if (!membership.isActive) return 'membership__card-status--inactive';
    const now = new Date();
    const endDate = new Date(membership.endDate);
    if (endDate < now || membership.remainingCredits <= 0) return 'membership__card-status--expired';
    return 'membership__card-status--active';
  };

  return (
    <View className='membership'>
      {/* Tabs */}
      <View className='membership__tabs'>
        <View
          className={`membership__tab ${activeTab === 'mine' ? 'membership__tab--active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          <Text>我的会员卡</Text>
        </View>
        <View
          className={`membership__tab ${activeTab === 'plans' ? 'membership__tab--active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <Text>购买会员卡</Text>
        </View>
      </View>

      <ScrollView className='membership__content' scrollY enhanced showScrollbar={false}>
        {loading ? (
          <Loading />
        ) : activeTab === 'mine' ? (
          memberships.length > 0 ? (
            <View className='membership__list'>
              {memberships.map((membership) => (
                <View key={membership.id} className='membership__card'>
                  <View className='membership__card-header'>
                    <Text className='membership__card-name'>{membership.planName || '会员卡'}</Text>
                    <Text className={`membership__card-status ${getStatusClass(membership)}`}>
                      {getStatusText(membership)}
                    </Text>
                  </View>
                  <View className='membership__card-body'>
                    <View className='membership__card-stat'>
                      <Text className='membership__card-stat-value'>{membership.remainingCredits}</Text>
                      <Text className='membership__card-stat-label'>剩余次数</Text>
                    </View>
                    <View className='membership__card-stat'>
                      <Text className='membership__card-stat-value'>{membership.totalCredits}</Text>
                      <Text className='membership__card-stat-label'>总次数</Text>
                    </View>
                    <View className='membership__card-stat'>
                      <Text className='membership__card-stat-value'>
                        {Math.max(0, Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                      </Text>
                      <Text className='membership__card-stat-label'>剩余天数</Text>
                    </View>
                  </View>
                  <View className='membership__card-footer'>
                    <Text className='membership__card-date'>
                      有效期：{new Date(membership.startDate).toLocaleDateString()} 至 {new Date(membership.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Empty title='暂无会员卡' description='去购买一张会员卡开始您的普拉提之旅' />
          )
        ) : (
          plans.length > 0 ? (
            <View className='membership__plans'>
              {plans.map((plan) => (
                <View key={plan.id} className='membership__plan-card'>
                  <View className='membership__plan-header'>
                    <View className='membership__plan-info'>
                      <Text className='membership__plan-name'>{plan.name}</Text>
                      <Text className='membership__plan-code'>{plan.planCode}</Text>
                    </View>
                    <Price amount={plan.priceCents} size='large' />
                  </View>
                  <Text className='membership__plan-desc'>{plan.description || '暂无描述'}</Text>
                  <View className='membership__plan-tags'>
                    <Text className='membership__plan-tag'>{plan.totalCredits} 次</Text>
                    <Text className='membership__plan-tag'>{plan.validityDays} 天有效期</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Empty title='暂无可购买的会员卡' description='敬请期待' />
          )
        )}
      </ScrollView>
    </View>
  );
}
