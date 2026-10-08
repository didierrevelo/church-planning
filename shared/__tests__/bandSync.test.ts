import {
  createBandSession,
  createSyncMessage,
  reduceBandSession,
  serializeSyncPacket,
  parseSyncPacket,
  type BandMember,
  type BandSessionState,
  type BandSyncMessage,
} from '../domain/bandSync';

describe('BandSync Protocol (Local LAN Live Session / TDD)', () => {
  const mockHost: BandMember = {
    id: 'user-director-1',
    name: 'Worship Director',
    role: 'director',
    isHost: true,
    joinedAt: '2026-10-18T09:00:00.000Z',
  };

  const mockMusician: BandMember = {
    id: 'user-guitar-2',
    name: 'Guitarist',
    role: 'musician',
    isHost: false,
    joinedAt: '2026-10-18T09:05:00.000Z',
  };

  describe('createBandSession', () => {
    it('initializes a fresh band session with host and default state', () => {
      const session = createBandSession('service-100', mockHost);

      expect(session.serviceId).toBe('service-100');
      expect(session.hostId).toBe(mockHost.id);
      expect(session.members.length).toBe(1);
      expect(session.members[0].id).toBe(mockHost.id);
      expect(session.activeSongId).toBeNull();
      expect(session.activeSongIndex).toBe(0);
      expect(session.currentKey).toBeNull();
      expect(session.isAutoScrolling).toBe(false);
      expect(session.scrollSpeed).toBe(2);
      expect(session.version).toBe(1);
    });
  });

  describe('createSyncMessage & serialization', () => {
    it('creates a formatted message packet and serializes to JSON', () => {
      const msg = createSyncMessage('CHANGE_SONG', mockHost.id, 1, {
        songId: 'song-55',
        songIndex: 2,
        key: 'G',
        bpm: 120,
      });

      expect(msg.type).toBe('CHANGE_SONG');
      expect(msg.senderId).toBe(mockHost.id);
      expect(msg.version).toBe(1);
      expect(msg.payload.songId).toBe('song-55');

      const raw = serializeSyncPacket(msg);
      expect(typeof raw).toBe('string');

      const parsed = parseSyncPacket(raw);
      expect(parsed).toEqual(msg);
    });

    it('returns null when parsing invalid JSON packet', () => {
      expect(parseSyncPacket('invalid json')).toBeNull();
      expect(parseSyncPacket('{"type":"UNKNOWN"}')).toBeNull();
    });
  });

  describe('reduceBandSession', () => {
    let session: BandSessionState;

    beforeEach(() => {
      session = createBandSession('service-100', mockHost);
    });

    it('allows a new member to JOIN the session', () => {
      const joinMsg = createSyncMessage('JOIN', mockMusician.id, session.version, {
        member: mockMusician,
      });

      const nextState = reduceBandSession(session, joinMsg);

      expect(nextState.members.length).toBe(2);
      expect(nextState.members.some((m: BandMember) => m.id === mockMusician.id)).toBe(true);
      expect(nextState.version).toBe(session.version + 1);
    });

    it('does not duplicate members on repeated JOIN', () => {
      const joinMsg = createSyncMessage('JOIN', mockMusician.id, session.version, {
        member: mockMusician,
      });

      let state = reduceBandSession(session, joinMsg);
      state = reduceBandSession(state, joinMsg);

      expect(state.members.filter((m: BandMember) => m.id === mockMusician.id).length).toBe(1);
    });

    it('allows a member to LEAVE the session', () => {
      const joinMsg = createSyncMessage('JOIN', mockMusician.id, session.version, {
        member: mockMusician,
      });
      const withMember = reduceBandSession(session, joinMsg);

      const leaveMsg = createSyncMessage('LEAVE', mockMusician.id, withMember.version, {});
      const afterLeave = reduceBandSession(withMember, leaveMsg);

      expect(afterLeave.members.some((m: BandMember) => m.id === mockMusician.id)).toBe(false);
      expect(afterLeave.members.length).toBe(1);
    });

    it('allows the host to CHANGE_SONG and updates active song and key', () => {
      const changeSongMsg = createSyncMessage('CHANGE_SONG', mockHost.id, session.version, {
        songId: 'song-42',
        songIndex: 1,
        key: 'D',
        bpm: 72,
      });

      const nextState = reduceBandSession(session, changeSongMsg);

      expect(nextState.activeSongId).toBe('song-42');
      expect(nextState.activeSongIndex).toBe(1);
      expect(nextState.currentKey).toBe('D');
      expect(nextState.bpm).toBe(72);
      expect(nextState.version).toBe(session.version + 1);
    });

    it('rejects CHANGE_SONG from non-host members (permission check)', () => {
      const changeSongMsg = createSyncMessage('CHANGE_SONG', mockMusician.id, session.version, {
        songId: 'song-hacked',
        songIndex: 3,
        key: 'E',
      });

      const nextState = reduceBandSession(session, changeSongMsg);

      // State remains unchanged
      expect(nextState.activeSongId).toBeNull();
      expect(nextState.version).toBe(session.version);
    });

    it('allows the host to TRANSPOSE key globally', () => {
      const transposeMsg = createSyncMessage('TRANSPOSE', mockHost.id, session.version, {
        key: 'Bb',
      });

      const nextState = reduceBandSession(session, transposeMsg);

      expect(nextState.currentKey).toBe('Bb');
      expect(nextState.version).toBe(session.version + 1);
    });

    it('allows the host to TOGGLE_SCROLL and SET_SPEED with clamping', () => {
      const toggleMsg = createSyncMessage('TOGGLE_SCROLL', mockHost.id, session.version, {
        isAutoScrolling: true,
      });
      let nextState = reduceBandSession(session, toggleMsg);
      expect(nextState.isAutoScrolling).toBe(true);

      const speedMsg = createSyncMessage('SET_SPEED', mockHost.id, nextState.version, {
        speed: 15, // Should clamp to max 5
      });
      nextState = reduceBandSession(nextState, speedMsg);
      expect(nextState.scrollSpeed).toBe(5);

      const speedLowMsg = createSyncMessage('SET_SPEED', mockHost.id, nextState.version, {
        speed: -2, // Should clamp to min 1
      });
      nextState = reduceBandSession(nextState, speedLowMsg);
      expect(nextState.scrollSpeed).toBe(1);
    });

    it('ignores stale messages with older versions than current state', () => {
      const changeSongMsg = createSyncMessage('CHANGE_SONG', mockHost.id, session.version, {
        songId: 'song-1',
        songIndex: 0,
        key: 'C',
      });
      const updated = reduceBandSession(session, changeSongMsg);

      // Send a stale message with version 0
      const staleMsg = createSyncMessage('TRANSPOSE', mockHost.id, 0, {
        key: 'F#',
      });
      const afterStale = reduceBandSession(updated, staleMsg);

      expect(afterStale.currentKey).toBe('C');
      expect(afterStale.version).toBe(updated.version);
    });
  });
});
