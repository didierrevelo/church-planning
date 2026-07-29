import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ServiceSegment } from '../types';

const PRIMARY = '#5B5EA6';

interface SegmentItemProps {
  segment: ServiceSegment;
  index: number;
}

export default function SegmentItem({ segment, index }: SegmentItemProps) {
  return (
    <View style={styles.segment}>
      <View style={styles.segmentNumber}>
        <Text style={styles.segmentNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.segmentContent}>
        <Text style={styles.segmentTitle}>{segment.title}</Text>
        {segment.durationMin && (
          <Text style={styles.segmentDuration}>{segment.durationMin} min</Text>
        )}
        {segment.ministry && (
          <Text style={styles.segmentMinistry}>{segment.ministry.name}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  segmentNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  segmentNumberText: {
    color: '#fff',
    fontWeight: '600',
  },
  segmentContent: {
    flex: 1,
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  segmentDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  segmentMinistry: {
    fontSize: 12,
    color: PRIMARY,
    marginTop: 2,
  },
});
