import Taro from '@tarojs/taro';
import { http } from './request';
import { Member } from './members';
import { STORAGE_KEYS } from '../constants/storage';

export interface MiniLoginData {
  code?: string;
  openId?: string;
  unionId?: string;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface MiniLoginResult {
  accessToken: string;
  miniUser: {
    id: string;
    openId: string;
    unionId?: string;
    nickname?: string;
    avatarUrl?: string;
    phone?: string;
    status: 'ACTIVE' | 'DISABLED';
  };
  member?: Member | null;
}

export const miniAuthApi = {
  login: async (data: MiniLoginData) => {
    const response = await http.post<MiniLoginResult>('/mini-auth/login', data, { showLoading: false });
    Taro.setStorageSync('token', response.data.accessToken);
    Taro.setStorageSync(STORAGE_KEYS.miniUser, response.data.miniUser);
    return response;
  },
};
