import type { PropsWithChildren } from 'react';
import { Button } from '@tarojs/components';
import './index.scss';

type AppButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
type AppButtonSize = 'small' | 'medium' | 'large';

interface AppButtonProps extends PropsWithChildren {
  className?: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function AppButton({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
}: AppButtonProps) {
  return (
    <Button
      className={joinClasses(['app-button', `app-button--${variant}`, `app-button--${size}`, (disabled || loading) && 'app-button--disabled', loading && 'app-button--loading', className])}
      disabled={disabled || loading}
      loading={loading}
      hoverClass='none'
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
