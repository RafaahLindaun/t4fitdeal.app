export type ExerciseMediaKind = "image" | "video" | "youtube" | "vimeo" | "link" | "object";

type ExerciseMediaManifest = {
  version?: number;
  generatedAt?: string;
  count?: number;
  files?: unknown;
};

let manifestPromise: Promise<string[]> | null = null;

function unique(values: string[]) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export function normalizeExerciseMediaKey(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  const fileName = decoded
    .replace(/[?#].*$/, "")
    .replace(/\\/g, "/")
    .split("/")
    .pop() ?? "";

  return fileName
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferExerciseMediaKind(value: unknown): ExerciseMediaKind {
  const source = String(value ?? "").trim();
  if (/youtu\.be|youtube\.com/i.test(source)) return "youtube";
  if (/vimeo\.com/i.test(source)) return "vimeo";
  if (/\.(mp4|webm|ogg|ogv|mov|m4v|avi|mkv|mpeg|mpg|3gp)(?:[?#].*)?$/i.test(source)) return "video";
  if (/\.(gif|png|jpe?g|webp|avif|svg|bmp|apng|ico|heic|heif)(?:[?#].*)?$/i.test(source)) return "image";
  if (/^https?:\/\//i.test(source)) return "link";
  return source ? "object" : "image";
}

export function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    let id = "";
    if (url.hostname.includes("youtu.be")) {
      id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/shorts/")[1]?.split("/")[0] ?? "";
      } else {
        id = url.searchParams.get("v") ?? "";
      }
    }
    return id ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : "";
  } catch {
    return "";
  }
}

export function vimeoEmbedUrl(value: string) {
  const match = String(value).match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : "";
}

export async function loadExerciseMediaManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch("/exercise-media-manifest.json", { cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) return [];
        const body = (await response.json()) as ExerciseMediaManifest;
        return Array.isArray(body.files)
          ? unique(body.files.map((item) => String(item ?? "")))
          : [];
      })
      .catch(() => []);
  }
  return manifestPromise;
}

export function matchExerciseMediaFiles(
  manifestFiles: string[],
  input: { mediaUrl?: string; slug?: string; name?: string },
) {
  if (!manifestFiles.length) return [];

  const explicitKey = normalizeExerciseMediaKey(input.mediaUrl);
  const slugKey = normalizeExerciseMediaKey(input.slug);
  const nameKey = normalizeExerciseMediaKey(input.name);
  const desired = unique([explicitKey, slugKey, nameKey]);
  if (!desired.length) return [];

  return manifestFiles
    .map((url, index) => {
      const key = normalizeExerciseMediaKey(url);
      let score = 0;
      if (explicitKey && key === explicitKey) score = 100;
      else if (slugKey && key === slugKey) score = 95;
      else if (nameKey && key === nameKey) score = 90;
      else if (desired.some((candidate) => candidate && (key.includes(candidate) || candidate.includes(key)))) score = 55;
      return { url, score, index };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.url);
}
