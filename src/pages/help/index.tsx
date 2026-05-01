import { useEffect, useMemo, useRef, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, ScrollView, Text, Textarea, View } from '@tarojs/components';
import { supportApi } from '../../api/support';
import { AppButton, AppCard, Divider, Icon, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

declare const SUPPORT_PHONE: string;
declare const SUPPORT_EMAIL: string;

interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

type FaqCategory = 'all' | 'booking' | 'member' | 'account';

type FeedbackStep = 'idle' | 'writing' | 'sent';

interface CategoryItem {
  id: FaqCategory;
  label: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: '全部' },
  { id: 'booking', label: '预约相关' },
  { id: 'member', label: '会员服务' },
  { id: 'account', label: '账户问题' },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'f1',
    category: 'booking',
    question: '如何预约课程？',
    answer: '进入「预约」页面，选择日期与课程类型，点击心仪课程即可查看详情并完成预约。GOLD 会员享受提前 48 小时优先预约权。',
  },
  {
    id: 'f2',
    category: 'booking',
    question: '如何取消或改约？',
    answer: '课程开始前 4 小时可在「我的预约」中取消或改约。超过时限将扣除一次课程权益，敬请留意。',
  },
  {
    id: 'f3',
    category: 'booking',
    question: '课程已满可以候补吗？',
    answer: '目前暂不支持候补功能。建议在课程开放预约时尽早预约，或关注消息通知获取临时空位提醒。',
  },
  {
    id: 'f4',
    category: 'member',
    question: '会员卡如何续费？',
    answer: '进入「会员中心」页面，点击「续费会员」即可选择续费方案。提前续费不影响当前有效期，新周期将自动顺延。',
  },
  {
    id: 'f5',
    category: 'member',
    question: 'GOLD 会员有哪些专属权益？',
    answer: 'GOLD 年度金卡享受全课程无限次预约、提前 48 小时优先预约、免费季度体态评估、私教课程 85 折优惠等专属权益。',
  },
  {
    id: 'f6',
    category: 'account',
    question: '如何修改绑定手机号？',
    answer: '当前手机号用于会员身份核验。如需变更，请在「帮助与反馈」提交说明或联系客服，由门店完成身份确认后处理。',
  },
];

