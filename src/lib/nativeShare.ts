/**
 * Cross-platform share helper.
 *
 * Native iOS/Android (Capacitor): writes the file to the device cache and opens
 *   the system share sheet so users can AirDrop, save to Files, send via
 *   Messages, post to Instagram/TikTok, etc.
 * Web (with Web Share API + files): uses navigator.share with a File.
 * Fallback: triggers a regular browser download.
 */

export interface ShareFileOptions {
  /** Remote URL or blob: URL of the asset to share. */
  url: string;
  /** Suggested filename, e.g. "my-track.mp3" or "S1-A.mp4". */
  filename: string;
  /** MIME type, e.g. "audio/mpeg", "video/mp4". */
  mimeType: string;
  /** Optional title shown in the share sheet. */
  title?: string;
  /** Optional message/dialog text. */
  text?: string;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip "data:<mime>;base64," prefix
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const downloadFallback = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export async function shareFile(opts: ShareFileOptions): Promise<"native" | "web" | "download"> {
  const { url, filename, mimeType, title, text } = opts;

  // 1) Native (Capacitor) — open the iOS/Android share sheet
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      const resp = await fetch(url);
      const blob = await resp.blob();
      const data = await blobToBase64(blob);

      const written = await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: title ?? filename,
        text,
        url: written.uri,
        dialogTitle: title ?? "Share",
      });
      return "native";
    }
  } catch (err) {
    // Capacitor not present or share failed — fall through to web
    console.warn("[shareFile] native share failed, falling back", err);
  }

  // 2) Web Share API with files (modern mobile browsers + Safari)
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const file = new File([blob], filename, { type: mimeType });
      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share: (data: { title?: string; text?: string; files?: File[] }) => Promise<void>;
      };
      if (!nav.canShare || nav.canShare({ files: [file] })) {
        await nav.share({ title, text, files: [file] });
        return "web";
      }
    }
  } catch (err) {
    // User cancelled or browser refused — fall through to download
    if ((err as DOMException)?.name === "AbortError") return "web";
    console.warn("[shareFile] web share failed, falling back to download", err);
  }

  // 3) Plain download
  downloadFallback(url, filename);
  return "download";
}
