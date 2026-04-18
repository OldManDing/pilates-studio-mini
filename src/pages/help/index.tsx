import { useMemo, useState } from 'react';
import { ScrollView, Text, Textarea, View } from '@tarojs/components';
import { AppCard, Divider, Icon, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

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
    answer: '进入「设置 > 账户安全」，选择「修改手机号」，验证当前手机号后即可绑定新号码。',
  },
];

export default function Help() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>('idle');
  const [feedbackText, setFeedbackText] = useState('');

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      return;
    }

    setFeedbackStep('sent');
    setTimeout(() => {
      setFeedbackStep('idle');
      setFeedbackText('');
    }, 3000);
  };

  const filteredFaqs = useMemo(
    () => FAQ_ITEMS.filter((item) => activeCategory === 'all' || item.category === activeCategory),
    [activeCategory],
  );

  const feedbackCount = feedbackText.length;
  const feedbackDisabled = !feedbackText.trim();

  return (
    <PageShell className='help-page' safeAreaBottom>
      <PageHeader
        title='帮助与反馈'
        subtitle='常见问题与意见反馈'
      />

      <View className='help-page__section'>
        <ScrollView scrollX showScrollbar={false} className='help-categories'>
          <View className='help-categories__row'>
            {CATEGORIES.map((category) => {
              const isActive = category.id === activeCategory;
              return (
                <View
                  key={category.id}
                  className={`help-categories__pill ${isActive ? 'help-categories__pill--active' : ''}`}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setExpandedId(null);
                  }}
                >
                  <Text className='help-categories__pill-text'>{category.label}</Text>
                </View>
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
                  <View className='help-faq__item' onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <View className='help-faq__item-row'>
                      <Text className='help-faq__question'>{item.question}</Text>
                      <View className={`help-faq__arrow ${isExpanded ? 'help-faq__arrow--expanded' : ''}`}>
                        <Icon name='chevron-right' className='help-faq__arrow-icon' />
                      </View>
                    </View>

                    {isExpanded ? <Text className='help-faq__answer'>{item.answer}</Text> : null}
                  </View>
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
                <View
                  className={`help-feedback__submit ${feedbackDisabled ? 'help-feedback__submit--disabled' : ''}`}
                  onClick={handleSubmitFeedback}
                >
                  <Icon name='send' className='help-feedback__submit-icon' />
                  <Text className='help-feedback__submit-text'>提交</Text>
                </View>
              </View>
            </>
          )}
        </AppCard>
      </View>

      <View className='help-page__section'>
        <SectionTitle title='联系我们' actionLabel='CONTACT' actionTone='muted' />

        <AppCard className='help-contact' padding='none'>
          {[
            { label: '客服热线', value: '400-888-0000', description: '工作日 09:00 – 18:00' },
            { label: '电子邮箱', value: 'support@studio.com', description: '1-3 个工作日内回复' },
          ].map((item, index) => (
            <View key={item.label}>
              <View className='help-contact__item'>
                <View className='help-contact__left'>
                  <Text className='help-contact__label'>{item.label}</Text>
                  <Text className='help-contact__description'>{item.description}</Text>
                </View>
                <Text className='help-contact__value'>{item.value}</Text>
              </View>
              {index < 1 ? <Divider spacing='none' className='help-contact__divider' /> : null}
            </View>
          ))}
        </AppCard>
      </View>
    </PageShell>
  );
}
