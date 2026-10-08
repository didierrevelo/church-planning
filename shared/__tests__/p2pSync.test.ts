import {
  createHandshakeRequest,
  validateHandshake,
  mergeEntityDeltas,
  extractDeltaSince,
  type P2PHandshakeRequest,
  type SyncableEntity,
} from '../domain/p2pSync';

describe('P2P Local Offline Sync Protocol (TDD)', () => {
  const localChurchId = 'church-central-1';
  const localDeviceId = 'device-tablet-01';

  describe('createHandshakeRequest & validateHandshake', () => {
    it('creates a formatted handshake packet', () => {
      const handshake = createHandshakeRequest(localChurchId, localDeviceId, '2026-10-18T00:00:00.000Z');

      expect(handshake.protocolVersion).toBe(1);
      expect(handshake.churchId).toBe(localChurchId);
      expect(handshake.deviceId).toBe(localDeviceId);
      expect(handshake.lastSyncTimestamp).toBe('2026-10-18T00:00:00.000Z');
    });

    it('validates matching church successfully', () => {
      const handshake: P2PHandshakeRequest = {
        protocolVersion: 1,
        churchId: localChurchId,
        deviceId: 'device-phone-02',
        lastSyncTimestamp: '2026-10-17T00:00:00.000Z',
      };

      const result = validateHandshake(handshake, localChurchId);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects handshake if churchId does not match (tenant boundary security)', () => {
      const handshake: P2PHandshakeRequest = {
        protocolVersion: 1,
        churchId: 'other-church-99',
        deviceId: 'device-phone-02',
        lastSyncTimestamp: '2026-10-17T00:00:00.000Z',
      };

      const result = validateHandshake(handshake, localChurchId);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Church mismatch');
    });

    it('rejects handshake if protocol version is unsupported', () => {
      const handshake: P2PHandshakeRequest = {
        protocolVersion: 999, // unsupported future version
        churchId: localChurchId,
        deviceId: 'device-phone-02',
        lastSyncTimestamp: '2026-10-17T00:00:00.000Z',
      };

      const result = validateHandshake(handshake, localChurchId);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported protocol version');
    });
  });

  describe('extractDeltaSince', () => {
    const items: SyncableEntity[] = [
      { id: '1', updatedAt: '2026-10-10T10:00:00.000Z', data: 'old' },
      { id: '2', updatedAt: '2026-10-15T12:00:00.000Z', data: 'medium' },
      { id: '3', updatedAt: '2026-10-18T14:00:00.000Z', data: 'new' },
    ];

    it('filters entities updated after the given timestamp', () => {
      const deltas = extractDeltaSince(items, '2026-10-12T00:00:00.000Z');
      expect(deltas.length).toBe(2);
      expect(deltas.map((d: SyncableEntity) => d.id)).toEqual(['2', '3']);
    });

    it('returns all entities if lastSyncTimestamp is null or empty', () => {
      const deltas = extractDeltaSince(items, null);
      expect(deltas.length).toBe(3);
    });
  });

  describe('mergeEntityDeltas (Last-Write-Wins Strategy)', () => {
    it('merges incoming deltas into local entities resolving conflicts by updatedAt', () => {
      const localItems: SyncableEntity[] = [
        { id: 'item-1', updatedAt: '2026-10-18T10:00:00.000Z', title: 'Local newer' },
        { id: 'item-2', updatedAt: '2026-10-18T08:00:00.000Z', title: 'Local older' },
      ];

      const incomingDeltas: SyncableEntity[] = [
        { id: 'item-1', updatedAt: '2026-10-18T09:00:00.000Z', title: 'Incoming older' }, // should be ignored
        { id: 'item-2', updatedAt: '2026-10-18T12:00:00.000Z', title: 'Incoming newer' }, // should overwrite
        { id: 'item-3', updatedAt: '2026-10-18T11:00:00.000Z', title: 'Brand new incoming' }, // should be added
      ];

      const merged = mergeEntityDeltas(localItems, incomingDeltas);

      expect(merged.length).toBe(3);

      const item1 = merged.find((i: SyncableEntity) => i.id === 'item-1');
      expect(item1?.title).toBe('Local newer'); // Kept local

      const item2 = merged.find((i: SyncableEntity) => i.id === 'item-2');
      expect(item2?.title).toBe('Incoming newer'); // Overwritten by incoming

      const item3 = merged.find((i: SyncableEntity) => i.id === 'item-3');
      expect(item3?.title).toBe('Brand new incoming'); // Added
    });
  });
});
