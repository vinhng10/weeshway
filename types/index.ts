import {
  LevelEnum,
  ProjectStatusEnum,
  StyleEnum,
  WishStatusEnum,
} from "@/constants";

export type WishType = {
  id: number;
  createdAt: Date;
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
  stripeAccountId?: string;
};

export type ItemType = {
  startTime: number;
  endTime: number;
  selected: boolean;
};

export type ProjectType = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
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
  songId?: string;
  locationId?: number;
  songItems?: ItemType[];
  countItems?: ItemType[];
};

export type SongType = {
  id: string;
  createdAt: Date;
  name: string;
  artistName: string;
  artworkUrl: string;
  genreNames: string[];
  previewUrl?: string;
  embedding?: number[];
};

export type LocationType = {
  id: number;
  name: string;
  address: string;
  imageUrl: string;
};

export type RecommendationType = {
  id: number;
  createdAt: Date;
  userId: string;
  wishId: number;
  projectId: number;
  score: number;
};

// Utility type: WishType with song_id replaced by joined songs relation
export type WishEnrichedType = WishType & {
  song: SongType;
};

export type WishRecommendationEnrichedType = WishEnrichedType & {
  recommendations: RecommendationEnrichedType[];
  status: WishStatusEnum;
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
