import { StyleSheet } from 'react-native';

const PRIMARY = '#5B5EA6';

/**
 * Stylesheet for SongsScreen.
 * Styles song library list cards, key and tempo badges, stage mode trigger header button,
 * and the modal container for song chord viewing.
 */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E4280',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  stageModeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  numberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  number: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  key: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  bpm: {
    fontSize: 12,
    color: '#0288D1',
    fontWeight: '600',
  },
  timeSig: {
    fontSize: 12,
    color: '#666',
  },
  updated: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stageToggleBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
