import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { AppCard, Divider, PageHeader, PageShell, SectionTitle } from '../../components';
import { STORAGE_KEYS } from '../../constants/storage';
import { readStorage, writeStorage } from '../../utils/storage';
import './index.scss';

interface SettingsStorage {
  biometric?: boolean;
}

export default function AccountSecurity() {
  const profile = readStorage<{ phone?: string; hasBoundPhone?: boolean }>(STORAGE_KEYS.profile, {});
  const hasBoundPhone = profile.hasBoundPhone === true;
  const [biometricEnabled, setBiometricEnabled] = useState(() => readStorage<SettingsStorage>(STORAGE_KEYS.settings, { biometric: true }).biometric === true);
  const [loginProtectionEnabled, setLoginProtectionEnabled] = useState(() => Taro.getStorageSync('loginProtectionEnabled') !== false);

  const toggleBiometric = () => {
    setBiometricEnabled((value) => {
      const nextValue = !value;
      const settings = readStorage<SettingsStorage>(STORAGE_KEYS.settings, {});
      writeStorage(STORAGE_KEYS.settings, { ...settings, biometric: nextValue });
      return nextValue;
    });
  };

  const toggleLoginProtection = () => {
    setLoginProtectionEnabled((value) => {
      const nextValue = !value;
      Taro.setStorageSync('loginProtectionEnabled', nextValue);
      return nextValue;
    });
  };

  return (
    <PageShell className='account-security-page' safeAreaBottom>
      <PageHeader title='账户安全' subtitle='手机号展示与本机登录偏好' fallbackUrl='/pages/settings/index' />

      <View className='account-security-page__section'>
        <SectionTitle title='登录账户' actionLabel='ACCOUNT' actionTone='muted' />
        <AppCard padding='none' className='security-group'>
          <View className='security-row'>
            <View className='security-row__main'>
              <Text className='security-row__title'>绑定手机号</Text>
              <Text className='security-row__desc'>{profile.phone || '登录后同步手机号'}</Text>
            </View>
            <Text className='security-row__value'>{hasBoundPhone ? '已绑定' : '未同步'}</Text>
          </View>
          <Divider spacing='none' />
          <View className='security-row'>
            <View className='security-row__main'>
              <Text className='security-row__title'>账号管理说明</Text>
              <Text className='security-row__desc'>当前账号通过微信授权登录，不支持在小程序内单独修改密码。</Text>
            </View>
            <Text className='security-row__value'>微信授权</Text>
          </View>
        </AppCard>
      </View>

      <View className='account-security-page__section'>
        <SectionTitle title='安全保护' actionLabel='PROTECT' actionTone='muted' />
        <AppCard padding='none' className='security-group'>
          <Button className='security-row security-row--clickable' hoverClass='none' onClick={toggleBiometric}>
            <View className='security-row__main'>
              <Text className='security-row__title'>面容/指纹解锁</Text>
              <Text className='security-row__desc'>记录当前设备的快捷访问偏好，不影响服务端登录方式。</Text>
            </View>
            <View className={`security-toggle ${biometricEnabled ? 'security-toggle--on' : ''}`}>
              <View className='security-toggle__dot' />
            </View>
          </Button>
          <Divider spacing='none' />
          <Button className='security-row security-row--clickable' hoverClass='none' onClick={toggleLoginProtection}>
            <View className='security-row__main'>
              <Text className='security-row__title'>异地登录提醒</Text>
              <Text className='security-row__desc'>当前仅保留本机安全提醒偏好，暂未与服务端风控联动。</Text>
            </View>
            <View className={`security-toggle ${loginProtectionEnabled ? 'security-toggle--on' : ''}`}>
              <View className='security-toggle__dot' />
            </View>
          </Button>
        </AppCard>
      </View>

      <AppCard className='account-security-page__notice'>
        <Text className='account-security-page__notice-title'>安全提示</Text>
        <Text className='account-security-page__notice-desc'>请勿向他人透露验证码、密码或会员账户信息。如发现异常，请及时联系客服并尽快修改密码。</Text>
      </AppCard>
    </PageShell>
  );
}
