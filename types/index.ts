import { ImageSourcePropType } from "react-native";

export type WishType = {
  id: number;
  title: string;
  artist: string;
  imageUrl: string;
  style: string;
  level: string;
  description: string;
  status: "available" | "granted" | undefined;
  avatars?: ImageSourcePropType[];
  classes?: ProjectType[];
};

export type WishType = {
  id: number;
  style: string;
  level: string;
  description: string;
  songId: string;
};

export type ProfileType = {
  id: number;
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
  status: "private" | "public" | "released" | "cancelled" | undefined;
  teacher: ProfileType;
  genre?: string;
  songTitle: string;
  artist: string;
  style: string;
  level: string;
  studio: string;
  date: string;
  time: string;
  price: number;
  spots: number;
  books: number;
  backgroundImage: string;
  description?: string;
  likes: number;
  music: ItemType[];
  count: ItemType[];
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

// Utility type: WishType with song_id replaced by joined songs relation
export type WishWithSongType = Omit<WishType, "songId"> & {
  songs: SongType;
};
