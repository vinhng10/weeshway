import { DAY, MONTH } from "@/constants";
import { useAlert } from "@/hooks";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";

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

export async function pickImage(): Promise<string | undefined> {
  const { status } = await requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    useAlert
      .getState()
      .showAlert(
        "Permission Needed",
        "Please allow access to your photo library to upload an image.",
      );
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
