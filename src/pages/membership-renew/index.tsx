import { useCallback, useEffect, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { membershipPlansApi, type MembershipPlan } from '../../api/membershipPlans';
import { getApiErrorMessage } from '../../api/request';
import { AppButton, AppCard, Divider, Empty, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

function formatPrice(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}

function getPlanCredits(plan: MembershipPlan) {
  return plan.totalCredits > 0 ? `${plan.totalCredits} 次` : '不限次';
}

export default function MembershipRenew() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedPlanId, setSubmittedPlanId] = useState('');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const response = await membershipPlansApi.getActive();
      const activePlans = response.data.plans || [];
      setPlans(activePlans);
      setSelectedPlanId((previous) => activePlans.some((plan) => plan.id === previous) ? previous : activePlans[0]?.id || '');
    } catch (error) {
      setLoadFailed(true);
      Taro.showToast({ title: getApiErrorMessage(error, '会员方案加载失败'), icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  usePullDownRefresh(() => {
    fetchPlans();
  });

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;

  const handleSubmitRenew = async () => {
    if (loadFailed) {
      Taro.showToast({ title: '方案未同步完成，请先刷新', icon: 'none' });
      return;
    }

    if (!selectedPlan) {
      Taro.showToast({ title: '请选择会员方案', icon: 'none' });
      return;
    }

    const result = await Taro.showModal({
      title: '确认续费',
      content: `${selectedPlan.name} · ${formatPrice(selectedPlan.priceCents)}`,
      confirmText: '确认',
      confirmColor: '#C4A574',
    });

    if (result.confirm) {
      try {
        setSubmitting(true);
        await membershipPlansApi.requestRenewal(selectedPlan.id);
        setSubmittedPlanId(selectedPlan.id);
        Taro.showToast({ title: '续费申请已提交', icon: 'success' });
      } catch (error) {
        Taro.showToast({ title: getApiErrorMessage(error, '续费提交失败，请稍后重试'), icon: 'none' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <PageShell className='membership-renew-page' safeAreaBottom>
        <PageHeader title='续费会员' subtitle='正在同步会员方案' fallbackUrl='/pages/membership/index' />
        <AppCard>
          <Loading compact />
        </AppCard>
      </PageShell>
    );
  }

  return (
    <PageShell className='membership-renew-page' safeAreaBottom>
      <PageHeader title='续费会员' subtitle='选择适合你的会员方案' fallbackUrl='/pages/membership/index' />

      <View className='membership-renew-page__hero'>
        <Text className='membership-renew-page__hero-label'>MEMBERSHIP PLAN</Text>
        <Text className='membership-renew-page__hero-title'>{selectedPlan?.name || '会员方案'}</Text>
        <Text className='membership-renew-page__hero-desc'>{selectedPlan?.description || '提前续费不影响当前有效期，新周期将自动顺延。'}</Text>
      </View>

      <View className='membership-renew-page__section'>
        <SectionTitle title='可选方案' actionLabel='PLANS' actionTone='muted' />
        {loadFailed && plans.length === 0 ? (
          <AppCard className='membership-renew-page__empty'>
            <Empty title='会员方案加载失败' description='请检查网络后重试。' actionLabel='重新加载' onActionClick={fetchPlans} />
          </AppCard>
        ) : plans.length > 0 ? (
          <>
          {loadFailed ? (
            <AppCard className='membership-renew-page__empty'>
              <Empty title='方案同步失败' description='已保留上次成功加载的会员方案，可稍后重试刷新。' actionLabel='重新同步' onActionClick={fetchPlans} />
            </AppCard>
          ) : null}
          <AppCard padding='none' className='membership-plan-list'>
            {plans.map((plan, index) => {
              const selected = plan.id === selectedPlanId;
              return (
                <View key={plan.id || plan.planCode}>
                  <Button className={`membership-plan-list__item ${selected ? 'membership-plan-list__item--selected' : ''}`} hoverClass='none' onClick={() => setSelectedPlanId(plan.id)}>
                    <View className='membership-plan-list__main'>
                      <Text className='membership-plan-list__name'>{plan.name}</Text>
                      <Text className='membership-plan-list__desc'>{getPlanCredits(plan)} · 有效 {plan.validityDays} 天</Text>
                    </View>
                    <View className='membership-plan-list__price-wrap'>
                      <Text className='membership-plan-list__price'>{formatPrice(plan.priceCents)}</Text>
                      <Text className={`membership-plan-list__tag ${selected ? 'membership-plan-list__tag--selected' : ''}`}>{selected ? '已选择' : '选择'}</Text>
                    </View>
                  </Button>
                  {index < plans.length - 1 ? <Divider spacing='none' /> : null}
                </View>
              );
            })}
          </AppCard>
          </>
        ) : (
          <AppCard className='membership-renew-page__empty'>
            <Empty title='暂无可购买方案' description='会员方案正在整理，请稍后再试。' />
          </AppCard>
        )}
      </View>

      <View className='membership-renew-page__footer'>
        <AppButton
          size='large'
          variant='primary'
          disabled={loadFailed || !selectedPlan || submitting || submittedPlanId === selectedPlan?.id}
          onClick={handleSubmitRenew}
        >
          {submitting ? '提交中...' : submittedPlanId === selectedPlan?.id ? '已提交，等待处理' : loadFailed ? '请先同步最新方案' : '确认续费'}
        </AppButton>
      </View>
    </PageShell>
  );
}
