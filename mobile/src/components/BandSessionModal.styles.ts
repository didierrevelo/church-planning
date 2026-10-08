import { StyleSheet } from 'react-native';

/**
 * Stylesheet for the BandSessionModal component.
 * Isolated stylesheet adhering strictly to the external styles architecture.
 */
export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
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
    gap: 10,
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
    marginTop: 14,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  roleChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#383838',
  },
  roleChipActive: {
    backgroundColor: '#00B0FF',
    borderColor: '#00B0FF',
  },
  roleChipText: {
    color: '#B0B0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginTop: 8,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeOnline: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: '#00E676',
  },
  statusDotOffline: {
    backgroundColor: '#FF5252',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextOnline: {
    color: '#00E676',
  },
  statusBadgeTextOffline: {
    color: '#FF5252',
  },
  activeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  activeInfoLabel: {
    fontSize: 12,
    color: '#888888',
  },
  activeInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  membersList: {
    maxHeight: 130,
    marginVertical: 6,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#252525',
    marginBottom: 6,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberRoleTag: {
    fontSize: 11,
    color: '#03DAC6',
  },
  leaderBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leaderBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  hostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00B0FF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  hostBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6200EE',
    paddingVertical: 14,
    borderRadius: 12,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  leaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D32F2F',
    paddingVertical: 14,
    borderRadius: 12,
  },
  leaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
