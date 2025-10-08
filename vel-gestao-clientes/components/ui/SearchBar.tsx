import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  showFilterButton?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onFilter,
  showFilterButton = false,
  className,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View
      className={cn(
        'flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 border',
        isFocused
          ? 'border-primary-500'
          : 'border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 12 }} />
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        className="flex-1 text-gray-900 dark:text-gray-100 text-base"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          className="p-1 mr-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color="#6b7280" />
        </TouchableOpacity>
      )}
      
      {showFilterButton && onFilter && (
        <TouchableOpacity
          onPress={onFilter}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="filter" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  );
}