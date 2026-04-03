import { View, Text } from '@tarojs/components';
import { Booking } from '../../api/bookings';
import { BookingStatuses } from '../../constants/enums';
import StatusTag from '../StatusTag';
import './index.scss';

interface BookingItemProps {
  booking: Booking;
  onClick?: () => void;
}

function formatDateTime(isoString: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

function formatDate(isoString: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function BookingItem({ booking, onClick }: BookingItemProps) {
  const session = booking.session;
  const course = session?.course;

  return (
    <View className='booking-item' onClick={onClick}>
      <View className='booking-item__header'>
        <View className='booking-item__code'>
          <Text className='booking-item__code-label'>预约编号</Text>
          <Text className='booking-item__code-value'>{booking.bookingCode}</Text>
        </View>
        <StatusTag value={booking.status} options={BookingStatuses} size='small' />
      </View>
      <View className='booking-item__content'>
        <Text className='booking-item__course'>{course?.name || '未知课程'}</Text>
        <View className='booking-item__details'>
          {session && (
            <>
              <Text className='booking-item__detail'>
                {formatDate(session.startsAt)} {formatDateTime(session.startsAt).split(' ')[1]} - {formatDateTime(session.endsAt).split(' ')[1]}
              </Text>
              {session.coach && (
                <Text className='booking-item__detail'>教练：{session.coach.name}</Text>
              )}
            </>
          )}
        </View>
      </View>
      <View className='booking-item__footer'>
        <Text className='booking-item__time'>预约时间：{formatDateTime(booking.bookingTime)}</Text>
      </View>
    </View>
  );
}
