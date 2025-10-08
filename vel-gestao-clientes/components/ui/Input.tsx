import React, { forwardRef } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { cn } from '@/utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  className,
  ...props
}, ref) => {
  const baseClasses = 'rounded-lg border flex-row items-center';
  
  const variantClasses = {
    default: error 
      ? 'border-danger-500 bg-white dark:bg-gray-800' 
      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary-500',
    filled: error
      ? 'border-danger-500 bg-gray-50 dark:bg-gray-700'
      : 'border-transparent bg-gray-50 dark:bg-gray-700 focus:border-primary-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 min-h-[36px]',
    md: 'px-4 py-3 min-h-[44px]',
    lg: 'px-5 py-4 min-h-[52px]',
  };
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <View className="w-full">
      {label && (
        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          {label}
        </Text>
      )}
      
      <View
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
      >
        {leftIcon && (
          <View className="mr-3">
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          className={cn(
            'flex-1 text-gray-900 dark:text-gray-100',
            textSizeClasses[size]
          )}
          placeholderTextColor="#9ca3af"
          {...props}
        />
        
        {rightIcon && (
          <View className="ml-3">
            {rightIcon}
          </View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text
          className={cn(
            'mt-1 text-sm',
            error ? 'text-danger-500' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
});