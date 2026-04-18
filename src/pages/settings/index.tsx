import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Image, Text, View } from '@tarojs/components';
import { AppCard, Divider, Icon, PageHeader, PageShell } from '../../components';
import './index.scss';

interface SettingRow {
  icon: string;
  title: string;
  description: string;
  type: 'toggle' | 'value' | 'navigate';
  value?: string;
  toggleKey?: ToggleKey;
}

interface SettingSection {
  label: string;
  items: SettingRow[];
}

type ToggleKey = 'courseReminder' | 'systemNotification' | 'darkMode' | 'biometric';

const SECTIONS: SettingSection[] = [
  {
    label: 'ACCOUNT',
    items: [
      {
        icon: '/assets/ui/icon-settings.svg',
        title: '手机号',
        description: '',
        type: 'value',
        value: '138****6688',
      },
      {
        icon: '/assets/ui/icon-support.svg',
        title: '修改密码',
        description: '定期修改保障账户安全',
        type: 'navigate',
      },
      {
        icon: '/assets/ui/icon-settings.svg',
        title: '面容/指纹解锁',
        description: '使用生物识别快速登录',
        type: 'toggle',
        toggleKey: 'biometric',
      },
    ],
  },
  {
    label: 'NOTIFICATION',
    items: [
      {
        icon: '/assets/ui/icon-notifications.svg',
        title: '课程提醒',
        description: '课前 30 分钟推送提醒',
        type: 'toggle',
        toggleKey: 'courseReminder',
      },
      {
        icon: '/assets/ui/icon-notifications.svg',
        title: '系统通知',
        description: '接收系统公告与活动通知',
        type: 'toggle',
        toggleKey: 'systemNotification',
      },
    ],
  },
  {
    label: 'PREFERENCE',
    items: [
      {
        icon: '/assets/ui/icon-settings.svg',
        title: '深色模式',
        description: '降低屏幕亮度，保护眼睛',
        type: 'toggle',
        toggleKey: 'darkMode',
      },
      {
        icon: '/assets/ui/icon-settings.svg',
        title: '语言',
        description: '',
        type: 'value',
        value: '简体中文',
      },
    ],
  },
  {
    label: 'DATA',
    items: [
      {
        icon: '/assets/ui/icon-settings.svg',
        title: '清除缓存',
        description: '',
        type: 'value',
        value: '12.3 MB',
      },
    ],
  },
];

const ABOUT_ROWS: SettingRow[] = [
  {
    icon: '/assets/ui/icon-settings.svg',
    title: '当前版本',
    description: '',
    type: 'value',
    value: 'v2.6.0',
  },
  {
    icon: '/assets/ui/icon-support.svg',
    title: '用户协议',
    description: '',
    type: 'navigate',
  },
  {
    icon: '/assets/ui/icon-support.svg',
    title: '隐私政策',
    description: '',
    type: 'navigate',
  },
];

