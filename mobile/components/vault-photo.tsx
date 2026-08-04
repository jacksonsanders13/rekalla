import { useEffect, useState } from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";
import { supabase } from "../lib/supabase";

/**
 * Displays a vault photo. The vault-photos bucket is private, so a stored
 * storage path is resolved to a short-lived signed URL before rendering.
 * Handles a few source shapes gracefully:
 *   - a local preview (file:/data:) → shown directly
 *   - a legacy full public URL to the bucket → the path is extracted and signed
 *   - any other http(s) URL → shown directly
 *   - a bare storage path (e.g. "uuid/123.jpg") → signed
 */
export function VaultPhoto({
  source,
  style,
  alt,
}: {
  source: string;
  style?: StyleProp<ImageStyle>;
  alt?: string;
}) {
  const [uri, setUri] = useState<string | null>(() => directUri(source));

  useEffect(() => {
    let cancelled = false;
    const direct = directUri(source);
    if (direct) {
      setUri(direct);
      return;
    }
    const path = storagePath(source);
    setUri(null);
    supabase.storage
      .from("vault-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled) setUri(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (!uri) return null;
  return <Image source={{ uri }} style={style} accessibilityLabel={alt} />;
}

/** Sources we can render without signing. */
function directUri(source: string): string | null {
  if (/^(file:|data:)/.test(source)) return source;
  if (/^https?:/.test(source) && !source.includes("/vault-photos/")) return source;
  return null;
}

/** Turn a bare path or a legacy public bucket URL into a storage object path. */
function storagePath(source: string): string {
  const marker = "/vault-photos/";
  const i = source.indexOf(marker);
  if (i !== -1) return decodeURIComponent(source.slice(i + marker.length).split("?")[0]);
  return source;
}
