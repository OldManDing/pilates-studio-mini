import { Text, View } from '@tarojs/components';
import type { HomeMonthlySummaryData } from './types';

interface HomeMonthlySummaryProps {
  data: HomeMonthlySummaryData;
}

export default function HomeMonthlySummary({ data }: HomeMonthlySummaryProps) {
  return (
    <View className='home-monthly-summary home-shell-card'>
      <View className='home-monthly-summary__layout'>
        <View className='home-monthly-summary__hero'>
          <Text className='home-monthly-summary__label'>{data.label}</Text>
          <View className='home-monthly-summary__value-row'>
            <Text className='home-monthly-summary__value'>{data.value}</Text>
            <Text className='home-monthly-summary__unit'>{data.unit}</Text>
          </View>
        </View>

        <View className='home-monthly-summary__separator' />

        <View className='home-monthly-summary__side'>
          {data.sideItems.map((item) => (
            <View key={item.key} className='home-monthly-summary__side-item'>
              <Text className='home-monthly-summary__side-label'>{item.label}</Text>
              <View className='home-monthly-summary__side-value-row'>
                <Text className='home-monthly-summary__side-value'>{item.value}</Text>
                <Text className='home-monthly-summary__side-unit'>{item.unit}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className='home-monthly-summary__progress-track'>
        <View className='home-monthly-summary__progress-fill' />
      </View>
      <Text className='home-monthly-summary__progress-text'>{data.progressText}</Text>
    </View>
  );
}
