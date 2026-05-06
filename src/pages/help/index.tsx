import { useEffect, useMemo, useRef, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, ScrollView, Text, Textarea, View } from '@tarojs/components';
import { knowledgeApi, type KnowledgeFaq } from '../../api/knowledge';
import { settingsApi, type StudioSettings } from '../../api/settings';
import { supportApi } from '../../api/support';
import { getApiErrorMessage } from '../../api/request';
import { AppButton, AppCard, Divider, Icon, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

declare const SUPPORT_PHONE: string;
declare const SUPPORT_EMAIL: string;

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

type FaqCategory = string;

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

const CATEGORY_LABEL_MAP: Record<string, string> = CATEGORIES.reduce((map, item) => ({
  ...map,
  [item.id]: item.label,
}), {} as Record<string, string>);

function normalizeCategory(category?: string) {
  return category?.trim() || 'general';
}

function toFaqItem(item: KnowledgeFaq): FaqItem {
  return {
    id: item.id,
    category: normalizeCategory(item.category),
    question: item.question,
    answer: item.answer,
  };
}

export default function Help() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqLoadFailed, setFaqLoadFailed] = useState(false);
  const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHelpData = async () => {
      try {
        setFaqLoading(true);
        setFaqLoadFailed(false);

        const [faqsRes, studioRes] = await Promise.allSettled([
          knowledgeApi.getFaqs(undefined, { showLoading: false }),
          settingsApi.getStudio(),
        ]);

        if (cancelled) {
          return;
        }

        if (faqsRes.status === 'fulfilled') {
          setFaqItems((faqsRes.value.data || []).map(toFaqItem));
        } else {
          setFaqItems([]);
          setFaqLoadFailed(true);
        }

        if (studioRes.status === 'fulfilled') {
          setStudioSettings(studioRes.value.data);
        }
      } finally {
        if (!cancelled) {
          setFaqLoading(false);
        }
      }
    };

    void loadHelpData();

    return () => {
      cancelled = true;
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
    } catch (error) {
      Taro.showToast({ title: getApiErrorMessage(error, '反馈提交失败，请稍后重试'), icon: 'none' });
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

  const categoryItems = useMemo(() => {
    const categorySet = new Set(faqItems.map((item) => item.category));
    const knownCategories = CATEGORIES.filter((category) => category.id === 'all' || categorySet.has(category.id));
    const extraCategories = Array.from(categorySet)
      .filter((category) => !CATEGORY_LABEL_MAP[category])
      .map((category) => ({
        id: category,
        label: category,
      }));

    return faqItems.length ? [...knownCategories, ...extraCategories] : CATEGORIES;
  }, [faqItems]);

  const filteredFaqs = useMemo(
    () => faqItems.filter((item) => activeCategory === 'all' || item.category === activeCategory),
    [activeCategory, faqItems],
  );

  const feedbackCount = feedbackText.length;
  const feedbackDisabled = !feedbackText.trim() || submittingFeedback;
  const supportPhone = studioSettings?.phone?.trim() || SUPPORT_PHONE;
  const supportEmail = studioSettings?.email?.trim() || SUPPORT_EMAIL;
  const contactItems = [
    supportPhone
      ? { label: '客服热线', value: supportPhone, displayValue: supportPhone, description: studioSettings?.businessHours ? `营业时间 ${studioSettings.businessHours}` : '工作日 09:00 – 18:00', icon: 'info' as const }
      : null,
    supportEmail
      ? { label: '电子邮箱', value: supportEmail, displayValue: supportEmail, description: '1-3 个工作日内回复', icon: 'mail' as const }
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
            {categoryItems.map((category) => {
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
        <SectionTitle title='常见问题' actionLabel={faqLoading ? '同步中' : `${filteredFaqs.length} 个问题`} actionTone='muted' />

        <AppCard className='help-faq' padding='none'>
          {faqLoading ? (
            <View className='help-faq__empty'>
              <Text className='help-faq__empty-title'>正在同步知识库</Text>
              <Text className='help-faq__empty-description'>请稍候，正在获取门店最新帮助内容</Text>
            </View>
          ) : filteredFaqs.length === 0 ? (
            <View className='help-faq__empty'>
              <Text className='help-faq__empty-title'>{faqLoadFailed ? '知识库同步失败' : '暂无相关问题'}</Text>
              <Text className='help-faq__empty-description'>{faqLoadFailed ? '请稍后重试，或直接提交反馈联系门店' : '换个分类试试，或直接提交反馈'}</Text>
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
        <SectionTitle title='意见反馈' actionLabel='反馈' actionTone='muted' />

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
                placeholder='请描述你的问题或建议…'
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
                  <Text className='help-feedback__submit-text'>{submittingFeedback ? '提交中…' : '提交'}</Text>
                </AppButton>
              </View>
            </>
          )}
        </AppCard>
      </View>

      <View className='help-page__section'>
        <SectionTitle title='联系我们' actionLabel='联系' actionTone='muted' />

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
