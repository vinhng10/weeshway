import { ImageSourcePropType } from "react-native";

export type Wish = {
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
  classes?: Class[];
};

export type Class = {
  id: number;
  instructor: {
    name: string;
    imageUrl: string;
  };
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
};

export type Wishes = Array<Wish>;
