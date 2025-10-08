import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  scrollable?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  scrollable = true,
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'w-full h-full',
  };

  const Content = scrollable ? ScrollView : View;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg w-full',
            size !== 'full' && sizeClasses[size],
            size === 'full' && 'flex-1'
          )}
        >
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                  {title}
                </Text>
              )}
              
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2 -mr-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <Content
            className={cn(
              'flex-1',
              scrollable ? 'p-4' : ''
            )}
            showsVerticalScrollIndicator={false}
          >
            {size === 'full' ? (
              <SafeAreaView className="flex-1">
                {!scrollable && <View className="p-4">{children}</View>}
                {scrollable && children}
              </SafeAreaView>
            ) : (
              <>
                {!scrollable && <View className="p-4">{children}</View>}
                {scrollable && children}
              </>
            )}
          </Content>
        </View>
      </View>
    </RNModal>
  );
}