import { Routine } from "./types";

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const mapUserIdsToIndices = (
  userIds: number[],
  count: number
): number[] => {
  const indices: number[] = [];
  for (const id of userIds) {
    let idx: number | null = null;
    if (id > 0) idx = id - 1;
    else if (id < 0) idx = count + id;
    if (idx !== null && idx >= 0 && idx < count) {
      indices.push(idx);
    }
  }
  // Deduplicate preserving order
  const unique: number[] = [];
  for (const i of indices) if (!unique.includes(i)) unique.push(i);
  return unique;
};

/**
 * Combines consecutive audio routines into continuous routines to eliminate
 * glitches during playback transitions.
 *
 * @param routines - Array of audio routines sorted by musicStartTime
 * @returns Array of merged routines where consecutive routines are combined
 *
 * @example
 * Input:  [routine1(0-10), routine2(10-20), routine4(40-50), routine5(50-60)]
 * Output: [routine(0-20), routine(40-60)]
 */
export const mergeConsecutiveRoutines = (
  routines: Routine[]
): Array<{ musicStartTime: number; musicEndTime: number }> => {
  if (routines.length === 0) return [];

  // Sort by start time to ensure correct order
  const sorted = [...routines].sort(
    (a, b) => a.musicStartTime - b.musicStartTime
  );

  const merged: Array<{ musicStartTime: number; musicEndTime: number }> = [];
  let currentRoutine = {
    musicStartTime: sorted[0].musicStartTime,
    musicEndTime: sorted[0].musicEndTime,
  };

  for (let i = 1; i < sorted.length; i++) {
    const routine = sorted[i];

    // Check if this routine is consecutive (starts where previous ended)
    // Use a small epsilon for floating point comparison
    const isConsecutive =
      Math.abs(routine.musicStartTime - currentRoutine.musicEndTime) < 0.001;

    if (isConsecutive) {
      // Extend the current routine
      currentRoutine.musicEndTime = routine.musicEndTime;
    } else {
      // Save current routine and start a new one
      merged.push(currentRoutine);
      currentRoutine = {
        musicStartTime: routine.musicStartTime,
        musicEndTime: routine.musicEndTime,
      };
    }
  }

  // Don't forget the last routine
  merged.push(currentRoutine);

  return merged;
};

/**
 * Extends merged routines with padding before the first routine and after the last routine only
 * to provide smoother transitions and more context.
 *
 * @param mergedRoutines - Array of merged routines from mergeConsecutiveRoutines
 * @param totalDuration - Total duration of the audio file
 * @param paddingSeconds - Amount of padding to add (default: 2 seconds)
 * @returns Array of extended routines with padding only on first and last
 *
 * @example
 * Input:  [routine(10-20), routine(40-50), routine(60-70)], totalDuration: 100, padding: 2
 * Output: [routine(8-20), routine(40-50), routine(60-72)]
 */
export const addPaddingToMergedRoutines = (
  mergedRoutines: Array<{ musicStartTime: number; musicEndTime: number }>,
  totalDuration: number,
  paddingSeconds: number = 2
): Array<{ musicStartTime: number; musicEndTime: number }> => {
  if (mergedRoutines.length === 0) return [];

  return mergedRoutines.map((routine, index) => {
    const isFirst = index === 0;
    const isLast = index === mergedRoutines.length - 1;

    const paddedStart = isFirst
      ? Math.max(0, routine.musicStartTime - paddingSeconds)
      : routine.musicStartTime;

    const paddedEnd = isLast
      ? Math.min(totalDuration, routine.musicEndTime + paddingSeconds)
      : routine.musicEndTime;

    return {
      musicStartTime: paddedStart,
      musicEndTime: paddedEnd,
    };
  });
};
