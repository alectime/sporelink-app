import React from 'react';
import { Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const Icon = ({ name, size, color }) => {
  if (Platform.OS === 'web') {
    // Use specific unicode characters for web
    const getIconContent = (iconName) => {
      const iconMap = {
        'add-circle': '⊕',
        'ellipsis-horizontal': '⋯',
        'calendar-outline': '📅',
        'leaf-outline': '🌱',
        'time-outline': '⏱',
        'thermometer-outline': '🌡',
        'water-outline': '💧',
        'arrow-back': '←'
      };
      return iconMap[iconName] || '•';
    };
    
    return (
      <Text style={{ fontSize: size, color, fontWeight: 'bold' }}>
        {getIconContent(name)}
      </Text>
    );
  }
  
  return <Ionicons name={name} size={size} color={color} />;
}; 