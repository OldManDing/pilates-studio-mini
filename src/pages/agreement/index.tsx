import { Text, View } from '@tarojs/components';
import { AppCard, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

const SECTIONS = [
  {
    title: '服务说明',
    content: '本小程序用于展示课程预约、会员权益、训练记录与门店服务信息。你在使用预约、会员和反馈功能时，应提供真实、准确的信息。',
  },
  {
    title: '预约规则',
    content: '课程预约成功后，请按时到店参加。取消或改约规则以课程详情页及门店实际运营规则为准，超过限定时间可能影响会员权益。',
  },
  {
    title: '会员权益',
    content: '会员卡、课次包及相关权益以购买时展示的方案为准。续费或购买后，权益生效时间、有效期和使用范围以订单记录为准。',
  },
  {
    title: '账户责任',
    content: '请妥善保管账户、手机号和验证码。因个人原因导致账户信息泄露或权益被使用的，请及时联系门店客服处理。',
  },
];

export default function Agreement() {
  return (
    <PageShell className='agreement-page' safeAreaBottom>
      <PageHeader title='用户协议' subtitle='服务规则与账户责任' fallbackUrl='/pages/settings/index' />

      <AppCard className='legal-hero'>
        <Text className='legal-hero__label'>TERMS</Text>
        <Text className='legal-hero__title'>Pilates Studio 用户服务协议</Text>
        <Text className='legal-hero__desc'>更新日期：2026.04.25</Text>
      </AppCard>

      {SECTIONS.map((section, index) => (
        <View key={section.title} className='agreement-page__section'>
          <SectionTitle title={`${index + 1}. ${section.title}`} actionLabel='TERMS' actionTone='muted' />
          <AppCard className='legal-content'>
            <Text className='legal-content__text'>{section.content}</Text>
          </AppCard>
        </View>
      ))}
    </PageShell>
  );
}
