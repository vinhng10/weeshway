export type Song = {
  id: number;
  title: string;
  genre: string;
  imageUrl: string;
  duration: string;
};

export type Playlist = Array<Song>;
