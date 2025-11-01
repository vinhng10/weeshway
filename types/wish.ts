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
};

export type Wishes = Array<Wish>;
