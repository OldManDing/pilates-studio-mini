import { useCallback, useEffect, useRef, useState } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { ensureMiniProgramAuth } from '../../api/auth';
import { membershipPlansApi, type MembershipPlan, type MiniPaymentParams } from '../../api/membershipPlans';
import { transactionsApi } from '../../api/transactions';
import { getApiErrorMessage, isUnauthorizedApiError } from '../../api/request';
import { AppButton, AppCard, Divider, Empty, Loading, PageHeader, PageShell, SectionTitle } from '../../components';
import { showSafeToast } from '../../utils/feedback';
import './index.scss';

function formatPrice(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}

function getPlanCredits(plan: MembershipPlan) {
  return plan.totalCredits > 0 ? `${plan.totalCredits} 次` : '不限次';
}

function isPaymentConfigUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Missing WeChat Pay config|wechat\.appId|支付通道配置|支付通道暂不可用/i.test(message);
}

function hasCompletePaymentParams(paymentParams?: Partial<MiniPaymentParams>) {
  return Boolean(
    paymentParams?.timeStamp
    && paymentParams.nonceStr
    && paymentParams.package
    && paymentParams.signType
    && paymentParams.paySign,
  );
}

export default function MembershipRenew() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedPlanId, setSubmittedPlanId] = useState('');
  const [paymentStatusHint, setPaymentStatusHint] = useState('');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const renewInFlightRef = useRef(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      setAuthRequired(false);
      const response = await membershipPlansApi.getActive({ showLoading: false });
      const activePlans = response.data.plans || [];
      setPlans(activePlans);
      setSelectedPlanId((previous) => activePlans.some((plan) => plan.id === previous) ? previous : activePlans[0]?.id || '');
    } catch (error) {
      setLoadFailed(true);
      setAuthRequired(isUnauthorizedApiError(error));
      showSafeToast({ title: getApiErrorMessage(error, '会员方案加载失败'), icon: 'none' });
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

  const waitForTransactionCompletion = async (transactionId: string) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await transactionsApi.getById(transactionId, { showLoading: false });
      const transaction = response.data.transaction;
      if (transaction?.status === 'COMPLETED') {
        return 'COMPLETED';
      }
      if (transaction?.status === 'FAILED' || transaction?.status === 'REFUNDED') {
        return transaction.status;
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    return 'PENDING';
  };

  const handleAuthRecover = async () => {
    try {
      await ensureMiniProgramAuth({ interactive: true });
      await fetchPlans();
      showSafeToast({ title: '登录成功，已同步会员方案', icon: 'success' });
    } catch (error) {
      showSafeToast({ title: getApiErrorMessage(error, '登录失败，请稍后重试'), icon: 'none' });
    }
  };

  const handleSubmitRenew = async () => {
    if (submitting || renewInFlightRef.current) {
      return;
    }

    if (authRequired) {
      renewInFlightRef.current = true;
      try {
        await handleAuthRecover();
        return;
      } finally {
        renewInFlightRef.current = false;
      }
    }

    if (loadFailed) {
      showSafeToast({ title: '方案未同步完成，请先刷新', icon: 'none' });
      return;
    }

    if (!selectedPlan) {
      showSafeToast({ title: '请选择会员方案', icon: 'none' });
      return;
    }

    renewInFlightRef.current = true;
    try {
      const result = await Taro.showModal({
        title: '确认续费',
        content: `${selectedPlan.name} · ${formatPrice(selectedPlan.priceCents)}`,
        confirmText: '确认',
        confirmColor: '#C4A574',
      });

      if (!result.confirm) {
        return;
      }

      try {
        setSubmitting(true);
        setPaymentStatusHint('正在创建支付订单…');
        let paymentOrder: Awaited<ReturnType<typeof membershipPlansApi.createRenewalPayment>> | null = null;

        try {
          paymentOrder = await membershipPlansApi.createRenewalPayment(selectedPlan.id, { showLoading: false });
        } catch (error) {
          if (!isPaymentConfigUnavailableError(error)) {
            throw error;
          }

          setPaymentStatusHint('支付通道暂不可用，已转为门店人工续费申请');
          await membershipPlansApi.requestRenewal(selectedPlan.id, { showLoading: false });
          setSubmittedPlanId(selectedPlan.id);
          showSafeToast({ title: '已提交续费申请', icon: 'success' });
          return;
        }

        if (!paymentOrder) {
          throw new Error('支付订单创建失败，请稍后重试');
        }

        if (paymentOrder.data.mode === 'MOCK') {
          setPaymentStatusHint('正在模拟支付完成…');
          await membershipPlansApi.completeMockRenewalPayment(paymentOrder.data.transactionId, { showLoading: false });
        } else {
          if (!hasCompletePaymentParams(paymentOrder.data.paymentParams)) {
            throw new Error('微信支付参数异常，请联系门店处理');
          }

          setPaymentStatusHint('请在微信支付弹窗中完成支付…');
          await Taro.requestPayment(paymentOrder.data.paymentParams);
        }

        setPaymentStatusHint('正在同步支付结果…');
        const finalStatus = await waitForTransactionCompletion(paymentOrder.data.transactionId);
        if (finalStatus !== 'COMPLETED') {
          throw new Error(finalStatus === 'FAILED' ? '支付失败，请稍后重试' : '支付结果确认中，请稍后到交易记录查看');
        }

        setSubmittedPlanId(selectedPlan.id);
        setPaymentStatusHint('支付成功，续费订单已提交');
        showSafeToast({ title: '支付成功，续费已提交', icon: 'success' });
      } catch (error) {
        setPaymentStatusHint('');
        showSafeToast({ title: getApiErrorMessage(error, '续费提交失败，请稍后重试'), icon: 'none' });
      } finally {
        setSubmitting(false);
      }
    } finally {
      renewInFlightRef.current = false;
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
        <Text className='membership-renew-page__hero-label'>会员方案</Text>
        <Text className='membership-renew-page__hero-title'>{selectedPlan?.name || '会员方案'}</Text>
        <Text className='membership-renew-page__hero-desc'>{selectedPlan?.description || '当前会籍未到期时，仅支持同方案续费顺延；如需更换方案，请待当前会籍结束后处理。'}</Text>
        {paymentStatusHint ? <Text className='membership-renew-page__hero-desc'>{paymentStatusHint}</Text> : null}
      </View>

      <View className='membership-renew-page__section'>
        <SectionTitle title='可选方案' actionLabel='方案' actionTone='muted' />
        {loadFailed && plans.length === 0 ? (
          <AppCard className='membership-renew-page__empty'>
            <Empty
              title={authRequired ? '请先登录' : '会员方案加载失败'}
              description={authRequired ? '登录后即可同步会员方案并提交续费申请。' : '请检查网络后重试。'}
              actionLabel={authRequired ? '去登录' : '重新加载'}
              onActionClick={authRequired ? handleAuthRecover : fetchPlans}
            />
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
          {submitting ? '提交中…' : submittedPlanId === selectedPlan?.id ? '已提交，等待处理' : loadFailed ? '请先同步最新方案' : '确认续费'}
        </AppButton>
      </View>
    </PageShell>
  );
}
