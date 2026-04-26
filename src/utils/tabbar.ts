import Taro from '@tarojs/taro';

interface CustomTabBarInstance {
  setSelected?: (selected: number) => void;
}

export function syncCustomTabBarSelected(selected: number) {
  const page = Taro.getCurrentInstance().page;

  if (!page) {
    return;
  }

  Taro.getTabBar<CustomTabBarInstance>(page)?.setSelected?.(selected);
}
