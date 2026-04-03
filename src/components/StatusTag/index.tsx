import { View, Text } from '@tarojs/components';
import { getLabelByValue, getColorByValue } from '../../constants/enums';
import './index.scss';

type StatusArray = readonly { value: string | number; label: string; color?: string }[];

interface StatusTagProps {
  value: string | number;
  options: StatusArray;
  size?: 'small' | 'normal';
  outline?: boolean;
}

export default function StatusTag({ value, options, size = 'normal', outline = false }: StatusTagProps) {
  const label = getLabelByValue(options, value);
  const color = getColorByValue(options, value);

  return (
    <View
      className={`status-tag status-tag--${size} ${outline ? 'status-tag--outline' : ''}`}
      style={{
        backgroundColor: outline ? 'transparent' : `${color}1A`,
        color,
        borderColor: color,
      }}
    >
      <Text className='status-tag__text'>{label}</Text>
    </View>
  );
}
