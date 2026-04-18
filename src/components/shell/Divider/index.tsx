import { View } from '@tarojs/components';
import './index.scss';

type DividerSpacing = 'none' | 'small' | 'medium' | 'large';

interface DividerProps {
  className?: string;
  strong?: boolean;
  spacing?: DividerSpacing;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function Divider({ className, strong = false, spacing = 'medium' }: DividerProps) {
  return <View className={joinClasses(['app-divider', strong && 'app-divider--strong', `app-divider--spacing-${spacing}`, className])} />;
}
