import type { PropsWithChildren } from 'react';
import { View } from '@tarojs/components';
import { getMiniPageTopInset } from '../../../utils/ui';
import './index.scss';

interface PageShellProps extends PropsWithChildren {
  className?: string;
  compact?: boolean;
  safeAreaBottom?: boolean;
  reserveTabBarSpace?: boolean;
  flushTop?: boolean;
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
  flushTop = false,
}: PageShellProps) {
  const miniPageTopInset = flushTop ? 0 : getMiniPageTopInset();
  const innerStyle = {
    '--page-shell-top-inset': `${miniPageTopInset}px`,
    ...(miniPageTopInset ? { paddingTop: `${miniPageTopInset}px` } : {}),
  };

  return (
    <View className={joinClasses(['page-shell', compact && 'page-shell--compact', safeAreaBottom && 'page-shell--safe-bottom', reserveTabBarSpace && 'page-shell--with-tab-bar', flushTop && 'page-shell--flush-top', className])}>
      <View className='page-shell__inner' style={innerStyle}>{children}</View>
    </View>
  );
}
