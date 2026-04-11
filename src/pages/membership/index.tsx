import { useState, useEffect, useCallback, useMemo } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { membersApi, Membership as MembershipType } from '../../api/members';
import { membershipPlansApi, MembershipPlan } from '../../api/membershipPlans';
import { Loading } from '../../components';
import './index.scss';

type BenefitItem = {
  key: string;
  marker: string;
  label: string;
  description: string;
};

type ActivityItem = {
  id: string;
  date: string;
  title: string;
  tag: string;
};

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function formatDisplayDate(dateString?: string) {
  if (!dateString) {
    return '--.--.--';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '--.--.--';
  }

  return `${date.getFullYear()}.${padNumber(date.getMonth() + 1)}.${padNumber(date.getDate())}`;
}

function getRemainingDays(endDate?: string) {
  if (!endDate) {
    return 0;
  }

  const diff = new Date(endDate).getTime() - Date.now();

  if (Number.isNaN(diff)) {
    return 0;
  }

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getRemainingRatio(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const total = end - start;
  const remaining = end - Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
}

function isMembershipUsable(membership: MembershipType) {
  if (!membership.isActive) {
    return false;
  }

  const end = new Date(membership.endDate).getTime();

  if (Number.isNaN(end) || end < Date.now()) {
    return false;
  }

  return membership.remainingCredits > 0;
}

function getMembershipStatusLabel(membership: MembershipType) {
  if (!membership.isActive) {
    return '未生效';
  }

  const end = new Date(membership.endDate).getTime();

  if (!Number.isNaN(end) && end < Date.now()) {
    return '已过期';
  }

  if (membership.remainingCredits <= 0) {
    return '次数用尽';
  }

  return '生效中';
}

export default function Membership() {
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<MembershipType[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [membershipsRes, plansRes] = await Promise.all([
        membersApi.getMyMemberships().catch(() => ({ data: { memberships: [] as MembershipType[] } })),
        membershipPlansApi.getActive().catch(() => ({ data: { plans: [] as MembershipPlan[] } })),
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

  const sortedMemberships = useMemo(() => {
    return [...memberships].sort((left, right) => {
      const leftTime = new Date(left.endDate).getTime();
      const rightTime = new Date(right.endDate).getTime();
      const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;

      return safeRight - safeLeft;
    });
  }, [memberships]);

  const currentMembership = useMemo(() => {
    return sortedMemberships.find(isMembershipUsable)
      || sortedMemberships.find((membership) => membership.isActive)
      || sortedMemberships[0]
      || null;
  }, [sortedMemberships]);

  const activeMembershipCount = memberships.filter(isMembershipUsable).length;
  const totalRemainingCredits = memberships.reduce((sum, membership) => sum + Math.max(0, membership.remainingCredits), 0);
  const totalCredits = memberships.reduce((sum, membership) => sum + Math.max(0, membership.totalCredits), 0);
  const totalUsedCredits = memberships.reduce(
    (sum, membership) => sum + Math.max(0, membership.totalCredits - membership.remainingCredits),
    0,
  );
  const remainingDays = currentMembership ? getRemainingDays(currentMembership.endDate) : 0;
  const progressRatio = currentMembership ? getRemainingRatio(currentMembership.startDate, currentMembership.endDate) : 0;
  const featuredPlans = plans.slice(0, 3);
  const overviewPrimaryValue = memberships.length > 0 ? String(totalUsedCredits) : '--';
  const overviewRemainingValue = memberships.length > 0 ? String(totalRemainingCredits) : '--';
  const overviewCardValue = memberships.length > 0 ? String(activeMembershipCount) : '--';

  const benefitItems: BenefitItem[] = [
    {
      key: 'current',
      marker: '01',
      label: '全场通用',
      description: currentMembership
        ? `${currentMembership.planName || '会员卡'} 当前可覆盖训练课程，剩余 ${currentMembership.remainingCredits}/${currentMembership.totalCredits} 次。`
        : '开通会员后，可按当前开放方案使用课程权益。',
    },
    {
      key: 'coverage',
      marker: '02',
      label: '优先预约',
      description: plans.length > 0
        ? `当前开放 ${plans.length} 种会员方案，可根据训练频率选择合适周期。`
        : '会员开放后，可优先查看并预约适合自己的训练安排。',
    },
    {
      key: 'service',
      marker: '03',
      label: '专属服务',
      description: plans.length > 0
        ? `当前可查看 ${plans.length} 种在售会员方案，按你的训练频率灵活选择。`
        : '开通会员后，可集中查看续费、权益和训练状态。',
    },
  ];

  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    memberships.forEach((membership) => {
      const name = membership.planName || '会员卡';

      if (membership.startDate) {
        items.push({
          id: `${membership.id}-start`,
          date: membership.startDate,
          title: `${name} 已开通`,
          tag: '开通',
        });
      }

      if (membership.endDate) {
        items.push({
          id: `${membership.id}-end`,
          date: membership.endDate,
          title: `${name} ${membership.isActive ? `有效期至 ${formatDisplayDate(membership.endDate)}` : '状态已结束'}`,
          tag: membership.isActive ? '到期' : '状态',
        });
      }

      if (membership.totalCredits > 0) {
        items.push({
          id: `${membership.id}-credits`,
          date: membership.endDate || membership.startDate,
          title: `${name} 当前剩余 ${membership.remainingCredits}/${membership.totalCredits} 次`,
          tag: '权益',
        });
      }
    });

    return items
      .sort((left, right) => {
        const leftTime = new Date(left.date).getTime();
        const rightTime = new Date(right.date).getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;

        return safeRight - safeLeft;
      })
      .slice(0, 4);
  }, [memberships]);

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView className='membership' scrollY enhanced showScrollbar={false}>
      <View className='membership__content'>
        <View className='membership__section'>
          <View className='membership__status-card'>
            <View className='membership__status-top'>
              <View className='membership__status-badge'>
                <View className='membership__status-badge-dot' />
                <Text className='membership__status-badge-text'>GOLD</Text>
              </View>
              <Text className='membership__status-state'>{currentMembership ? 'ACTIVE' : 'PENDING'}</Text>
            </View>

            <Text className='membership__status-caption'>会员编号</Text>
            <Text className='membership__status-name'>{currentMembership ? `MEM-${formatDisplayDate(currentMembership.endDate).replace(/\./g, '')}` : '未开通会员'}</Text>
            <Text className='membership__status-code'>
              {currentMembership
                ? `${currentMembership.planName || '会员卡'} · ${getMembershipStatusLabel(currentMembership)}`
                : featuredPlans.length > 0
                  ? `当前可查看 ${featuredPlans.length} 种精选会员方案`
                  : '暂未获取到可展示的会员方案'}
            </Text>

            <View className='membership__status-stats'>
              <View className='membership__status-stat'>
                <Text className='membership__status-stat-label'>有效期至</Text>
                <Text className='membership__status-stat-value'>
                  {currentMembership ? formatDisplayDate(currentMembership.endDate) : '--.--.--'}
                </Text>
              </View>
              <View className='membership__status-stat membership__status-stat--right'>
                <Text className='membership__status-stat-label'>课程权益</Text>
                <Text className='membership__status-stat-value'>
                  {currentMembership ? `${currentMembership.totalCredits}次` : (featuredPlans[0] ? `${featuredPlans[0].totalCredits}次` : '--')}
                </Text>
              </View>
            </View>

            <View className='membership__status-progress'>
              <View className='membership__status-progress-track'>
                <View className='membership__status-progress-fill' style={{ width: `${progressRatio}%` }} />
              </View>
              <Text className='membership__status-progress-text'>
                {currentMembership ? `${remainingDays}天` : `${plans.length}种方案`}
              </Text>
            </View>

            <View className='membership__divider' />

            <View className='membership__actions'>
              <View className='membership__button membership__button--primary' onClick={() => Taro.navigateTo({ url: '/pages/transactions/index' })}>
                <Text className='membership__button-text membership__button-text--primary'>续费会员</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='membership__section'>
          <View className='membership__section-heading'>
            <Text className='membership__section-title'>会员权益</Text>
            <Text className='membership__section-subtitle'>BENEFITS</Text>
          </View>
          <View className='membership__panel'>
            {benefitItems.map((item, index) => (
              <View key={item.key}>
                <View className='membership__benefit-item'>
                  <View className='membership__benefit-marker'>
                    <Text className='membership__benefit-marker-text'>{item.marker}</Text>
                  </View>
                  <View className='membership__benefit-content'>
                    <Text className='membership__benefit-label'>{item.label}</Text>
                    <Text className='membership__benefit-desc'>{item.description}</Text>
                  </View>
                </View>
                {index < benefitItems.length - 1 ? <View className='membership__divider membership__divider--soft' /> : null}
              </View>
            ))}
          </View>
        </View>

        <View className='membership__section'>
          <View className='membership__section-heading'>
            <Text className='membership__section-title'>训练总览</Text>
            <Text className='membership__section-subtitle'>OVERVIEW</Text>
          </View>
          <View className='membership__panel membership__overview'>
            <View className='membership__overview-main'>
              <Text className='membership__overview-label'>USED</Text>
              <View className='membership__overview-value-row'>
                <Text className='membership__overview-value'>{overviewPrimaryValue}</Text>
                <Text className='membership__overview-unit'>次</Text>
              </View>
              <Text className='membership__overview-note'>累计总权益 {memberships.length > 0 ? `${totalCredits} 次` : '--'}</Text>
            </View>

            <View className='membership__overview-divider' />

            <View className='membership__overview-side'>
              <View className='membership__overview-side-item'>
                <Text className='membership__overview-side-label'>可用</Text>
                <View className='membership__overview-side-value-row'>
                  <Text className='membership__overview-side-value'>{overviewRemainingValue}</Text>
                  <Text className='membership__overview-side-unit'>次</Text>
                </View>
              </View>
              <View className='membership__overview-side-item'>
                <Text className='membership__overview-side-label'>生效卡</Text>
                <View className='membership__overview-side-value-row'>
                  <Text className='membership__overview-side-value'>{overviewCardValue}</Text>
                  <Text className='membership__overview-side-unit'>张</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className='membership__section'>
          <View className='membership__section-heading'>
            <Text className='membership__section-title'>近期记录</Text>
            <Text className='membership__section-subtitle'>ACTIVITY</Text>
          </View>
          <View className='membership__panel'>
            {activityItems.length > 0 ? activityItems.map((item, index) => (
              <View key={item.id}>
                <View className='membership__activity-item'>
                  <View className='membership__activity-meta'>
                    <Text className='membership__activity-title'>{item.title}</Text>
                    <Text className='membership__activity-date'>{formatDisplayDate(item.date)}</Text>
                  </View>
                  <Text className='membership__activity-tag'>{item.tag}</Text>
                </View>
                {index < activityItems.length - 1 ? <View className='membership__divider membership__divider--soft' /> : null}
              </View>
            )) : (
              <View className='membership__empty-state'>
                <Text className='membership__empty-title'>暂无会员动态</Text>
                <Text className='membership__empty-desc'>开通会员后，这里会显示你的会员开通与权益变化。</Text>
              </View>
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
