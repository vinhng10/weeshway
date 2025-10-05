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
