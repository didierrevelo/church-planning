import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS: Record<string, string> = {
  planned: '#FFA500',
  confirmed: '#4CAF50',
  finished: '#9E9E9E',
};

const LABELS: Record<string, string> = {
  planned: 'Planificado',
  confirmed: 'Confirmado',
  finished: 'Finalizado',
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const bgColor = COLORS[status] || '#666';
  const label = LABELS[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
