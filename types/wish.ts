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
  classes?: ClassType[];
};

export type ClassType = {
  id: number;
  instructor: {
    name: string;
    imageUrl: string;
  };
  genre?: string;
  songTitle: string;
  artist: string;
  style: string;
  level: string;
  studio: string;
  date: string;
  time: string;
  price: number;
  spotsLeft: number;
  backgroundImage: string;
  description?: string;
};
