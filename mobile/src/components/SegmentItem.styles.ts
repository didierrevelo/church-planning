import { StyleSheet } from 'react-native';

const PRIMARY = '#5B5EA6';

/**
 * Stylesheet for SegmentItem component.
 * Displays service agenda rows with cumulative time badges, ministry badges,
 * and live active highlight styling.
 */
export const styles = StyleSheet.create({
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
  activeSegment: {
    borderLeftWidth: 4,
    borderLeftColor: '#00C853',
    backgroundColor: '#F1F8E9',
  },
  activeNumber: {
    backgroundColor: '#00C853',
  },
  activeTitle: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  timeBadge: {
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeBadgeText: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: '700',
  },
  segmentDuration: {
    fontSize: 12,
    color: '#666',
  },
  segmentMinistry: {
    fontSize: 12,
    color: PRIMARY,
  },
});
