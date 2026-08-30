import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "./supabase";
import { withRetry } from "./retry";

export interface PickedPhoto {
  base64: string;
  mimeType: string;
  /** Local uri for showing a preview before upload. */
  previewUri: string;
}

/**
 * The model downsamples anything larger than this before reading it, so
 * sending more than this is upload time and battery spent for nothing. A
 * full-resolution iPhone photo is roughly ten times this size once base64
 * encoded, which is a long wait on the weak connection a kitchen table
 * usually has.
 */
const MAX_EDGE = 1568;

/**
 * Downscale to something worth sending, and produce the base64 from the
 * result rather than the original, so a 12-megapixel photo never has to sit
 * in memory as a string.
 */
async function prepare(
  asset: ImagePicker.ImagePickerAsset,
): Promise<PickedPhoto | null> {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const actions: ImageManipulator.Action[] = [];

  if (Math.max(width, height) > MAX_EDGE) {
    actions.push(
      width >= height ? { resize: { width: MAX_EDGE } } : { resize: { height: MAX_EDGE } },
    );
  }

  const out = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!out.base64) return null;
  return { base64: out.base64, mimeType: "image/jpeg", previewUri: out.uri };
}

/**
 * Opens the photo library and returns the chosen image, or null if the
 * person cancelled or denied access.
 */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  // No allowsEditing: iOS crops to a square, which cuts the ends off a
  // landscape wall calendar. We want the whole page.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;
  return prepare(asset);
}

/**
 * Opens the camera to photograph a paper document, or null if cancelled/denied.
 */
export async function takePhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  // Full quality out of the camera, then downscaled by prepare(). Cropping is
  // deliberately off so a whole page fits in the frame.
  const result = await ImagePicker.launchCameraAsync({ quality: 1 });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;
  return prepare(asset);
}

/**
 * Uploads a picked photo to the vault-photos bucket (under the uploader's
 * own folder, which is what the storage policies require) and returns the
 * storage path to save on the vault item. The bucket is private, so the path
 * is resolved to a short-lived signed URL at display time (see VaultPhoto).
 */
export async function uploadVaultPhoto(
  uploaderId: string,
  photo: PickedPhoto,
): Promise<string> {
  const bytes = base64ToBytes(photo.base64);
  const ext =
    photo.mimeType === "image/png"
      ? "png"
      : photo.mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${uploaderId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("vault-photos")
    .upload(path, bytes.buffer as ArrayBuffer, { contentType: photo.mimeType });
  if (error) throw error;

  return path;
}

/**
 * Uploads a scanned document image to the private vault-photos bucket, under
 * the owner's `scans/` folder, and returns the storage path to save on the
 * scan row. Resolved to a signed URL at display time.
 */
export async function uploadScanImage(
  userId: string,
  photo: PickedPhoto,
): Promise<string> {
  const bytes = base64ToBytes(photo.base64);
  const ext =
    photo.mimeType === "image/png"
      ? "png"
      : photo.mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${userId}/scans/${Date.now()}.${ext}`;

  // The photo is the one thing worth retrying for: losing it means retaking it.
  await withRetry(async () => {
    const { error } = await supabase.storage
      .from("vault-photos")
      .upload(path, bytes.buffer as ArrayBuffer, { contentType: photo.mimeType });
    if (error) throw error;
  });

  return path;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
