import { LevelEnum, ProjectStatusEnum, StyleEnum } from "@/constants";

export type WishType = {
  id: number;
  userId: string;
  style?: string;
  level?: string;
  description?: string;
  songId: string;
};

export type ProfileType = {
  id: string; // uid type for browser
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  videoUrls?: string[];
};

export type ItemType = {
  startTime: number;
  endTime: number;
  selected: boolean;
};

export type ProjectType = {
  id: number;
  userId: string;
  name?: string;
  status: ProjectStatusEnum;
  style?: StyleEnum;
  level?: LevelEnum;
  price?: number;
  spots?: number;
  startAt?: Date;
  endAt?: Date;
  description?: string;
  locationId?: number;
};

export type SongType = {
  id: string;
  name: string;
  artistName: string;
  artworkUrl: string;
  genreNames: string[];
  previewUrl?: string;
};

export type LocationType = {
  id: number;
  name: string;
  address: string;
  imageUrl: string;
};

export type RecommendationType = {
  id: number;
  wishId: number;
  projectId: number;
  score: number;
  createdAt: Date;
};

// Utility type: WishType with song_id replaced by joined songs relation
export type WishEnrichedType = WishType & {
  song: SongType;
};

export type WishRecommendationEnrichedType = WishType & {
  song: SongType;
  recommendations: RecommendationEnrichedType[];
};

export type ProjectEnrichedType = ProjectType & {
  profile: ProfileType;
  song: SongType;
  location?: LocationType;
};

export type ProfileEnrichedType = ProfileType & {
  projects?: ProjectEnrichedType[];
};

export type RecommendationEnrichedType = RecommendationType & {
  project: ProjectEnrichedType;
};
