export interface Routine {
  id: number;
  musicStartTime: number;
  musicEndTime: number;
  countStartTime?: number;
  countEndTime?: number;
  countSource?: string;
  selected: boolean;
}

export interface AudioPlayerAction {
  action: "play" | "stop";
  routines: number[];
}

export const DUCKING_VOLUME = 0.1;
export const PIXELS_PER_SECOND = 30;
