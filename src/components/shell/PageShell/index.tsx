import type { PropsWithChildren } from 'react';
import { View } from '@tarojs/components';
import './index.scss';

interface PageShellProps extends PropsWithChildren {
  className?: string;
  compact?: boolean;
  safeAreaBottom?: boolean;
  reserveTabBarSpace?: boolean;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function PageShell({
  children,
  className,
  compact = false,
  safeAreaBottom = false,
  reserveTabBarSpace = false,
}: PageShellProps) {
  return (
    <View className={joinClasses(['page-shell', compact && 'page-shell--compact', safeAreaBottom && 'page-shell--safe-bottom', reserveTabBarSpace && 'page-shell--with-tab-bar', className])}>
      <View className='page-shell__inner'>{children}</View>
    </View>
  );
}
