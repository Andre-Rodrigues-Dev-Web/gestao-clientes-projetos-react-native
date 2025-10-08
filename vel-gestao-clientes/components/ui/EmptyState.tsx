import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 justify-center items-center px-6 py-12', className)}>
      {icon && (
        <View className="mb-4 opacity-50">
          {icon}
        </View>
      )}
      
      <Text className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
        {title}
      </Text>
      
      {description && (
        <Text className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-6">
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}