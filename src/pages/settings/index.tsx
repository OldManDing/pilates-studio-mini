import { useCallback, useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Image, Text, View } from '@tarojs/components';
import { ensureMiniProgramAuth } from '../../api/auth';
import { AppCard, Divider, Icon, PageHeader, PageShell } from '../../components';
import { membersApi } from '../../api/members';
import { getApiErrorMessage } from '../../api/request';
import { supportApi } from '../../api/support';
import { STORAGE_KEYS } from '../../constants/storage';
import { clearAuthState, readStorage, writeStorage } from '../../utils/storage';
import './index.scss';

declare const APP_VERSION: string;

interface SettingRow {
  icon: string;
  title: string;
  description: string;
  type: 'toggle' | 'value' | 'navigate';
  value?: string;
  toggleKey?: ToggleKey;
  route?: string;
  action?: 'clear-cache';
}

interface SettingSection {
  label: string;
  items: SettingRow[];
}

type ToggleKey = 'courseReminder' | 'systemNotification' | 'darkMode' | 'biometric';

const CACHE_KEYS = ['taro-cache', 'pilates:page-cache'];

const SECTIONS: SettingSection[] = [
  {
    label: 'ACCOUNT',
    items: [
      {
        icon: '/assets/ui/icon-settings.svg',
        title: '手机号',
        description: '',
        type: 'value',
        value: '登录后同步',
      },
      {
        icon: '/assets/ui/icon-support.svg',
        title: '账户安全',
        description: '查看账号说明与本机登录偏好',
        type: 'navigate',
        route: '/pages/account-security/index',
      },
      {
        icon: '/assets/ui/icon-settings.svg',
        title: '本机快捷访问偏好',
        description: '仅记录当前设备的快捷访问偏好',
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
        description: '控制课程相关通知是否继续发送',
        type: 'toggle',
        toggleKey: 'courseReminder',
      },
      {
        icon: '/assets/ui/icon-notifications.svg',
        title: '系统通知',
        description: '控制系统通知是否继续发送',
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
        description: '仅影响当前设备的页面展示风格',
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
        title: '清理页面缓存',
        description: '清理页面缓存，不影响登录和偏好',
        type: 'navigate',
        value: '清理页面缓存',
        action: 'clear-cache',
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
    value: APP_VERSION,
  },
  {
    icon: '/assets/ui/icon-support.svg',
    title: '用户协议',
    description: '',
    type: 'navigate',
    route: '/pages/agreement/index',
  },
  {
    icon: '/assets/ui/icon-support.svg',
    title: '隐私政策',
    description: '',
    type: 'navigate',
    route: '/pages/privacy/index',
  },
];

export default function Settings() {
  const [profile, setProfile] = useState<{ phone?: string; hasBoundPhone?: boolean }>(() => readStorage(STORAGE_KEYS.profile, {}));
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    courseReminder: true,
    systemNotification: true,
    darkMode: false,
    biometric: true,
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submittingDeletionRequest, setSubmittingDeletionRequest] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const syncProfile = useCallback(async () => {
    if (!Taro.getStorageSync('token')) {
      setProfile(readStorage(STORAGE_KEYS.profile, {}));
      return;
    }

    try {
      const response = await membersApi.getProfile({ showLoading: false });
      const nextMember = response.data.member;

      if (!nextMember) {
        return;
      }

      const nextProfile = {
        phone: nextMember.phone ? nextMember.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
        hasBoundPhone: Boolean(nextMember.phone),
      };

      writeStorage(STORAGE_KEYS.profile, nextProfile);
      setProfile(nextProfile);
    } catch {
      setProfile(readStorage(STORAGE_KEYS.profile, {}));
    }
  }, []);

  const ensureAuthenticated = async (successMessage: string) => {
    if (Taro.getStorageSync('token')) {
      return true;
    }

    try {
      await ensureMiniProgramAuth({ interactive: true });
      await syncProfile();
      Taro.showToast({ title: successMessage, icon: 'success' });
      return true;
    } catch (error) {
      Taro.showToast({ title: getApiErrorMessage(error, '登录失败，请稍后重试'), icon: 'none' });
      return false;
    }
  };

  useEffect(() => {
    setToggles(readStorage(STORAGE_KEYS.settings, {
      courseReminder: true,
      systemNotification: true,
      darkMode: false,
      biometric: true,
    }));
    syncProfile();
    const syncMemberPreferences = async () => {
      if (!Taro.getStorageSync('token')) {
        return;
      }

      try {
        const response = await membersApi.getPreferences({ showLoading: false });
        setToggles((previous) => ({
          ...previous,
          courseReminder: response.data.preferences.courseReminder,
          systemNotification: response.data.preferences.systemNotification,
        }));
      } catch {
        // keep local fallback
      }
    };
    void syncMemberPreferences();
  }, [syncProfile]);

  const handleToggle = async (key: ToggleKey) => {
    const current = toggles[key];
    const nextValue = !current;

    if (key === 'courseReminder' || key === 'systemNotification') {
      const authenticated = await ensureAuthenticated('已登录，正在同步通知偏好');
      if (!authenticated) {
        return;
      }

      try {
        const response = await membersApi.updatePreferences({ [key]: nextValue });
        setToggles((previous) => ({
          ...previous,
          courseReminder: response.data.preferences.courseReminder,
          systemNotification: response.data.preferences.systemNotification,
        }));
        writeStorage(STORAGE_KEYS.settings, {
          ...readStorage(STORAGE_KEYS.settings, {}),
          courseReminder: response.data.preferences.courseReminder,
          systemNotification: response.data.preferences.systemNotification,
        });
        Taro.showToast({ title: '通知偏好已同步', icon: 'success' });
      } catch (error) {
        Taro.showToast({ title: getApiErrorMessage(error, '通知偏好同步失败'), icon: 'none' });
      }
      return;
    }

    setToggles((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      writeStorage(STORAGE_KEYS.settings, next);
      if (key === 'darkMode') {
        Taro.setNavigationBarColor({
          frontColor: next.darkMode ? '#ffffff' : '#000000',
          backgroundColor: next.darkMode ? '#1A1A1A' : '#FFFDF9',
        });
        Taro.setBackgroundColor({
          backgroundColor: next.darkMode ? '#1A1A1A' : '#FFFDF9',
        });
      }
      return next;
    });
  };

  const handleClearCache = () => {
    CACHE_KEYS.forEach((key) => {
      Taro.removeStorageSync(key);
    });
    Taro.showToast({ title: '页面缓存已清理', icon: 'success' });
  };

  const handleOpenLogoutConfirm = async () => {
    setShowLogoutConfirm(true);
  };

  const handleSubmitAccountDeletionRequest = async () => {
    if (submittingDeletionRequest || deletionRequested) {
      return;
    }

    const authenticated = await ensureAuthenticated('已登录，请确认注销申请');
    if (!authenticated) {
      return;
    }

    try {
      setSubmittingDeletionRequest(true);
      await supportApi.submitAccountDeletionRequest();
      setDeletionRequested(true);
      setShowDeleteConfirm(false);
      Taro.showToast({ title: '注销申请已提交', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: getApiErrorMessage(error, '注销申请提交失败'), icon: 'none' });
    } finally {
      setSubmittingDeletionRequest(false);
    }
  };

  const handleOpenDeleteConfirm = async () => {
    const authenticated = await ensureAuthenticated('已登录，请确认注销申请');
    if (!authenticated) {
      return;
    }

    setShowDeleteConfirm(true);
  };

  const handleNavigateRow = (item: SettingRow) => {
    if (item.route) {
      Taro.navigateTo({ url: item.route });
    }
  };

  const renderRow = (item: SettingRow, index: number, total: number) => (
    <View key={`${item.title}-${index}`}>
      {item.type === 'toggle' || item.type === 'navigate' || item.action === 'clear-cache' ? (
      <Button
        className={`settings-row ${item.type === 'navigate' ? 'settings-row--clickable' : ''}`}
        hoverClass='none'
        onClick={() => {
          if (item.type === 'toggle' && item.toggleKey) {
            void handleToggle(item.toggleKey);
            return;
          }

          if (item.action === 'clear-cache') {
            handleClearCache();
            return;
          }

          if (item.type === 'navigate') {
            handleNavigateRow(item);
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

        {item.type === 'value' ? <Text className='settings-row__value'>{item.title === '手机号' ? profile.phone || '登录后同步' : item.value}</Text> : null}

        {item.type === 'navigate' ? <Icon name='chevron-right' className='settings-row__arrow' /> : null}
      </Button>
      ) : (
      <View className='settings-row'>
        <View className='settings-row__icon-wrap'>
          <Image className='settings-row__icon' src={item.icon} mode='aspectFit' />
        </View>

        <View className='settings-row__content'>
          <Text className='settings-row__title'>{item.title}</Text>
          {item.description ? <Text className='settings-row__description'>{item.description}</Text> : null}
        </View>

        {item.type === 'value' ? <Text className='settings-row__value'>{item.title === '手机号' ? profile.phone || '登录后同步' : item.value}</Text> : null}
      </View>
      )}
      {index < total - 1 ? <Divider spacing='none' className='settings-row__divider' /> : null}
    </View>
  );

  const renderAboutRow = (item: SettingRow, index: number, total: number) => (
    <View key={`${item.title}-${index}`}>
      {item.type === 'navigate' ? (
      <Button
        className='settings-about-row settings-about-row--clickable'
        hoverClass='none'
        onClick={() => {
          handleNavigateRow(item);
        }}
      >
        <Text className='settings-about-row__title'>{item.title}</Text>
        <Icon name='chevron-right' className='settings-about-row__arrow' />
      </Button>
      ) : (
      <View className='settings-about-row'>
        <Text className='settings-about-row__title'>{item.title}</Text>
        {item.type === 'value' ? <Text className='settings-about-row__value'>{item.value}</Text> : null}
      </View>
      )}
      {index < total - 1 ? <Divider spacing='none' className='settings-about-row__divider' /> : null}
    </View>
  );

  return (
    <PageShell className='settings-page' safeAreaBottom>
      <PageHeader
        title='设置'
        subtitle='账户安全与偏好设置'
        fallbackUrl='/pages/profile/index'
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
          <Button className='danger-action' hoverClass='none' onClick={handleOpenLogoutConfirm}>
            <Icon name='logout' className='danger-action__icon' />
            <Text className='danger-action__text'>退出登录</Text>
          </Button>
        ) : (
          <AppCard className='danger-confirm' padding='none'>
            <Text className='danger-confirm__title'>确认退出登录？</Text>
            <Text className='danger-confirm__description'>退出后需要重新登录才能继续使用。</Text>
            <View className='danger-confirm__actions'>
              <Button className='danger-confirm__button danger-confirm__button--cancel' hoverClass='none' onClick={() => setShowLogoutConfirm(false)}>
                <Text className='danger-confirm__button-text danger-confirm__button-text--cancel'>取消</Text>
              </Button>
              <Button
                className='danger-confirm__button danger-confirm__button--confirm'
                hoverClass='none'
                onClick={() => {
                  setShowLogoutConfirm(false);
                  clearAuthState();
                  Taro.switchTab({ url: '/pages/index/index' });
                }}
              >
                <Text className='danger-confirm__button-text'>确认退出</Text>
              </Button>
            </View>
          </AppCard>
        )}

        {!showDeleteConfirm ? (
          <AppCard className='danger-confirm' padding='none'>
            <Text className='danger-confirm__title'>账号注销说明</Text>
            <Text className='danger-confirm__description'>如需注销账号，可在此提交申请，门店客服会在核实身份与历史权益后人工处理。</Text>
            <View className='danger-confirm__actions'>
              <Button
                className='danger-confirm__button danger-confirm__button--confirm'
                hoverClass='none'
                onClick={handleOpenDeleteConfirm}
                disabled={deletionRequested}
              >
                <Text className='danger-confirm__button-text'>{deletionRequested ? '已提交，等待处理' : '提交注销申请'}</Text>
              </Button>
            </View>
          </AppCard>
        ) : (
          <AppCard className='danger-confirm' padding='none'>
            <Text className='danger-confirm__title'>确认提交注销申请？</Text>
            <Text className='danger-confirm__description'>提交后将由门店客服人工核实并处理，历史预约、交易与权益记录不会立即物理删除。</Text>
            <View className='danger-confirm__actions'>
              <Button
                className='danger-confirm__button danger-confirm__button--cancel'
                hoverClass='none'
                onClick={() => setShowDeleteConfirm(false)}
              >
                <Text className='danger-confirm__button-text danger-confirm__button-text--cancel'>取消</Text>
              </Button>
              <Button
                className='danger-confirm__button danger-confirm__button--confirm'
                hoverClass='none'
                onClick={handleSubmitAccountDeletionRequest}
                disabled={submittingDeletionRequest}
              >
                <Text className='danger-confirm__button-text'>{submittingDeletionRequest ? '提交中...' : '确认提交'}</Text>
              </Button>
            </View>
          </AppCard>
        )}
      </View>
    </PageShell>
  );
}
