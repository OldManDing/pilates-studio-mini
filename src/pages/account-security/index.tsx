import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Input, Text, View } from '@tarojs/components';
import { membersApi } from '../../api/members';
import { AppButton, AppCard, Divider, PageHeader, PageShell, SectionTitle } from '../../components';
import { STORAGE_KEYS } from '../../constants/storage';
import { readStorage } from '../../utils/storage';
import './index.scss';

export default function AccountSecurity() {
  const profile = readStorage<{ phone?: string; hasBoundPhone?: boolean }>(STORAGE_KEYS.profile, {});
  const hasBoundPhone = profile.hasBoundPhone === true;
  const [biometricEnabled, setBiometricEnabled] = useState(() => Boolean(Taro.getStorageSync('biometricEnabled')));
  const [loginProtectionEnabled, setLoginProtectionEnabled] = useState(() => Taro.getStorageSync('loginProtectionEnabled') !== false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordChange = () => {
    setShowPasswordForm(true);
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
  };

  const handlePasswordSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Taro.showToast({ title: '请完整填写密码信息', icon: 'none' });
      return;
    }

    if (newPassword.length < 8) {
      Taro.showToast({ title: '新密码至少 8 位', icon: 'none' });
      return;
    }

    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次新密码不一致', icon: 'none' });
      return;
    }

    try {
      setSubmitting(true);
      await membersApi.changePassword({ currentPassword, newPassword });
      Taro.showToast({ title: '密码已更新', icon: 'success' });
      resetPasswordForm();
    } catch {
      Taro.showToast({ title: '密码修改失败，请稍后重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBiometric = () => {
    setBiometricEnabled((value) => {
      const nextValue = !value;
      Taro.setStorageSync('biometricEnabled', nextValue);
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
      <PageHeader title='账户安全' subtitle='手机号、密码与登录保护' fallbackUrl='/pages/settings/index' />

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
          <View className='security-row security-row--clickable' onClick={handlePasswordChange}>
            <View className='security-row__main'>
              <Text className='security-row__title'>修改密码</Text>
              <Text className='security-row__desc'>定期修改保障账户安全</Text>
            </View>
            <Text className='security-row__value'>去修改</Text>
          </View>
        </AppCard>
      </View>

      {showPasswordForm ? (
        <View className='account-security-page__section'>
          <SectionTitle title='修改密码' actionLabel='PASSWORD' actionTone='muted' />
          <AppCard className='password-form'>
            <View className='password-form__field'>
              <Text className='password-form__label'>当前密码</Text>
              <Input
                className='password-form__input'
                password
                value={currentPassword}
                placeholder='请输入当前密码'
                onInput={(event) => setCurrentPassword(String(event.detail.value || ''))}
              />
            </View>
            <View className='password-form__field'>
              <Text className='password-form__label'>新密码</Text>
              <Input
                className='password-form__input'
                password
                value={newPassword}
                placeholder='至少 8 位字符'
                onInput={(event) => setNewPassword(String(event.detail.value || ''))}
              />
            </View>
            <View className='password-form__field'>
              <Text className='password-form__label'>确认新密码</Text>
              <Input
                className='password-form__input'
                password
                value={confirmPassword}
                placeholder='再次输入新密码'
                onInput={(event) => setConfirmPassword(String(event.detail.value || ''))}
              />
            </View>
            <View className='password-form__actions'>
              <AppButton variant='outline' onClick={resetPasswordForm}>取消</AppButton>
              <AppButton variant='primary' disabled={submitting} onClick={handlePasswordSubmit}>{submitting ? '更新中...' : '确认修改'}</AppButton>
            </View>
          </AppCard>
        </View>
      ) : null}

      <View className='account-security-page__section'>
        <SectionTitle title='安全保护' actionLabel='PROTECT' actionTone='muted' />
        <AppCard padding='none' className='security-group'>
          <View className='security-row security-row--clickable' onClick={toggleBiometric}>
            <View className='security-row__main'>
              <Text className='security-row__title'>面容/指纹解锁</Text>
              <Text className='security-row__desc'>使用生物识别快速登录</Text>
            </View>
            <View className={`security-toggle ${biometricEnabled ? 'security-toggle--on' : ''}`}>
              <View className='security-toggle__dot' />
            </View>
          </View>
          <Divider spacing='none' />
          <View className='security-row security-row--clickable' onClick={toggleLoginProtection}>
            <View className='security-row__main'>
              <Text className='security-row__title'>异地登录提醒</Text>
              <Text className='security-row__desc'>检测异常登录时发送提醒</Text>
            </View>
            <View className={`security-toggle ${loginProtectionEnabled ? 'security-toggle--on' : ''}`}>
              <View className='security-toggle__dot' />
            </View>
          </View>
        </AppCard>
      </View>

      <AppCard className='account-security-page__notice'>
        <Text className='account-security-page__notice-title'>安全提示</Text>
        <Text className='account-security-page__notice-desc'>请勿向他人透露验证码、密码或会员账户信息。如发现异常，请及时联系客服并尽快修改密码。</Text>
      </AppCard>
    </PageShell>
  );
}
