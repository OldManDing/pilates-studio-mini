import { Text, View } from '@tarojs/components';
import { AppCard, PageHeader, PageShell, SectionTitle } from '../../components';
import './index.scss';

const SECTIONS = [
  {
    title: '信息收集',
    content: '为提供预约、会员和通知服务，我们可能收集你的昵称、手机号、会员状态、预约记录、训练记录及设备基础信息。',
  },
  {
    title: '信息使用',
    content: '收集的信息将用于课程预约、会员权益核验、消息提醒、客服反馈和服务体验优化，不会用于与服务无关的用途。',
  },
  {
    title: '信息保护',
    content: '我们会采取合理的技术和管理措施保护你的个人信息，避免未经授权的访问、披露、篡改或丢失。',
  },
  {
    title: '你的权利',
    content: '你可以通过设置、客服或门店渠道查询、更正或申请删除个人信息。注销账户后，相关数据将按法律法规要求处理。',
  },
];

export default function Privacy() {
  return (
    <PageShell className='privacy-page' safeAreaBottom>
      <PageHeader title='隐私政策' subtitle='个人信息收集与保护说明' fallbackUrl='/pages/settings/index' />

      <AppCard className='privacy-hero'>
        <Text className='privacy-hero__label'>PRIVACY</Text>
        <Text className='privacy-hero__title'>Pilates Studio 隐私政策</Text>
        <Text className='privacy-hero__desc'>更新日期：2026.04.25</Text>
      </AppCard>

      {SECTIONS.map((section, index) => (
        <View key={section.title} className='privacy-page__section'>
          <SectionTitle title={`${index + 1}. ${section.title}`} actionLabel='POLICY' actionTone='muted' />
          <AppCard className='privacy-content'>
            <Text className='privacy-content__text'>{section.content}</Text>
          </AppCard>
        </View>
      ))}
    </PageShell>
  );
}
