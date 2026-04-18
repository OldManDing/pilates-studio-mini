import { Text, View } from '@tarojs/components';
import Icon from '../Icon';

type SectionActionTone = 'accent' | 'muted';
import './index.scss';

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
  eyebrow,
  subtitle,
  actionLabel,
  actionTone = 'accent',
  actionIcon,
  onActionClick,
}: SectionTitleProps) {
  return (
    <View className='section-title-block'>
      <View className='section-title-block__main'>
        {eyebrow ? <Text className='section-title-block__eyebrow'>{eyebrow}</Text> : null}
        <Text className='section-title-block__title'>{title}</Text>
        {subtitle ? <Text className='section-title-block__subtitle'>{subtitle}</Text> : null}
      </View>

      {actionLabel ? (
        <View className={`section-title-block__action section-title-block__action--${actionTone}`} onClick={onActionClick}>
          <Text className='section-title-block__action-text'>{actionLabel}</Text>
          {actionIcon ? <Icon name={actionIcon} className='section-title-block__action-icon' /> : null}
        </View>
      ) : null}
    </View>
  );
}
