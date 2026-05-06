import { Button, Text } from '@tarojs/components';
import { navigateBackWithFallback } from '../../../utils/navigation';
import { getMiniFloatingBackStyle } from '../../../utils/ui';
import Icon from '../Icon';
import './index.scss';

interface FloatingBackButtonProps {
  fallbackUrl?: string;
  theme?: 'light' | 'dark';
}

export default function FloatingBackButton({
  fallbackUrl,
  theme = 'light',
}: FloatingBackButtonProps) {
  return (
    <Button
      className={`floating-back-button floating-back-button--${theme}`}
      hoverClass='none'
      style={getMiniFloatingBackStyle()}
      onClick={() => navigateBackWithFallback(fallbackUrl)}
    >
      <Icon name='chevron-left' className='floating-back-button__icon' />
      <Text className='floating-back-button__text'>返回</Text>
    </Button>
  );
}