export default function Help() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || submittingFeedback) {
      return;
    }

    try {
      setSubmittingFeedback(true);
      await supportApi.submitFeedback({ content: feedbackText.trim() });
      setFeedbackStep('sent');
    } catch {
      Taro.showToast({ title: '反馈提交失败，请稍后重试', icon: 'none' });
      return;
    } finally {
      setSubmittingFeedback(false);
    }

    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
    }

    feedbackTimer.current = setTimeout(() => {
      setFeedbackStep('idle');
      setFeedbackText('');
    }, 3000);
  };

  const filteredFaqs = useMemo(
    () => FAQ_ITEMS.filter((item) => activeCategory === 'all' || item.category === activeCategory),
    [activeCategory],
  );

  const feedbackCount = feedbackText.length;
  const feedbackDisabled = !feedbackText.trim() || submittingFeedback;
  const contactItems = [
    SUPPORT_PHONE
      ? { label: '客服热线', value: SUPPORT_PHONE, displayValue: SUPPORT_PHONE, description: '工作日 09:00 – 18:00', icon: 'info' as const }
      : null,
    SUPPORT_EMAIL
      ? { label: '电子邮箱', value: SUPPORT_EMAIL, displayValue: SUPPORT_EMAIL, description: '1-3 个工作日内回复', icon: 'mail' as const }
      : null,
  ].filter((item): item is { label: string; value: string; displayValue: string; description: string; icon: 'info' | 'mail' } => Boolean(item));

  return (
    <PageShell className='help-page' safeAreaBottom>
      <PageHeader
        title='帮助与反馈'
        subtitle='常见问题与意见反馈'
        fallbackUrl='/pages/profile/index'
      />

      <View className='help-page__section'>
        <ScrollView scrollX showScrollbar={false} className='help-categories'>
          <View className='help-categories__row'>
            {CATEGORIES.map((category) => {
              const isActive = category.id === activeCategory;
              return (
                <Button
                  key={category.id}
                  className={`help-categories__pill ${isActive ? 'help-categories__pill--active' : ''}`}
                  hoverClass='none'
                  onClick={() => {
                    setActiveCategory(category.id);
                    setExpandedId(null);
                  }}
                >
                  <Text className='help-categories__pill-text'>{category.label}</Text>
                </Button>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View className='help-page__section'>
        <SectionTitle title='常见问题' actionLabel={`${filteredFaqs.length} 个问题`} actionTone='muted' />

        <AppCard className='help-faq' padding='none'>
          {filteredFaqs.length === 0 ? (
            <View className='help-faq__empty'>
              <Text className='help-faq__empty-title'>暂无相关问题</Text>
              <Text className='help-faq__empty-description'>换个分类试试，或直接提交反馈</Text>
            </View>
          ) : (
            filteredFaqs.map((item, index) => {
              const isExpanded = expandedId === item.id;

              return (
                <View key={item.id}>
                  <Button className='help-faq__item' hoverClass='none' onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <View className='help-faq__item-row'>
                      <Text className='help-faq__question'>{item.question}</Text>
                      <View className={`help-faq__arrow ${isExpanded ? 'help-faq__arrow--expanded' : ''}`}>
                        <Icon name='chevron-right' className='help-faq__arrow-icon' />
                      </View>
                    </View>

                    {isExpanded ? <Text className='help-faq__answer'>{item.answer}</Text> : null}
                  </Button>
                  {index < filteredFaqs.length - 1 ? <Divider spacing='none' className='help-faq__divider' /> : null}
                </View>
              );
            })
          )}
        </AppCard>
      </View>

      <View className='help-page__section'>
        <SectionTitle title='意见反馈' actionLabel='FEEDBACK' actionTone='muted' />

        <AppCard className='help-feedback' padding='none'>
          {feedbackStep === 'sent' ? (
            <View className='help-feedback__success'>
              <View className='help-feedback__success-icon-wrap'>
                  <Icon name='check' className='help-feedback__success-icon' />
              </View>
              <Text className='help-feedback__success-title'>提交成功</Text>
              <Text className='help-feedback__success-description'>感谢你的反馈，我们将尽快处理</Text>
            </View>
          ) : (
            <>
              <View className='help-feedback__intro'>
                <View className='help-feedback__intro-icon-wrap'>
                  <Icon name='mail' className='help-feedback__intro-icon' />
                </View>
                <View className='help-feedback__intro-copy'>
                  <Text className='help-feedback__intro-title'>告诉我们你的想法</Text>
                  <Text className='help-feedback__intro-description'>产品建议、问题反馈、使用体验</Text>
                </View>
              </View>

              <Textarea
                className='help-feedback__textarea'
                value={feedbackText}
                maxlength={500}
                placeholder='请描述你的问题或建议...'
                placeholderClass='help-feedback__placeholder'
                onInput={(event) => {
                  const value = event.detail.value;
                  setFeedbackText(value);

                  if (!value.trim()) {
                    setFeedbackStep('idle');
                    return;
                  }

                  setFeedbackStep('writing');
                }}
              />

              <View className='help-feedback__footer'>
                <Text className='help-feedback__count'>{feedbackCount}/500</Text>
                <AppButton
                  className='help-feedback__submit'
                  size='small'
                  variant='primary'
                  disabled={feedbackDisabled}
                  loading={submittingFeedback}
                  onClick={handleSubmitFeedback}
                >
                  <Icon name='send' className='help-feedback__submit-icon' />
                  <Text className='help-feedback__submit-text'>{submittingFeedback ? '提交中...' : '提交'}</Text>
                </AppButton>
              </View>
            </>
          )}
        </AppCard>
      </View>

      <View className='help-page__section'>
        <SectionTitle title='联系我们' actionLabel='CONTACT' actionTone='muted' />

        <AppCard className='help-contact' padding='none'>
          {contactItems.length === 0 ? (
            <View className='help-contact__empty'>
              <Text className='help-contact__empty-title'>联系方式待配置</Text>
              <Text className='help-contact__empty-description'>请联系门店工作人员获取最新客服方式。</Text>
            </View>
          ) : contactItems.map((item, index) => (
              <View key={item.label}>
                <Button
                className='help-contact__item help-contact__item--clickable'
                hoverClass='none'
                onClick={() => {
                  if (item.label === '客服热线') {
                    Taro.makePhoneCall({ phoneNumber: item.value });
                    return;
                  }
                  Taro.setClipboardData({
                    data: item.value,
                    success: () => {
                      Taro.showToast({ title: '邮箱已复制', icon: 'success' });
                    },
                  });
                }}
              >
                <View className='help-contact__icon-wrap'>
                  <Icon name={item.icon} className='help-contact__icon' />
                </View>
                <View className='help-contact__left'>
                  <Text className='help-contact__label'>{item.label}</Text>
                  <Text className='help-contact__description'>{item.description}</Text>
                </View>
                <View className='help-contact__right'>
                  <Text className='help-contact__value'>{item.displayValue}</Text>
                  <Text className='help-contact__action-text'>{item.label === '客服热线' ? '拨打电话' : '复制邮箱地址'}</Text>
                  <Icon name='chevron-right' className='help-contact__arrow' />
                </View>
              </Button>
              {index < contactItems.length - 1 ? <Divider spacing='none' className='help-contact__divider' /> : null}
            </View>
          ))}
        </AppCard>
      </View>
    </PageShell>
  );
}
