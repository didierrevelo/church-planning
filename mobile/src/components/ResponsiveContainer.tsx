import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../utils/responsive';

interface Props {
  children: React.ReactNode;
  maxWidth?: number;
  padded?: boolean;
}

export default function ResponsiveContainer({ children, maxWidth, padded = true }: Props) {
  const { isWeb, contentMaxWidth } = useResponsive();

  if (!isWeb) return <>{children}</>;

  return (
    <View style={[styles.container, { maxWidth: maxWidth || contentMaxWidth }]}>
      <View style={[styles.content, padded && styles.padded]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    width: '100%',
  },
  padded: {
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
  },
});
