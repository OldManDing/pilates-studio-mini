import { Button, Text, View } from '@tarojs/components';
import Icon from '../Icon';
import './index.scss';

type SectionActionTone = 'accent' | 'muted';

interface SectionTitleProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actionLabel?: string;
  actionTone?: SectionActionTone;
  actionIcon?: 'chevron-right';
  onActionClick?: () => void;
}

export default function SectionTitle({
  title,
  actionLabel,
  actionTone = 'accent',
  actionIcon,
  onActionClick,
}: SectionTitleProps) {
  return (
    <View className='section-title-block'>
      <View className='section-title-block__main'>
        <Text className='section-title-block__title'>{title}</Text>
      </View>

      {actionLabel && onActionClick ? (
        <Button
          className={`section-title-block__action section-title-block__action--clickable section-title-block__action--${actionTone}`}
          hoverClass='section-title-block__action--hover'
          onClick={onActionClick}
        >
          <Text className='section-title-block__action-text'>{actionLabel}</Text>
          {actionIcon ? <Icon name={actionIcon} className='section-title-block__action-icon' /> : null}
        </Button>
      ) : actionLabel && actionIcon ? (
        <View className={`section-title-block__action section-title-block__action--static section-title-block__action--${actionTone}`}>
          <Text className='section-title-block__action-text'>{actionLabel}</Text>
          {actionIcon ? <Icon name={actionIcon} className='section-title-block__action-icon' /> : null}
        </View>
      ) : null}
    </View>
  );
}
