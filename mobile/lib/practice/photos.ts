/**
 * Face photos.
 *
 * A photo is downscaled, encoded once, and kept under its own storage key so
 * the practice document stays small and a photo can be read only when it is
 * about to be shown. At this size a face is a few tens of kilobytes, which is
 * nothing next to how much the picture matters: recognising a grandchild is
 * most of what this app is for.
 *
 * Storing the bytes with the rest of the app data, rather than as a file, is
 * what lets the whole thing be backed up by copying one document. When sync
 * arrives these keys become Storage paths and only this file changes.
 */
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { makeId } from "./store";

const PREFIX = "rekalla.photo.";

/** Large enough to fill the photo card on the biggest phone, and no larger. */
const MAX_EDGE = 900;

export type PhotoSource = "camera" | "library";

/**
 * The outcome of asking for a photo. `blocked` means the permission was not
 * granted, which the screen explains rather than treating as an error.
 */
export type PickOutcome =
  | { status: "picked"; base64: string }
  | { status: "cancelled" }
  | { status: "blocked" };

export async function pickFacePhoto(source: PhotoSource): Promise<PickOutcome> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) return { status: "blocked" };

  // Square cropping is on here, unlike the old document scanner: a face
  // photo is shown in a square card, and letting someone frame it themselves
  // beats cropping the top of a head off later.
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 1,
          allowsEditing: true,
          aspect: [1, 1],
        });

  if (result.canceled) return { status: "cancelled" };

  const asset = result.assets[0];
  if (!asset) return { status: "cancelled" };

  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const actions: ImageManipulator.Action[] = [];
  if (Math.max(width, height) > MAX_EDGE) {
    actions.push(
      width >= height ? { resize: { width: MAX_EDGE } } : { resize: { height: MAX_EDGE } },
    );
  }

  const out = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!out.base64) return { status: "cancelled" };
  return { status: "picked", base64: out.base64 };
}

export async function savePhoto(base64: string): Promise<string> {
  const key = makeId("photo");
  await AsyncStorage.setItem(`${PREFIX}${key}`, base64);
  return key;
}

/**
 * Writes a photo under a key that already exists, which is what restoring a
 * backup onto a new phone needs: the items coming down name their photos,
 * so the bytes have to land under those names and not under fresh ones.
 */
export async function savePhotoWithKey(key: string, base64: string): Promise<void> {
  await AsyncStorage.setItem(`${PREFIX}${key}`, base64);
}

export async function loadPhoto(key: string): Promise<string | null> {
  return AsyncStorage.getItem(`${PREFIX}${key}`);
}

export async function deletePhoto(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${PREFIX}${key}`);
}

export function toDataUri(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

/** Reads a stored photo when it is about to be shown. */
export function usePhotoUri(key: string | null): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!key) {
      setUri(null);
      return;
    }
    loadPhoto(key).then((base64) => {
      if (!cancelled) setUri(base64 ? toDataUri(base64) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return uri;
}
