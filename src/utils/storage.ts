import Taro from '@tarojs/taro';
import { STORAGE_KEYS } from '../constants/storage';

export function readStorage<T>(key: string, fallback: T): T {
  const value = Taro.getStorageSync<T | ''>(key);
  return value === '' || value === undefined || value === null ? fallback : value;
}

export function writeStorage<T>(key: string, value: T) {
  Taro.setStorageSync(key, value);
}

export function clearAuthState() {
  Taro.removeStorageSync('token');
  Taro.removeStorageSync(STORAGE_KEYS.profile);
  Taro.removeStorageSync('biometricEnabled');
}
