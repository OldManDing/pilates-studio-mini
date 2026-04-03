import React, { useEffect } from 'react';
import Taro from '@tarojs/taro';
import './app.scss';

function App(props: { children?: React.ReactNode }) {
  useEffect(() => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      // Optionally navigate to login page
      // Taro.navigateTo({ url: '/pages/login/index' });
    }
  }, []);

  return props.children as any;
}

export default App;
