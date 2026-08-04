import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

export interface PickedPhoto {
  base64: string;
  mimeType: string;
  /** Local uri for showing a preview before upload. */
  previewUri: string;
}

/**
 * Opens the photo library and returns the chosen image, or null if the
 * person cancelled or denied access.
 */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.7,
    base64: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset?.base64) return null;
  return {
    base64: asset.base64,
    mimeType: asset.mimeType ?? "image/jpeg",
    previewUri: asset.uri,
  };
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

function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
