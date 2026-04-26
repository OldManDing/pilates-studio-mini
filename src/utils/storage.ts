import Taro from '@tarojs/taro';

export function readStorage<T>(key: string, fallback: T): T {
  const value = Taro.getStorageSync<T | ''>(key);
  return value === '' || value === undefined || value === null ? fallback : value;
}

export function writeStorage<T>(key: string, value: T) {
  Taro.setStorageSync(key, value);
}
