import { DAY, MONTH, WEBSITE_URL } from "@/constants";
import { useAlert } from "@/hooks";
import { ProjectEnrichedType } from "@/types";
import * as Clipboard from "expo-clipboard";
import { FunctionsHttpError } from "@supabase/supabase-js";
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

export const formatExpiry = (date: Date, compact: boolean = false): string => {
  const ms = date.getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (compact) return `${days} days`;
  if (days > 1) return `Expires in ${days} days`;
  if (days === 1) return "Expires tomorrow";
  if (days === 0) return "Expires today";
  if (days === -1) return "Expired yesterday";
  return `Expired ${-days} days ago`;
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

export async function parseFunctionsError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json();
    return body.error ?? "Error occurred. Please try again.";
  }
  return "Error occurred. Please try again.";
}

export function createStripeAppearance(theme: {
  colors: {
    primary: string;
    background: string;
    foreground: string;
    dimmed: string;
    typography: string;
    typographyContrast: string;
    contrast: string;
    danger: string;
  };
  gap: (n: number) => number;
}) {
  return {
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      componentBackground: theme.colors.foreground,
      componentBorder: theme.colors.dimmed,
      componentDivider: theme.colors.dimmed,
      primaryText: theme.colors.typography,
      secondaryText: theme.colors.dimmed,
      componentText: theme.colors.typography,
      placeholderText: theme.colors.dimmed,
      icon: theme.colors.dimmed,
      error: theme.colors.danger,
    },
    shapes: { borderRadius: theme.gap(2) },
    primaryButton: {
      colors: {
        background: theme.colors.contrast,
        text: theme.colors.typographyContrast,
      },
      shapes: { borderRadius: theme.gap(2) },
    },
  };
}

export async function pickImage(): Promise<string | undefined> {
  const { status, canAskAgain } = await requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    if (!canAskAgain) {
      useAlert
        .getState()
        .showAlert("Photo Access Denied", "You can change this in Settings.");
    }
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
