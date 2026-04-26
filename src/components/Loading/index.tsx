import { View, Text } from '@tarojs/components';
import './index.scss';

interface LoadingProps {
  text?: string;
  compact?: boolean;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function Loading({ text = '加载中...', compact = false }: LoadingProps) {
  return (
    <View className={joinClasses(['loading', compact && 'loading--compact'])}>
      <View className='loading__panel'>
        <View className='loading__spinner' />
        <Text className='loading__title'>正在准备页面</Text>
        <Text className='loading__text'>{text}</Text>
      </View>
    </View>
  );
}
