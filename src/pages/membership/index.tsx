import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { membersApi, Membership as MembershipType } from '../../api/members';
import { membershipPlansApi, MembershipPlan } from '../../api/membershipPlans';
import { AppButton, AppCard, Divider, Empty, Icon, Loading, PageHeader, PageShell } from '../../components';
import './index.scss';

type BenefitItem = {
  key: string;
  icon: 'star' | 'bolt' | 'spark';
  label: string;
  description: string;
};

type ActivityItem = {
  id: string;
  date: string;
  title: string;
  type: 'consume' | 'renew';
};

function pad(value: number) {
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

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
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

function getDurationMonths(startDate?: string) {
  if (!startDate) {
    return 0;
  }

  const start = new Date(startDate);

  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, months || (now.getDate() >= start.getDate() ? 1 : 0));
}

function isMembershipUsable(membership: MembershipType) {
  if (!membership.isActive) {
    return false;
  }

  const end = new Date(membership.endDate).getTime();

  if (Number.isNaN(end) || end < Date.now()) {
    return false;
  }

  return membership.totalCredits <= 0 || membership.remainingCredits > 0;
}

function getMembershipStatusLabel(membership: MembershipType) {
  if (!membership.isActive) {
    return '未生效';
  }

  const end = new Date(membership.endDate).getTime();

  if (!Number.isNaN(end) && end < Date.now()) {
    return '已过期';
  }

  if (membership.totalCredits > 0 && membership.remainingCredits <= 0) {
    return '次数用尽';
  }

  return '生效中';
}

function getMembershipDisplayName(membership: MembershipType | null) {
  return membership?.planName || '年度金卡会员';
}

