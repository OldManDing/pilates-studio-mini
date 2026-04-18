import { Component } from 'react';
import Taro from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import Icon, { type IconName } from '../components/shell/Icon';
import './index.scss';

const TAB_ITEMS = [
  {
    pagePath: '/pages/index/index',
    label: '首页',
    iconName: 'home',
  },
  {
    pagePath: '/pages/courses/index',
    label: '预约',
    iconName: 'calendar',
  },
  {
    pagePath: '/pages/profile/index',
    label: '我的',
    iconName: 'user',
  },
] as const satisfies ReadonlyArray<{ pagePath: string; label: string; iconName: IconName }>;

interface CustomTabBarState {
  selected: number;
}

function getSelectedIndex() {
  const pages = Taro.getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const currentRoute = currentPage ? `/${currentPage.route}` : TAB_ITEMS[0].pagePath;
  const selected = TAB_ITEMS.findIndex((item) => item.pagePath === currentRoute);

  return selected >= 0 ? selected : 0;
}

export default class CustomTabBar extends Component<Record<string, never>, CustomTabBarState> {
  state: CustomTabBarState = {
    selected: 0,
  };

  componentDidMount() {
    this.setSelected(getSelectedIndex());
  }

  componentDidShow() {
    this.setSelected(getSelectedIndex());
  }

  setSelected(selected: number) {
    this.setState({ selected });
  }

  handleSwitch(index: number) {
    const item = TAB_ITEMS[index];

    if (!item || index === this.state.selected) {
      return;
    }

    this.setSelected(index);
    Taro.switchTab({ url: item.pagePath });
  }

  render() {
    return (
      <View className='custom-tab-bar'>
        <View className='custom-tab-bar__hairline' />
        <View className='custom-tab-bar__inner'>
          {TAB_ITEMS.map((item, index) => {
            const active = index === this.state.selected;

            return (
              <View key={item.pagePath} className='custom-tab-bar__item' onClick={() => this.handleSwitch(index)}>
                {active ? <View className='custom-tab-bar__active-line' /> : null}
                <Icon name={item.iconName} className={`custom-tab-bar__icon ${active ? 'custom-tab-bar__icon--active' : ''}`} />
                <Text className={`custom-tab-bar__label ${active ? 'custom-tab-bar__label--active' : ''}`}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
}
