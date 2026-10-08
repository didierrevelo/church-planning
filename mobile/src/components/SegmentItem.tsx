import React from 'react';
import { View, Text } from 'react-native';
import { ServiceSegment } from '../types';
import { styles } from './SegmentItem.styles';

interface SegmentItemProps {
  segment: ServiceSegment;
  index: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export default function SegmentItem({ segment, index, startTime, endTime, isActive }: SegmentItemProps) {
  return (
    <View style={[styles.segment, isActive && styles.activeSegment]}>
      <View style={[styles.segmentNumber, isActive && styles.activeNumber]}>
        <Text style={styles.segmentNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.segmentContent}>
        <Text style={[styles.segmentTitle, isActive && styles.activeTitle]}>{segment.title}</Text>
        <View style={styles.metaRow}>
          {startTime && endTime && (
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{startTime} - {endTime}</Text>
            </View>
          )}
          {segment.durationMin ? (
            <Text style={styles.segmentDuration}>{segment.durationMin} min</Text>
          ) : null}
          {segment.ministry && (
            <Text style={styles.segmentMinistry}>{segment.ministry.name}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

