declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.scss';
declare module '*.sass';
declare module '*.css';

// Taro env
declare const process: {
  env: {
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'qq' | 'jd';
    NODE_ENV: 'development' | 'production';
  };
};

declare const API_BASE_URL: string;
