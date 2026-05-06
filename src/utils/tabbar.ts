import Taro from '@tarojs/taro';

interface CustomTabBarInstance {
  setSelected?: (selected: number) => void;
}

type TaroWithOptionalTabBar = typeof Taro & {
  getTabBar?: typeof Taro.getTabBar;
};

export function syncCustomTabBarSelected(selected: number) {
  const page = Taro.getCurrentInstance().page;
  const getTabBar = (Taro as TaroWithOptionalTabBar).getTabBar;

  if (!page || typeof getTabBar !== 'function') {
    return;
  }

  getTabBar<CustomTabBarInstance>(page)?.setSelected?.(selected);
}
