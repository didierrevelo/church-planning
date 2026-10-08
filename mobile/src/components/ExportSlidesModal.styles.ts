import { StyleSheet } from 'react-native';

/**
 * Styles for the ExportSlidesModal component.
 * Fully isolated to enforce the external stylesheet architecture pattern.
 */
export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#6200EE',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  metricCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#BB86FC',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  previewContainer: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: 180,
    marginVertical: 8,
  },
  previewScroll: {
    maxHeight: 156,
  },
  previewText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#E0E0E0',
    lineHeight: 16,
  },
  filenameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  filenameText: {
    fontSize: 12,
    color: '#03DAC6',
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6200EE',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3700B3',
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
