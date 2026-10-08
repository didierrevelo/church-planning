import {
  BandSessionController,
} from '../domain/bandSessionController';
import type { BandMember } from '../domain/bandSync';
import type { ExportableSong } from '../domain/setlistExport';

describe('BandSessionController (Live Stage Orchestrator / TDD)', () => {
  const hostMember: BandMember = {
    id: 'user-dir-1',
    name: 'Worship Leader',
    role: 'director',
    isHost: true,
    joinedAt: '2026-10-18T10:00:00.000Z',
  };

  const musicianMember: BandMember = {
    id: 'user-bass-2',
    name: 'Bassist',
    role: 'musician',
    isHost: false,
    joinedAt: '2026-10-18T10:05:00.000Z',
  };

  const sampleSongs: ExportableSong[] = [
    {
      title: 'Sublime Gracia',
      artist: 'John Newton',
      key: 'G',
      bpm: 72,
      chordContent: '{c: Coro}\n[G]Sublime gracia [C]del Señor',
    },
    {
      title: 'Cuan Grande Es El',
      artist: 'Carl Boberg',
      key: 'C',
      bpm: 68,
      chordContent: '{c: Coro}\n[C]Mi corazón entona [F]la canción',
    },
  ];

  it('initializes controller with initial state, songs, and member info', () => {
    const controller = new BandSessionController('srv-100', hostMember, sampleSongs);

    const state = controller.getState();
    expect(state.serviceId).toBe('srv-100');
    expect(state.hostId).toBe(hostMember.id);
    expect(state.activeSongIndex).toBe(0);
    expect(state.activeSongId).toBeNull();
    expect(controller.getSongs().length).toBe(2);
  });

  it('notifies subscribers on state updates', () => {
    const controller = new BandSessionController('srv-100', hostMember, sampleSongs);
    const listener = jest.fn();

    const unsubscribe = controller.subscribe(listener);

    // Host changes song
    const msg = controller.changeSong(1);
    expect(msg).not.toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    const updatedState = controller.getState();
    expect(updatedState.activeSongIndex).toBe(1);
    expect(updatedState.currentKey).toBe('C');
    expect(updatedState.bpm).toBe(68);

    // Unsubscribe and verify no further callbacks
    unsubscribe();
    controller.transposeKey('D');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('rejects action calls from non-host members', () => {
    const controller = new BandSessionController('srv-100', musicianMember, sampleSongs);
    const listener = jest.fn();
    controller.subscribe(listener);

    const msg = controller.changeSong(1);
    expect(msg).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    expect(controller.getState().activeSongIndex).toBe(0);
  });

  it('processes incoming network packets via receiveMessage', () => {
    const hostController = new BandSessionController('srv-100', hostMember, sampleSongs);
    const musicianController = new BandSessionController('srv-100', musicianMember, sampleSongs);

    // Host changes song and generates broadcast packet
    const syncPacket = hostController.changeSong(1);
    expect(syncPacket).not.toBeNull();

    // Musician receives the sync packet
    const applied = musicianController.receiveMessage(syncPacket!);
    expect(applied).toBe(true);

    // Musician controller is now aligned with host state
    expect(musicianController.getState().activeSongIndex).toBe(1);
    expect(musicianController.getState().currentKey).toBe('C');
  });

  it('exports active song slides in FreeShow format', () => {
    const controller = new BandSessionController('srv-100', hostMember, sampleSongs);
    controller.changeSong(0);

    const exportDoc = controller.exportCurrentSongSlides();
    expect(exportDoc).not.toBeNull();
    expect(exportDoc?.metadata.title).toBe('Sublime Gracia');
    expect(exportDoc?.slides.length).toBe(1);
    expect(exportDoc?.slides[0].content).toContain('Sublime gracia del Señor');
  });

  it('exports all setlist songs in FreeShow presentation format', () => {
    const controller = new BandSessionController('srv-100', hostMember, sampleSongs);
    const allExports = controller.exportAllSetlistSlides();

    expect(allExports.length).toBe(2);
    expect(allExports[0].metadata.title).toBe('Sublime Gracia');
    expect(allExports[1].metadata.title).toBe('Cuan Grande Es El');
  });
});
