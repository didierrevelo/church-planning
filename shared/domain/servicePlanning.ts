/**
 * Service Planning & Cumulative Segment Timing Engine.
 *
 * Implements sequential scheduling calculations for church services and liturgies,
 * projecting exact start/end timestamps for each service block, tracking total duration,
 * and identifying active segments in real-time.
 */

/**
 * Input representation of a service segment.
 */
export interface ServiceSegmentInput {
  id: string;
  order: number;
  title: string;
  durationMin?: number | null;
  notes?: string | null;
  ministryId?: string | null;
  responsibleId?: string | null;
}

/**
 * Calculated segment containing projected time boundaries.
 */
export interface CalculatedSegment extends ServiceSegmentInput {
  durationMin: number;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  startMinutesFromMidnight: number;
  endMinutesFromMidnight: number;
}

/**
 * Options for determining the currently active segment during a live service.
 */
export interface ActiveSegmentOptions {
  serviceDate: string; // "YYYY-MM-DD"
  serviceTime: string; // "HH:MM"
  segments: ServiceSegmentInput[];
  currentDate?: Date;
}

/**
 * Result representing live service progress.
 */
export interface ActiveSegmentResult {
  activeSegmentId: string | null;
  activeSegment: CalculatedSegment | null;
  isFinished: boolean;
  isUpcoming: boolean;
  minutesElapsed: number;
  totalDurationMinutes: number;
}

/**
 * Parses an "HH:MM" time string into total minutes from midnight.
 *
 * @param timeStr Time formatted as "HH:MM" (e.g. "10:00", "09:30")
 * @returns Minutes from midnight (e.g. 600)
 */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Formats total minutes from midnight into an "HH:MM" 24-hour string.
 *
 * @param totalMinutes Minutes from midnight
 * @returns 2-digit hour and minute string (e.g. "10:05")
 */
function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Calculates sequential start and end times for all segments in a service.
 *
 * @param serviceStartTime Service start time as "HH:MM" (e.g. "10:00")
 * @param segments List of service segments to schedule
 * @returns Array of calculated segments with start and end times
 */
export function calculateSegmentTimes(
  serviceStartTime: string,
  segments: ServiceSegmentInput[]
): CalculatedSegment[] {
  if (!segments || segments.length === 0) {
    return [];
  }

  // Ensure deterministic chronological ordering
  const sorted = [...segments].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  let currentMinutes = parseTimeToMinutes(serviceStartTime || '10:00');
  const result: CalculatedSegment[] = [];

  for (const seg of sorted) {
    const duration = (seg.durationMin && seg.durationMin > 0) ? seg.durationMin : 5;
    const startMinutes = currentMinutes;
    const endMinutes = currentMinutes + duration;

    result.push({
      ...seg,
      durationMin: duration,
      startTime: formatMinutesToTime(startMinutes),
      endTime: formatMinutesToTime(endMinutes),
      startMinutesFromMidnight: startMinutes,
      endMinutesFromMidnight: endMinutes,
    });

    currentMinutes = endMinutes;
  }

  return result;
}

/**
 * Computes the total cumulative duration of a service in minutes and as a formatted string.
 *
 * @param segments List of service segments
 * @returns Total minutes and formatted duration string (e.g. "1h 25m" or "45m")
 */
export function calculateTotalServiceDuration(
  segments: ServiceSegmentInput[]
): { totalMinutes: number; formatted: string } {
  if (!segments || segments.length === 0) {
    return { totalMinutes: 0, formatted: '0m' };
  }

  const totalMinutes = segments.reduce((sum, seg) => {
    const dur = (seg.durationMin && seg.durationMin > 0) ? seg.durationMin : 5;
    return sum + dur;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    formatted = `${minutes}m`;
  }

  return { totalMinutes, formatted };
}

/**
 * Determines which segment is currently active in real-time.
 *
 * @param options Context containing service date, start time, segments, and current time
 * @returns Information about the active segment and overall status
 */
export function getCurrentActiveSegment(
  options: ActiveSegmentOptions
): ActiveSegmentResult {
  const { serviceTime, segments, currentDate = new Date() } = options;
  const calculated = calculateSegmentTimes(serviceTime, segments);
  const { totalMinutes } = calculateTotalServiceDuration(segments);

  const startMinutes = parseTimeToMinutes(serviceTime);
  const currentMinutes = currentDate.getUTCHours() * 60 + currentDate.getUTCMinutes();
  const minutesElapsed = currentMinutes - startMinutes;

  if (minutesElapsed < 0) {
    return {
      activeSegmentId: null,
      activeSegment: null,
      isFinished: false,
      isUpcoming: true,
      minutesElapsed: 0,
      totalDurationMinutes: totalMinutes,
    };
  }

  const active = calculated.find(
    (seg) => currentMinutes >= seg.startMinutesFromMidnight && currentMinutes < seg.endMinutesFromMidnight
  );

  const isFinished = minutesElapsed >= totalMinutes;

  return {
    activeSegmentId: active ? active.id : null,
    activeSegment: active || null,
    isFinished,
    isUpcoming: false,
    minutesElapsed,
    totalDurationMinutes: totalMinutes,
  };
}
