import { View } from '@tarojs/components';
import './index.scss';

export type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'check'
  | 'clock'
  | 'pin'
  | 'mail'
  | 'logout'
  | 'send'
  | 'info'
  | 'alert-circle'
  | 'home'
  | 'calendar'
  | 'user'
  | 'star'
  | 'bolt'
  | 'spark'
  | 'dot';

interface IconProps {
  name: IconName;
  className?: string;
}

function joinClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function Icon({ name, className }: IconProps) {
  if (name === 'check' || name === 'chevron-left' || name === 'chevron-right' || name === 'mail' || name === 'logout' || name === 'send' || name === 'star' || name === 'bolt' || name === 'spark') {
    return (
      <View className={joinClasses(['app-icon', `app-icon--${name}`, className])}>
        <View className='app-icon__line app-icon__line--one' />
        <View className='app-icon__line app-icon__line--two' />
        {name === 'mail' ? <View className='app-icon__line app-icon__line--three' /> : null}
      </View>
    );
  }

  if (name === 'clock') {
    return (
      <View className={joinClasses(['app-icon', 'app-icon--clock', className])}>
        <View className='app-icon__line app-icon__line--one' />
        <View className='app-icon__line app-icon__line--two' />
      </View>
    );
  }

  if (name === 'pin') {
    return (
      <View className={joinClasses(['app-icon', 'app-icon--pin', className])}>
        <View className='app-icon__pin-head'>
          <View className='app-icon__pin-core' />
        </View>
        <View className='app-icon__pin-tail' />
      </View>
    );
  }

  if (name === 'home' || name === 'calendar' || name === 'user') {
    return (
      <View className={joinClasses(['app-icon', `app-icon--${name}`, className])}>
        <View className='app-icon__shape app-icon__shape--one' />
        <View className='app-icon__shape app-icon__shape--two' />
        <View className='app-icon__shape app-icon__shape--three' />
      </View>
    );
  }

  if (name === 'info' || name === 'alert-circle') {
    return (
      <View className={joinClasses(['app-icon', `app-icon--${name}`, className])}>
        <View className='app-icon__mark app-icon__mark--one' />
        <View className='app-icon__mark app-icon__mark--two' />
      </View>
    );
  }

  return <View className={joinClasses(['app-icon', 'app-icon--dot', className])} />;
}
