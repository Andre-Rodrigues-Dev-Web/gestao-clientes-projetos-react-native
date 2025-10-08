import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Card, CardHeader, CardContent } from './Card';

const { width: screenWidth } = Dimensions.get('window');

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: ChartDataItem[];
  title: string;
  height?: number;
}

export function CustomBarChart({ data, title, height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));
  const chartWidth = screenWidth - 80; // Padding considerations
  const barWidth = (chartWidth - (data.length - 1) * 8) / data.length; // 8px gap between bars

  return (
    <Card>
      <CardHeader>
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </Text>
      </CardHeader>
      <CardContent>
        <View className="flex-row items-end justify-between" style={{ height }}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
            
            return (
              <View key={index} className="items-center" style={{ width: barWidth }}>
                <Text className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {item.value}
                </Text>
                <View
                  className="rounded-t-md"
                  style={{
                    width: barWidth - 4,
                    height: Math.max(barHeight, 4),
                    backgroundColor: item.color,
                  }}
                />
                <Text className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
}

interface LineChartProps {
  data: ChartDataItem[];
  title: string;
  height?: number;
}

export function CustomLineChart({ data, title, height = 200 }: LineChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const chartWidth = screenWidth - 80;
  const chartHeight = height - 60;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.value - minValue) / (maxValue - minValue)) * chartHeight;
    return { x, y, value: item.value };
  });

  return (
    <Card>
      <CardHeader>
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </Text>
      </CardHeader>
      <CardContent>
        <View style={{ height }}>
          {/* Chart Area */}
          <View className="relative" style={{ height: chartHeight, width: chartWidth }}>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <View
                key={index}
                className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                style={{ top: ratio * chartHeight }}
              />
            ))}
            
            {/* Data Points and Lines */}
            {points.map((point, index) => (
              <View key={index}>
                {/* Line to next point */}
                {index < points.length - 1 && (
                  <View
                    className="absolute bg-blue-500"
                    style={{
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(points[index + 1].x - point.x, 2) +
                        Math.pow(points[index + 1].y - point.y, 2)
                      ),
                      height: 2,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            points[index + 1].y - point.y,
                            points[index + 1].x - point.x
                          )}rad`,
                        },
                      ],
                    }}
                  />
                )}
                
                {/* Data Point */}
                <View
                  className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"
                  style={{
                    left: point.x - 6,
                    top: point.y - 6,
                  }}
                />
                
                {/* Value Label */}
                <Text
                  className="absolute text-xs font-medium text-gray-900 dark:text-gray-100"
                  style={{
                    left: point.x - 15,
                    top: point.y - 25,
                  }}
                >
                  {point.value}
                </Text>
              </View>
            ))}
          </View>
          
          {/* X-Axis Labels */}
          <View className="flex-row justify-between mt-2">
            {data.map((item, index) => (
              <Text key={index} className="text-xs text-gray-600 dark:text-gray-400">
                {item.label}
              </Text>
            ))}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

interface PieChartProps {
  data: ChartDataItem[];
  title: string;
  size?: number;
}

export function CustomPieChart({ data, title, size = 150 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2;
  const center = radius;
  
  let currentAngle = 0;
  const segments = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
    };
  });

  return (
    <Card>
      <CardHeader>
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </Text>
      </CardHeader>
      <CardContent>
        <View className="items-center">
          {/* Pie Chart */}
          <View className="relative" style={{ width: size, height: size }}>
            {segments.map((segment, index) => {
              const largeArcFlag = segment.percentage > 0.5 ? 1 : 0;
              const x1 = center + radius * Math.cos(segment.startAngle - Math.PI / 2);
              const y1 = center + radius * Math.sin(segment.startAngle - Math.PI / 2);
              const x2 = center + radius * Math.cos(segment.endAngle - Math.PI / 2);
              const y2 = center + radius * Math.sin(segment.endAngle - Math.PI / 2);
              
              return (
                <View
                  key={index}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: segment.color,
                    transform: [
                      { rotate: `${segment.startAngle}rad` }
                    ],
                  }}
                />
              );
            })}
            
            {/* Center Circle */}
            <View
              className="absolute bg-white dark:bg-gray-800 rounded-full items-center justify-center"
              style={{
                width: size * 0.6,
                height: size * 0.6,
                left: size * 0.2,
                top: size * 0.2,
              }}
            >
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {total}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Total
              </Text>
            </View>
          </View>
          
          {/* Legend */}
          <View className="mt-4 space-y-2">
            {segments.map((segment, index) => (
              <View key={index} className="flex-row items-center justify-between w-full">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: segment.color }}
                  />
                  <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {segment.label}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {segment.value} ({Math.round(segment.percentage * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

interface DonutChartProps {
  data: ChartDataItem[];
  title: string;
  size?: number;
}

export function CustomDonutChart({ data, title, size = 150 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card>
      <CardHeader>
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </Text>
      </CardHeader>
      <CardContent>
        <View className="items-center">
          {/* Simple Donut representation using stacked circles */}
          <View className="relative items-center justify-center" style={{ width: size, height: size }}>
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const circumference = 2 * Math.PI * (size / 2 - 10);
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              
              return (
                <View
                  key={index}
                  className="absolute rounded-full border-8"
                  style={{
                    width: size - index * 16,
                    height: size - index * 16,
                    borderColor: item.color,
                    borderWidth: 8,
                    backgroundColor: 'transparent',
                  }}
                />
              );
            })}
            
            {/* Center Content */}
            <View className="absolute items-center justify-center">
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {total}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Total
              </Text>
            </View>
          </View>
          
          {/* Legend */}
          <View className="mt-4 space-y-2">
            {data.map((item, index) => (
              <View key={index} className="flex-row items-center justify-between w-full">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {item.label}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.value} ({Math.round((item.value / total) * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}