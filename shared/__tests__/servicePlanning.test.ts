/**
 * Unit tests for Service Timeline and Cumulative Segment Planning.
 * Following Test-Driven Development (TDD).
 */

import {
  calculateSegmentTimes,
  calculateTotalServiceDuration,
  getCurrentActiveSegment,
  type ServiceSegmentInput,
  type CalculatedSegment,
} from '../domain/servicePlanning';

describe('Service Planning & Cumulative Timing Engine', () => {
  const sampleSegments: ServiceSegmentInput[] = [
    { id: 'seg-1', order: 1, title: 'Bienvenida y Oración', durationMin: 5 },
    { id: 'seg-2', order: 2, title: 'Alabanza y Adoración', durationMin: 25 },
    { id: 'seg-3', order: 3, title: 'Diezmos y Ofrendas', durationMin: 10 },
    { id: 'seg-4', order: 4, title: 'Predicación / Mensaje', durationMin: 40 },
    { id: 'seg-5', order: 5, title: 'Despedida y Anuncios', durationMin: 5 },
  ];

  describe('calculateSegmentTimes', () => {
    it('should calculate sequential start and end times for each segment starting at 10:00', () => {
      const calculated: CalculatedSegment[] = calculateSegmentTimes('10:00', sampleSegments);

      expect(calculated).toHaveLength(5);
      expect(calculated[0]).toMatchObject({
        id: 'seg-1',
        startTime: '10:00',
        endTime: '10:05',
        durationMin: 5,
      });
      expect(calculated[1]).toMatchObject({
        id: 'seg-2',
        startTime: '10:05',
        endTime: '10:30',
        durationMin: 25,
      });
      expect(calculated[2]).toMatchObject({
        id: 'seg-3',
        startTime: '10:30',
        endTime: '10:40',
        durationMin: 10,
      });
      expect(calculated[3]).toMatchObject({
        id: 'seg-4',
        startTime: '10:40',
        endTime: '11:20', // crosses hour boundary cleanly
        durationMin: 40,
      });
      expect(calculated[4]).toMatchObject({
        id: 'seg-5',
        startTime: '11:20',
        endTime: '11:25',
        durationMin: 5,
      });
    });

    it('should sort segments by order before calculating timeline', () => {
      const unorderedSegments: ServiceSegmentInput[] = [
        { id: 'seg-2', order: 2, title: 'Alabanza', durationMin: 20 },
        { id: 'seg-1', order: 1, title: 'Intro', durationMin: 10 },
      ];

      const calculated = calculateSegmentTimes('18:30', unorderedSegments);

      expect(calculated[0].id).toBe('seg-1');
      expect(calculated[0].startTime).toBe('18:30');
      expect(calculated[0].endTime).toBe('18:40');

      expect(calculated[1].id).toBe('seg-2');
      expect(calculated[1].startTime).toBe('18:40');
      expect(calculated[1].endTime).toBe('19:00');
    });

    it('should fallback to 5 minutes duration if durationMin is null or undefined', () => {
      const segmentsWithoutDuration: ServiceSegmentInput[] = [
        { id: 'seg-1', order: 1, title: 'Test 1', durationMin: null },
      ];

      const calculated = calculateSegmentTimes('09:00', segmentsWithoutDuration);
      expect(calculated[0].startTime).toBe('09:00');
      expect(calculated[0].endTime).toBe('09:05');
      expect(calculated[0].durationMin).toBe(5);
    });
  });

  describe('calculateTotalServiceDuration', () => {
    it('should compute total minutes and human readable string', () => {
      // 5 + 25 + 10 + 40 + 5 = 85 min = 1h 25m
      const result = calculateTotalServiceDuration(sampleSegments);
      expect(result.totalMinutes).toBe(85);
      expect(result.formatted).toBe('1h 25m');
    });

    it('should format durations under 1 hour appropriately', () => {
      const shortSegments: ServiceSegmentInput[] = [
        { id: 'seg-1', order: 1, title: 'Intro', durationMin: 35 },
      ];
      const result = calculateTotalServiceDuration(shortSegments);
      expect(result.totalMinutes).toBe(35);
      expect(result.formatted).toBe('35m');
    });

    it('should return 0m for empty segments list', () => {
      const result = calculateTotalServiceDuration([]);
      expect(result.totalMinutes).toBe(0);
      expect(result.formatted).toBe('0m');
    });
  });

  describe('getCurrentActiveSegment', () => {
    it('should identify the active segment when time falls within its window', () => {
      // Base date: 2026-10-11 at 10:15 (should be during 'Alabanza y Adoración' 10:05-10:30)
      const baseDate = new Date('2026-10-11T10:15:00.000Z');
      const serviceDate = '2026-10-11';
      const serviceTime = '10:00';

      const status = getCurrentActiveSegment({
        serviceDate,
        serviceTime,
        segments: sampleSegments,
        currentDate: baseDate,
      });

      expect(status.activeSegmentId).toBe('seg-2');
      expect(status.isFinished).toBe(false);
      expect(status.minutesElapsed).toBe(15);
    });

    it('should report finished if current time is after all segments', () => {
      const lateDate = new Date('2026-10-11T12:00:00.000Z');
      const status = getCurrentActiveSegment({
        serviceDate: '2026-10-11',
        serviceTime: '10:00',
        segments: sampleSegments,
        currentDate: lateDate,
      });

      expect(status.activeSegmentId).toBeNull();
      expect(status.isFinished).toBe(true);
    });
  });
});
