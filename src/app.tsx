import React, { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { ensureMiniProgramAuth } from './api/auth';
import './app.scss';

function App(props: { children?: React.ReactNode }) {
  useEffect(() => {
    ensureMiniProgramAuth().catch(() => {
      Taro.showToast({ title: '登录初始化失败，请稍后重试', icon: 'none' });
    });
  }, []);

  return <>{props.children}</>;
}

export default App;
