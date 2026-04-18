import type { PropsWithChildren } from 'react';
import { View } from '@tarojs/components';
import './index.scss';

type AppCardVariant = 'default' | 'elevated' | 'flat';
type AppCardPadding = 'none' | 'small' | 'medium' | 'large';

interface AppCardProps extends PropsWithChildren {
  className?: string;
  variant?: AppCardVariant;
  padding?: AppCardPadding;
  onClick?: () => void;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function AppCard({
  children,
  className,
  variant = 'default',
  padding = 'large',
  onClick,
}: AppCardProps) {
  return (
    <View className={joinClasses(['app-shell-card', `app-shell-card--${variant}`, `app-shell-card--padding-${padding}`, className])} onClick={onClick}>
      {children}
    </View>
  );
}
