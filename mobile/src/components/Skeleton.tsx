import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.lineWide} />
      <View style={styles.lineMedium} />
      <View style={styles.lineRow}>
        <View style={styles.lineSmall} />
        <View style={styles.lineSmall} />
        <View style={styles.lineSmall} />
      </View>
    </View>
  );
}

export function SkeletonMember() {
  return (
    <View style={styles.memberRow}>
      <View style={styles.circle} />
      <View style={styles.memberInfo}>
        <View style={styles.lineMedium} />
        <View style={styles.lineSmall} />
      </View>
    </View>
  );
}

export function SkeletonHeader() {
  return (
    <View style={styles.headerBlock}>
      <View style={styles.lineWide} />
      <View style={[styles.lineMedium, { marginTop: 8 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lineWide: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  lineMedium: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '50%',
  },
  lineSmall: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '30%',
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  headerBlock: {
    padding: 20,
    paddingTop: 50,
  },
});
