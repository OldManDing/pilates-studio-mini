import { View, Text } from '@tarojs/components';
import './index.scss';

interface PriceProps {
  amount: number;
  size?: 'small' | 'normal' | 'large' | 'xl';
  variant?: 'primary' | 'accent' | 'danger' | 'default';
  currency?: string;
  showDecimal?: boolean;
}

export default function Price({
  amount,
  size = 'normal',
  variant = 'primary',
  currency = '¥',
  showDecimal = true,
}: PriceProps) {
  // Convert cents to yuan
  const yuan = (amount / 100).toFixed(showDecimal ? 2 : 0);
  const [integer, decimal] = yuan.split('.');

  return (
    <View className={`price price--${size} price--${variant}`}>
      <Text className='price__currency'>{currency}</Text>
      <Text className='price__integer'>{integer}</Text>
      {showDecimal && decimal && (
        <Text className='price__decimal'>.{decimal}</Text>
      )}
    </View>
  );
}
