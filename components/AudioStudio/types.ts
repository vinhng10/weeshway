export interface AudioRoutine {
  id: number;
  startTime: number;
  endTime: number;
  selected: boolean;
}

export interface AudioPlayerAction {
  action: "play" | "stop";
  routines: number[];
}

export const DUCKING_VOLUME = 0.1;
export const PIXELS_PER_SECOND = 30;
