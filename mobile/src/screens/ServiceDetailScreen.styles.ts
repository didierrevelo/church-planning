import { StyleSheet } from 'react-native';

const PRIMARY = '#5B5EA6';

/**
 * Stylesheet for ServiceDetailScreen.
 * Covers service banner header, order of service sections, reordering buttons,
 * team groups, setlist, and attachment cards.
 */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
  },
  time: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  segmentMove: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    width: 30,
  },
  segmentOrder: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
    marginVertical: 2,
  },
  segmentContent: {
    flex: 1,
  },
  ministryGroup: {
    marginBottom: 16,
  },
  ministryName: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addBtnText: {
    marginLeft: 8,
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
  },
});
