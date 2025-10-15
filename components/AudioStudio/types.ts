export interface IItem {
  startTime: number;
  endTime: number;
  selected: boolean;
}

export interface IAudioPlayerAction {
  action: "play" | "stop";
  items: number[];
  type: "music" | "count";
}

export const DUCKING_VOLUME = 0.1;
export const PIXELS_PER_SECOND = 30;
