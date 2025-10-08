import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = '#3b82f6',
  message,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const containerClasses = fullScreen
    ? 'flex-1 justify-center items-center bg-white dark:bg-gray-900'
    : 'justify-center items-center py-8';

  return (
    <View className={cn(containerClasses, className)}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-gray-600 dark:text-gray-400 mt-3 text-center">
          {message}
        </Text>
      )}
    </View>
  );
}