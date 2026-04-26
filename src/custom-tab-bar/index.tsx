import { Component } from 'react';
import Taro from '@tarojs/taro';
import { Image, View, Text } from '@tarojs/components';
import { TAB_NAV_ITEMS, toTabPageUrl } from '../constants/navigation';
import './index.scss';

const TAB_ITEMS = TAB_NAV_ITEMS;

interface CustomTabBarState {
  selected: number;
}

function getSelectedIndex() {
  const pages = Taro.getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const currentRoute = currentPage ? `/${currentPage.route}` : toTabPageUrl(TAB_ITEMS[0].pagePath);
  const selected = TAB_ITEMS.findIndex((item) => toTabPageUrl(item.pagePath) === currentRoute);

  return selected >= 0 ? selected : 0;
}

export default class CustomTabBar extends Component<Record<string, never>, CustomTabBarState> {
  private switching = false;

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

  async handleSwitch(index: number) {
    const item = TAB_ITEMS[index];

    if (!item || this.switching) {
      return;
    }

    this.switching = true;

    try {
      await Taro.switchTab({ url: toTabPageUrl(item.pagePath) });
    } catch (error) {
      this.setSelected(getSelectedIndex());
      Taro.showToast({ title: '切换失败，请重试', icon: 'none' });
    } finally {
      this.switching = false;
    }
  }

  render() {
    return (
      <View className='custom-tab-bar'>
        <View className='custom-tab-bar__hairline' />
        <View className='custom-tab-bar__inner'>
          {TAB_ITEMS.map((item, index) => {
            const active = index === this.state.selected;

            return (
              <View
                key={item.pagePath}
                className='custom-tab-bar__item'
                onClick={() => this.handleSwitch(index)}
              >
                {active ? <View className='custom-tab-bar__active-line' /> : null}
                <Image
                  className='custom-tab-bar__icon'
                  src={`/${active ? item.selectedIconPath : item.iconPath}`}
                  mode='aspectFit'
                />
                <Text className={`custom-tab-bar__label ${active ? 'custom-tab-bar__label--active' : ''}`}>{item.text}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
}
