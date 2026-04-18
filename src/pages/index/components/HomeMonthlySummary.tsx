import { Text, View } from '@tarojs/components';
import { AppCard } from '../../../components';
import type { HomeMonthlySummaryData } from './types';

interface HomeMonthlySummaryProps {
  data: HomeMonthlySummaryData;
}

export default function HomeMonthlySummary({ data }: HomeMonthlySummaryProps) {
  const progressValueMatch = data.progressText.match(/(\d+)/);
  const progressValue = progressValueMatch ? Number.parseInt(progressValueMatch[1], 10) : Number.NaN;
  const progressWidth = Number.isFinite(progressValue) ? `${Math.max(10, Math.min(100, progressValue))}%` : '40%';
  const [leftItem, rightItem] = data.sideItems;

  return (
    <AppCard className='home-monthly-summary' padding='none'>
      <View className='home-monthly-summary__top'>
        <View className='home-monthly-summary__hero'>
          <Text className='home-monthly-summary__label'>{data.label}</Text>
          <View className='home-monthly-summary__value-row'>
            <Text className='home-monthly-summary__value'>{data.value}</Text>
            <Text className='home-monthly-summary__unit'>{data.unit}</Text>
          </View>
        </View>

        <View className='home-monthly-summary__splitter' />

        <View className='home-monthly-summary__side'>
          {leftItem ? (
            <View className='home-monthly-summary__side-item'>
              <Text className='home-monthly-summary__side-label'>{leftItem.label}</Text>
              <View className='home-monthly-summary__side-value-row'>
                <Text className='home-monthly-summary__side-value'>{leftItem.value}</Text>
                <Text className='home-monthly-summary__side-unit'>{leftItem.unit}</Text>
              </View>
            </View>
          ) : null}

          {rightItem ? (
            <View className='home-monthly-summary__side-item'>
              <Text className='home-monthly-summary__side-label'>{rightItem.label}</Text>
              <View className='home-monthly-summary__side-value-row'>
                <Text className='home-monthly-summary__side-value'>{rightItem.value}</Text>
                <Text className='home-monthly-summary__side-unit'>{rightItem.unit}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View className='home-monthly-summary__progress-track'>
        <View className='home-monthly-summary__progress-fill' style={{ width: progressWidth }} />
      </View>
      <Text className='home-monthly-summary__progress-text'>{data.progressText}</Text>
    </AppCard>
  );
}
