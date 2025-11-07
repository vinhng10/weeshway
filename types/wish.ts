import { ImageSourcePropType } from "react-native";

export type WishType = {
  id: number;
  title: string;
  artist: string;
  imageUrl: string;
  duration: string;
  style: string;
  level: string;
  description: string;
  status: "available" | "granted" | undefined;
  avatars?: ImageSourcePropType[];
  classes?: ProjectType[];
};

export type UserType = {
  id: number;
  name: string;
  bio: string;
  imageUrl: string;
  videoUrls: string[];
};

export type ProjectType = {
  id: number;
  status: "private" | "public" | "released" | "cancelled" | undefined;
  instructor: UserType;
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
};