export default function Membership() {
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<MembershipType[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const [membershipsRes, plansRes] = await Promise.all([
        membersApi.getMyMemberships(),
        membershipPlansApi.getActive(),
      ]);

      const membershipsData = membershipsRes.data.memberships || [];
      const plansData = plansRes.data.plans || [];

      setMemberships(membershipsData);
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to fetch membership data:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
      setLoadFailed(true);
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

  const earliestMembership = useMemo(() => {
    if (memberships.length === 0) {
      return null;
    }

    const sorted = [...memberships].sort((left, right) => {
      const leftTime = new Date(left.startDate).getTime();
      const rightTime = new Date(right.startDate).getTime();
      const safeLeft = Number.isNaN(leftTime) ? Number.MAX_SAFE_INTEGER : leftTime;
      const safeRight = Number.isNaN(rightTime) ? Number.MAX_SAFE_INTEGER : rightTime;
      return safeLeft - safeRight;
    });

    return sorted[0] || null;
  }, [memberships]);

  const totalUsedCredits = memberships.reduce(
    (sum, membership) => sum + (membership.totalCredits > 0 ? Math.max(0, membership.totalCredits - membership.remainingCredits) : 0),
    0,
  );

  const remainingDays = currentMembership ? getRemainingDays(currentMembership.endDate) : 0;
  const progressRatio = currentMembership ? getRemainingRatio(currentMembership.startDate, currentMembership.endDate) : 0;
  const membershipMonths = earliestMembership ? getDurationMonths(earliestMembership.startDate) : 0;
  const estimatedHours = totalUsedCredits > 0 ? Math.round(totalUsedCredits * 1.5) : 0;

  const membershipCode = useMemo(() => {
    if (!currentMembership) {
      return 'LIN-0000-0000';
    }

    const prefix = (currentMembership.planName || 'LIN').slice(0, 3).toUpperCase().padEnd(3, 'X');
    const year = new Date(currentMembership.startDate || Date.now()).getFullYear();
    const suffix = currentMembership.id.slice(-4).toUpperCase().padStart(4, '0');
    return `${prefix}-${year}-${suffix}`;
  }, [currentMembership]);

  const benefitItems: BenefitItem[] = [
    {
      key: 'all',
      icon: 'star',
      label: '全场通用',
      description: '不限课程类型与时段',
    },
    {
      key: 'priority',
      icon: 'bolt',
      label: '优先预约',
      description: '提前 48 小时开放预约。',
    },
    {
      key: 'service',
      icon: 'spark',
      label: '专属服务',
      description: '免费体态评估 · 私教折扣。',
    },
  ];

  const activityItems = useMemo<ActivityItem[]>(() => {
    const rows: ActivityItem[] = [];

    memberships.forEach((membership) => {
      const name = membership.planName || '会员卡';
      if (membership.startDate) {
        rows.push({
          id: `${membership.id}-start`,
          date: membership.startDate,
          title: `${name} 开通`,
          type: 'renew',
        });
      }

      if (membership.endDate) {
        rows.push({
          id: `${membership.id}-end`,
          date: membership.endDate,
          title: `${name} 有效期至 ${formatDisplayDate(membership.endDate)}`,
          type: 'consume',
        });
      }

      rows.push({
        id: `${membership.id}-credits`,
        date: membership.endDate || membership.startDate,
        title: membership.totalCredits <= 0 ? `${name} 权益无限次` : `${name} 剩余 ${membership.remainingCredits}/${membership.totalCredits} 次`,
        type: 'consume',
      });
    });

    return rows
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
    <PageShell className='membership-page' safeAreaBottom>
      <View className='membership-page__content'>
        <PageHeader title='会员中心' subtitle='管理你的会员权益与服务' fallbackUrl='/pages/profile/index' />

        <View className='membership-page__section'>
          <AppCard className='membership-page__status-card' padding='none'>
            <View className='membership-page__status-main'>
              <View className='membership-page__status-top'>
                <View className='membership-page__status-badge-group'>
                  <View className='membership-page__status-badge'>
                    <View className='membership-page__status-dot' />
                    <Text className='membership-page__status-badge-text'>GOLD</Text>
                  </View>
                  <Text className='membership-page__status-name'>
                    {getMembershipDisplayName(currentMembership)}
                  </Text>
                </View>
                <Text className='membership-page__status-flag'>{currentMembership ? 'ACTIVE' : 'PENDING'}</Text>
              </View>

              <Text className='membership-page__status-label'>会员编号</Text>
              <Text className='membership-page__status-code'>{membershipCode}</Text>
              {!currentMembership || loadFailed ? (
                <Text className='membership-page__status-plan'>
                  {loadFailed ? '数据加载中断，请稍后下拉重试' : '尚未开通会员'}
                </Text>
              ) : null}

              <View className='membership-page__status-stats'>
                <View>
                  <Text className='membership-page__status-stat-label'>有效期至</Text>
                  <Text className='membership-page__status-stat-value'>
                    {currentMembership ? formatDisplayDate(currentMembership.endDate) : '--.--.--'}
                  </Text>
                </View>
                <View className='membership-page__status-right'>
                  <Text className='membership-page__status-stat-label'>课程权益</Text>
                  <Text className='membership-page__status-stat-value'>
                    {currentMembership ? (currentMembership.totalCredits <= 0 ? '无限次' : `${currentMembership.remainingCredits}/${currentMembership.totalCredits}次`) : '--'}
                  </Text>
                </View>
              </View>

              <View className='membership-page__progress'>
                <View className='membership-page__progress-track'>
                  <View className='membership-page__progress-fill' style={{ width: `${progressRatio}%` }} />
                </View>
                <Text className='membership-page__progress-text'>
                  {currentMembership ? `${remainingDays}天` : '--天'}
                </Text>
              </View>
            </View>

            <Divider spacing='none' />

            <View className='membership-page__renew'>
                <AppButton size='large' variant='primary' onClick={() => Taro.navigateTo({ url: '/pages/membership-renew/index' })}>
                  续费会员
                </AppButton>
            </View>
          </AppCard>
        </View>

        <View className='membership-page__section'>
          <View className='membership-page__section-title'>
            <Text className='membership-page__section-name'>会员权益</Text>
            <Text className='membership-page__section-en'>BENEFITS</Text>
          </View>
          <AppCard padding='none'>
            {benefitItems.map((item, index) => (
              <View key={item.key}>
                <View className='membership-page__benefit'>
                  <View className='membership-page__benefit-icon'>
                    <Icon name={item.icon} className='membership-page__benefit-icon-text' />
                  </View>
                  <View className='membership-page__benefit-content'>
                    <Text className='membership-page__benefit-label'>{item.label}</Text>
                    <Text className='membership-page__benefit-desc'>{item.description}</Text>
                  </View>
                </View>
                {index < benefitItems.length - 1 ? <Divider spacing='none' /> : null}
              </View>
            ))}
          </AppCard>
        </View>

        <View className='membership-page__section'>
          <View className='membership-page__section-title'>
            <Text className='membership-page__section-name'>训练总览</Text>
            <Text className='membership-page__section-en'>OVERVIEW</Text>
          </View>
          <AppCard className='membership-page__overview'>
            <View className='membership-page__overview-main'>
              <Text className='membership-page__overview-label'>TOTAL</Text>
              <View className='membership-page__overview-value-row'>
                <Text className='membership-page__overview-value'>{memberships.length > 0 ? totalUsedCredits : '--'}</Text>
                <Text className='membership-page__overview-unit'>节课</Text>
              </View>
            </View>

            <View className='membership-page__overview-divider' />

            <View className='membership-page__overview-side'>
              <View>
                <Text className='membership-page__overview-side-label'>累计</Text>
                <View className='membership-page__overview-side-row'>
                  <Text className='membership-page__overview-side-value'>{memberships.length > 0 ? estimatedHours : '--'}</Text>
                  <Text className='membership-page__overview-side-unit'>h</Text>
                </View>
              </View>

              <View>
                <Text className='membership-page__overview-side-label'>入会</Text>
                <View className='membership-page__overview-side-row'>
                  <Text className='membership-page__overview-side-value'>{memberships.length > 0 ? membershipMonths : '--'}</Text>
                  <Text className='membership-page__overview-side-unit'>月</Text>
                </View>
              </View>
            </View>
          </AppCard>
        </View>

        <View className='membership-page__section'>
          <View className='membership-page__section-title'>
            <Text className='membership-page__section-name'>近期记录</Text>
            <Text className='membership-page__section-en'>ACTIVITY</Text>
          </View>
          <View className='membership-page__activity-action'>
            <AppButton size='small' variant='outline' onClick={() => Taro.navigateTo({ url: '/pages/transactions/index' })}>
              查看消费记录
            </AppButton>
          </View>
          <AppCard padding='none'>
            {activityItems.length > 0 ? activityItems.map((item, index) => (
              <View key={item.id}>
                <View className='membership-page__activity'>
                  <View className='membership-page__activity-content'>
                    <Text className='membership-page__activity-title'>{item.title}</Text>
                    <Text className='membership-page__activity-date'>{formatDisplayDate(item.date)}</Text>
                  </View>
                  <Text className={`membership-page__activity-tag ${item.type === 'renew' ? 'membership-page__activity-tag--renew' : ''}`}>
                    {item.type === 'renew' ? '续费' : '已上课'}
                  </Text>
                </View>
                {index < activityItems.length - 1 ? <Divider spacing='none' /> : null}
              </View>
            )) : (
              <View className='membership-page__empty-wrap'>
                <Empty title='暂无会员动态' description='开通会员后，这里会显示你的会员开通与权益变化。' />
              </View>
            )}
          </AppCard>
        </View>

        <View className='membership-page__spacer' />
      </View>
    </PageShell>
  );
}
