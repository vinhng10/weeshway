import { DAY, MONTH, WEBSITE_URL } from "@/constants";
import { useAlert } from "@/hooks";
import { ProjectEnrichedType } from "@/types";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import Share from "react-native-share";

export const getArtworkUrl = (url?: string, size: number = 200): string => {
  if (!url || !url.includes("mzstatic.com")) return url ?? "";
  return url.replace(/\d+x\d+/, `${size}x${size}`);
};

export const formatDate = (date?: Date, compact: boolean = false): string => {
  if (!date) return "";
  const dayOfWeek = Object.values(DAY)[date.getDay()];
  const month = Object.values(MONTH)[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return compact
    ? `${month.slice(0, 3)} ${day}`
    : `${dayOfWeek.slice(0, 3)}, ${month.slice(0, 3)} ${day}, ${year}`;
};

export const formatTime = (date?: Date): string => {
  if (!date) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hoursStr}:${minutesStr}`;
};

export async function share(data: ProjectEnrichedType): Promise<void> {
  const url = `${WEBSITE_URL}/classes/${data.id}`;
  const title = data.song?.name ?? "this";
  const message = `Check out "${title}" class on WeeshWay!\n${url}`;
  const artworkUrl =
    data.artworkUrl || getArtworkUrl(data.song?.artworkUrl, 1080);
  Clipboard.setStringAsync(url);

  let file: File | undefined;
  try {
    if (artworkUrl) {
      const dest = new File(Paths.cache, `share-artwork-${Date.now()}.jpg`);
      file = await File.downloadFileAsync(artworkUrl, dest);
      await Share.open({ title, message, url: file.uri, type: "image/jpeg" });
    } else {
      await Share.open({ title, message, url });
    }
  } catch {
  } finally {
    if (file?.exists) await file.delete();
  }
}

export async function pickImage(): Promise<string | undefined> {
  const { status } = await requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    useAlert
      .getState()
      .showAlert("Photo Access Denied", "You can change this in Settings.");
    return;
  }

  const result = await launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
}
