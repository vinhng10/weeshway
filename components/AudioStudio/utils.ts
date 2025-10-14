import { Item } from "./types";

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const mapToIndices = (ids: number[], count: number): number[] => {
  return ids.length === 0
    ? Array.from({ length: count }, (_, i) => i)
    : ids
        .map((id) => (id > 0 ? id - 1 : count + id))
        .filter(
          (idx): idx is number => idx !== null && idx >= 0 && idx < count
        );
};

/**
 * Combines consecutive audio items into continuous items to eliminate
 * glitches during playback transitions.
 *
 * @param items - Array of audio items sorted by startTime
 * @returns Array of merged items where consecutive items are combined
 *
 * @example
 * Input:  [item1(0-10), item2(10-20), item4(40-50), item5(50-60)]
 * Output: [item(0-20), item(40-60)]
 */
export const mergeConsecutiveItems = (
  items: Item[]
): Array<{ startTime: number; endTime: number }> => {
  if (items.length === 0) return [];

  // Sort by start time to ensure correct order
  const sorted = [...items].sort((a, b) => a.startTime - b.startTime);

  const merged: Array<{ startTime: number; endTime: number }> = [];
  let currentItem = {
    startTime: sorted[0].startTime,
    endTime: sorted[0].endTime,
  };

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];

    // Check if this item is consecutive (starts where previous ended)
    // Use a small epsilon for floating point comparison
    const isConsecutive =
      Math.abs(item.startTime - currentItem.endTime) < 0.001;

    if (isConsecutive) {
      // Extend the current item
      currentItem.endTime = item.endTime;
    } else {
      // Save current item and start a new one
      merged.push(currentItem);
      currentItem = {
        startTime: item.startTime,
        endTime: item.endTime,
      };
    }
  }

  // Don't forget the last item
  merged.push(currentItem);

  return merged;
};

/**
 * Extends merged items with padding before the first item and after the last item only
 * to provide smoother transitions and more context.
 *
 * @param mergedItems - Array of merged items from mergeConsecutiveItems
 * @param totalDuration - Total duration of the audio file
 * @param paddingSeconds - Amount of padding to add (default: 2 seconds)
 * @returns Array of extended items with padding only on first and last
 *
 * @example
 * Input:  [item(10-20), item(40-50), item(60-70)], totalDuration: 100, padding: 2
 * Output: [item(8-20), item(40-50), item(60-72)]
 */
export const addPaddingToMergedItems = (
  mergedItems: Array<{ startTime: number; endTime: number }>,
  totalDuration: number,
  paddingSeconds: number = 2
): Array<{ startTime: number; endTime: number }> => {
  if (mergedItems.length === 0) return [];

  return mergedItems.map((item, index) => {
    const isFirst = index === 0;
    const isLast = index === mergedItems.length - 1;

    const paddedStart = isFirst
      ? Math.max(0, item.startTime - paddingSeconds)
      : item.startTime;

    const paddedEnd = isLast
      ? Math.min(totalDuration, item.endTime + paddingSeconds)
      : item.endTime;

    return {
      startTime: paddedStart,
      endTime: paddedEnd,
    };
  });
};