export default function Settings() {
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    courseReminder: true,
    systemNotification: true,
    darkMode: false,
    biometric: true,
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggle = (key: ToggleKey) => {
    setToggles((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const handleNavigateRow = (title: string) => {
    Taro.showToast({ title: `${title} 功能整理中`, icon: 'none' });
  };

  const renderRow = (item: SettingRow, index: number, total: number) => (
    <View key={`${item.title}-${index}`}>
      <View
        className={`settings-row ${item.type === 'navigate' ? 'settings-row--clickable' : ''}`}
        onClick={() => {
          if (item.type === 'toggle' && item.toggleKey) {
            handleToggle(item.toggleKey);
            return;
          }

          if (item.type === 'navigate') {
            handleNavigateRow(item.title);
          }
        }}
      >
        <View className='settings-row__icon-wrap'>
          <Image className='settings-row__icon' src={item.icon} mode='aspectFit' />
        </View>

        <View className='settings-row__content'>
          <Text className='settings-row__title'>{item.title}</Text>
          {item.description ? <Text className='settings-row__description'>{item.description}</Text> : null}
        </View>

        {item.type === 'toggle' && item.toggleKey ? (
          <View className={`settings-toggle ${toggles[item.toggleKey] ? 'settings-toggle--on' : ''}`}>
            <View className='settings-toggle__dot' />
          </View>
        ) : null}

        {item.type === 'value' ? <Text className='settings-row__value'>{item.value}</Text> : null}

        {item.type === 'navigate' ? <Icon name='chevron-right' className='settings-row__arrow' /> : null}
      </View>
      {index < total - 1 ? <Divider spacing='none' className='settings-row__divider' /> : null}
    </View>
  );

  const renderAboutRow = (item: SettingRow, index: number, total: number) => (
    <View key={`${item.title}-${index}`}>
      <View
        className={`settings-about-row ${item.type === 'navigate' ? 'settings-about-row--clickable' : ''}`}
        onClick={() => {
          if (item.type === 'navigate') {
            handleNavigateRow(item.title);
          }
        }}
      >
        <Text className='settings-about-row__title'>{item.title}</Text>
        {item.type === 'value' ? <Text className='settings-about-row__value'>{item.value}</Text> : null}
        {item.type === 'navigate' ? <Icon name='chevron-right' className='settings-about-row__arrow' /> : null}
      </View>
      {index < total - 1 ? <Divider spacing='none' className='settings-about-row__divider' /> : null}
    </View>
  );

  return (
    <PageShell className='settings-page' safeAreaBottom>
      <PageHeader
        title='设置'
        subtitle='账户安全与偏好设置'
      />

      {SECTIONS.map((section) => (
        <View key={section.label} className='settings-page__section'>
          <Text className='settings-page__section-label'>{section.label}</Text>
          <AppCard className='settings-group' padding='none'>
            {section.items.map((item, index) => renderRow(item, index, section.items.length))}
          </AppCard>
        </View>
      ))}

      <View className='settings-page__section'>
        <Text className='settings-page__section-label'>ABOUT</Text>
        <AppCard className='settings-group' padding='none'>
          {ABOUT_ROWS.map((item, index) => renderAboutRow(item, index, ABOUT_ROWS.length))}
        </AppCard>
      </View>

      <View className='settings-page__section settings-page__section--danger'>
        {!showLogoutConfirm ? (
          <View className='danger-action' onClick={() => setShowLogoutConfirm(true)}>
            <Icon name='logout' className='danger-action__icon' />
            <Text className='danger-action__text'>退出登录</Text>
          </View>
        ) : (
          <AppCard className='danger-confirm' padding='none'>
            <Text className='danger-confirm__title'>确认退出登录？</Text>
            <Text className='danger-confirm__description'>退出后需要重新验证手机号登录</Text>
            <View className='danger-confirm__actions'>
              <View className='danger-confirm__button danger-confirm__button--cancel' onClick={() => setShowLogoutConfirm(false)}>
                <Text className='danger-confirm__button-text danger-confirm__button-text--cancel'>取消</Text>
              </View>
              <View
                className='danger-confirm__button danger-confirm__button--confirm'
                onClick={() => {
                  setShowLogoutConfirm(false);
                  Taro.switchTab({ url: '/pages/index/index' });
                }}
              >
                <Text className='danger-confirm__button-text'>确认退出</Text>
              </View>
            </View>
          </AppCard>
        )}

        {!showDeleteConfirm ? (
          <View className='danger-link' onClick={() => setShowDeleteConfirm(true)}>
            <Text className='danger-link__text'>注销账户</Text>
          </View>
        ) : (
          <AppCard className='danger-confirm' padding='none'>
            <Text className='danger-confirm__title'>确认注销账户？</Text>
            <Text className='danger-confirm__description'>注销后所有数据将被永久删除且无法恢复，包括会员权益、训练记录等。</Text>
            <View className='danger-confirm__actions'>
              <View className='danger-confirm__button danger-confirm__button--cancel' onClick={() => setShowDeleteConfirm(false)}>
                <Text className='danger-confirm__button-text danger-confirm__button-text--cancel'>取消</Text>
              </View>
              <View
                className='danger-confirm__button danger-confirm__button--danger'
                onClick={() => {
                  setShowDeleteConfirm(false);
                  Taro.showToast({ title: '已进入注销流程（演示）', icon: 'none' });
                }}
              >
                <Text className='danger-confirm__button-text'>确认注销</Text>
              </View>
            </View>
          </AppCard>
        )}
      </View>
    </PageShell>
  );
}
