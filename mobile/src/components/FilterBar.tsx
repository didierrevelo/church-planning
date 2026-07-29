import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PRIMARY = '#5B5EA6';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterBarProps {
  options: FilterOption[];
  active: string;
  onSelect: (key: string) => void;
}

export default function FilterBar({ options, active, onSelect }: FilterBarProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.btn, active === option.key && styles.btnActive]}
          onPress={() => onSelect(option.key)}
        >
          <Text style={[styles.text, active === option.key && styles.textActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  btnActive: {
    backgroundColor: PRIMARY,
  },
  text: {
    color: '#666',
  },
  textActive: {
    color: '#fff',
  },
});
