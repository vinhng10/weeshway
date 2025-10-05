import { AudioPart } from "./types";

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
 * Combines consecutive audio parts into continuous parts to eliminate
 * glitches during playback transitions.
 *
 * @param parts - Array of audio parts sorted by startTime
 * @returns Array of merged parts where consecutive parts are combined
 *
 * @example
 * Input:  [part1(0-10), part2(10-20), part4(40-50), part5(50-60)]
 * Output: [part(0-20), part(40-60)]
 */
export const mergeConsecutiveParts = (
  parts: AudioPart[]
): Array<{ startTime: number; endTime: number }> => {
  if (parts.length === 0) return [];

  // Sort by start time to ensure correct order
  const sorted = [...parts].sort((a, b) => a.startTime - b.startTime);

  const merged: Array<{ startTime: number; endTime: number }> = [];
  let currentPart = {
    startTime: sorted[0].startTime,
    endTime: sorted[0].endTime,
  };

  for (let i = 1; i < sorted.length; i++) {
    const part = sorted[i];

    // Check if this part is consecutive (starts where previous ended)
    // Use a small epsilon for floating point comparison
    const isConsecutive =
      Math.abs(part.startTime - currentPart.endTime) < 0.001;

    if (isConsecutive) {
      // Extend the current part
      currentPart.endTime = part.endTime;
    } else {
      // Save current part and start a new one
      merged.push(currentPart);
      currentPart = {
        startTime: part.startTime,
        endTime: part.endTime,
      };
    }
  }

  // Don't forget the last part
  merged.push(currentPart);

  return merged;
};

/**
 * Extends merged parts with padding before the first part and after the last part only
 * to provide smoother transitions and more context.
 *
 * @param mergedParts - Array of merged parts from mergeConsecutiveParts
 * @param totalDuration - Total duration of the audio file
 * @param paddingSeconds - Amount of padding to add (default: 2 seconds)
 * @returns Array of extended parts with padding only on first and last
 *
 * @example
 * Input:  [part(10-20), part(40-50), part(60-70)], totalDuration: 100, padding: 2
 * Output: [part(8-20), part(40-50), part(60-72)]
 */
export const addPaddingToMergedParts = (
  mergedParts: Array<{ startTime: number; endTime: number }>,
  totalDuration: number,
  paddingSeconds: number = 2
): Array<{ startTime: number; endTime: number }> => {
  if (mergedParts.length === 0) return [];

  return mergedParts.map((part, index) => {
    const isFirst = index === 0;
    const isLast = index === mergedParts.length - 1;

    const paddedStart = isFirst
      ? Math.max(0, part.startTime - paddingSeconds)
      : part.startTime;

    const paddedEnd = isLast
      ? Math.min(totalDuration, part.endTime + paddingSeconds)
      : part.endTime;

    return {
      startTime: paddedStart,
      endTime: paddedEnd,
    };
  });
};
