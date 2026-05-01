import { Text, View } from '@tarojs/components';
import './index.scss';

interface LoadMoreFooterProps {
  loading?: boolean;
  hasMore?: boolean;
}

export default function LoadMoreFooter({ loading = false, hasMore = false }: LoadMoreFooterProps) {
  if (!loading && !hasMore) {
    return (
      <View className='load-more-footer'>
        <Text className='load-more-footer__text'>没有更多了</Text>
      </View>
    );
  }

  return (
    <View className='load-more-footer'>
      <Text className='load-more-footer__text'>{loading ? '加载中...' : '上拉加载更多'}</Text>
    </View>
  );
}
