import {
  formatBandRole,
  getBandSessionStatus,
  createLocalBandMember,
} from '../domain/bandSessionModalHelper';
import { createBandSession, type BandMember } from '../domain/bandSync';
import type { ExportableSong } from '../domain/setlistExport';

describe('Band Session Modal Helper (TDD)', () => {
  const leader: BandMember = {
    id: 'user-leader-1',
    name: 'Carlos Líder',
    role: 'director',
    isHost: true,
    joinedAt: '2026-10-08T01:00:00Z',
  };

  const member: BandMember = {
    id: 'user-bassist-2',
    name: 'Andrés Bajo',
    role: 'bass',
    isHost: false,
    joinedAt: '2026-10-08T01:05:00Z',
  };

  const songs: ExportableSong[] = [
    { title: 'Gracia Sublime Es', key: 'G', bpm: 104 },
    { title: 'Cuan Grande Es Dios', key: 'C', bpm: 78 },
  ];

  describe('formatBandRole', () => {
    it('returns human readable localized strings for standard roles', () => {
      expect(formatBandRole('director')).toBe('Director / Líder');
      expect(formatBandRole('guitar')).toBe('Guitarrista');
      expect(formatBandRole('bass')).toBe('Bajista');
      expect(formatBandRole('piano')).toBe('Pianista / Teclados');
      expect(formatBandRole('drums')).toBe('Baterista');
      expect(formatBandRole('vocalist')).toBe('Vocalista / Coros');
      expect(formatBandRole('musician')).toBe('Músico');
    });
  });

  describe('createLocalBandMember', () => {
    it('creates a validated BandMember object with current ISO timestamp', () => {
      const newMember = createLocalBandMember('u-123', 'Mateo', 'guitar', false);
      expect(newMember.id).toBe('u-123');
      expect(newMember.name).toBe('Mateo');
      expect(newMember.role).toBe('guitar');
      expect(newMember.isHost).toBe(false);
      expect(newMember.joinedAt).toBeDefined();
    });
  });

  describe('getBandSessionStatus', () => {
    it('summarizes session state when user is director/host', () => {
      const session = createBandSession('srv-1', leader);
      session.members.push(member);
      session.activeSongIndex = 0;

      const status = getBandSessionStatus(session, leader.id, songs);
      expect(status.isHost).toBe(true);
      expect(status.statusLabel).toBe('Anfitrión / Director');
      expect(status.memberCount).toBe(2);
      expect(status.currentSongTitle).toBe('Gracia Sublime Es');
    });

    it('summarizes session state when user is connected peer', () => {
      const session = createBandSession('srv-1', leader);
      session.members.push(member);
      session.activeSongIndex = 1;

      const status = getBandSessionStatus(session, member.id, songs);
      expect(status.isHost).toBe(false);
      expect(status.statusLabel).toBe('Conectado a Carlos Líder');
      expect(status.memberCount).toBe(2);
      expect(status.currentSongTitle).toBe('Cuan Grande Es Dios');
    });
  });
});
