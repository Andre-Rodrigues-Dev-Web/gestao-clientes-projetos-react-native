import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const baseClasses = 'rounded-full flex-row items-center justify-center';
  
  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-700',
    success: 'bg-success-100 dark:bg-success-900',
    warning: 'bg-warning-100 dark:bg-warning-900',
    danger: 'bg-danger-100 dark:bg-danger-900',
    info: 'bg-primary-100 dark:bg-primary-900',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
  };
  
  const textVariantClasses = {
    default: 'text-gray-700 dark:text-gray-300',
    success: 'text-success-700 dark:text-success-300',
    warning: 'text-warning-700 dark:text-warning-300',
    danger: 'text-danger-700 dark:text-danger-300',
    info: 'text-primary-700 dark:text-primary-300',
  };
  
  const textSizeClasses = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-medium',
  };

  return (
    <View
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      <Text
        className={cn(
          textVariantClasses[variant],
          textSizeClasses[size]
        )}
      >
        {children}
      </Text>
    </View>
  );
}