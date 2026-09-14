import { useEffect, useMemo, useState } from "react";
import { AdminDumbbellIcon, AdminWarningIcon } from "./AdminIcons";
import {
  inferExerciseMediaKind,
  matchExerciseMediaFiles,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
} from "../lib/exerciseMedia";
import "./exercise-media.css";

type Props = {
  name: string;
  slug?: string;
  mediaUrl?: string;
  manifestFiles?: string[];
  className?: string;
  compact?: boolean;
};

function unique(values: string[]) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function compactImageCandidate(value: string) {
  const source = String(value ?? "").trim();
  if (!source || !/\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(source)) return "";
  const marker = "/storage/v1/object/public/";
  if (!source.includes(marker)) return "";
  const rendered = source.replace(marker, "/storage/v1/render/image/public/");
  const separator = rendered.includes("?") ? "&" : "?";
  return rendered + separator + "width=112&height=112&resize=cover&quality=55";
}

export default function ExerciseMedia({
  name,
  slug = "",
  mediaUrl = "",
  manifestFiles = [],
  className = "",
  compact = false,
}: Props) {
  const candidates = useMemo(() => {
    const exactManifestMatches = matchExerciseMediaFiles(manifestFiles, {
      mediaUrl,
      slug,
      name,
    });
    // Build 1.4.2: sem adivinhação de .gif/.GIF. Usamos a URL canônica do
    // banco e, como ponte para o legado, somente nomes reais do manifest.
    const originals = unique([mediaUrl, ...exactManifestMatches]);
    if (!compact) return originals;
    return unique(originals.flatMap((candidate) => [compactImageCandidate(candidate), candidate]));
  }, [compact, manifestFiles, mediaUrl, name, slug]);

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
    setLoaded(false);
  }, [candidates.join("|")]);

  const source = candidates[index] ?? "";
  const kind = inferExerciseMediaKind(source);
  const tryNext = () => {
    const next = index + 1;
    if (next < candidates.length) {
      setLoaded(false);
      setIndex(next);
      return;
    }
    setLoaded(false);
    setFailed(true);
  };

  if (!source || failed) {
    return (
      <span className={`exercise-media-fallback ${compact ? "is-compact" : ""} ${className}`} role="img" aria-label={`GIF indisponível para ${name}`}>
        <AdminDumbbellIcon size={compact ? 18 : 24} />
        {!compact ? <small>GIF indisponível</small> : null}
      </span>
    );
  }

  if (kind === "video") {
    return <video className={`exercise-media-asset ${loaded ? "is-loaded" : "is-loading"} ${className}`} src={source} muted autoPlay loop playsInline preload="metadata" onLoadedData={() => setLoaded(true)} onError={tryNext} aria-label={`Demonstração de ${name}`} />;
  }

  if (kind === "youtube" || kind === "vimeo") {
    const embed = kind === "youtube" ? youtubeEmbedUrl(source) : vimeoEmbedUrl(source);
    if (!embed) {
      return (
        <span className={`exercise-media-fallback ${compact ? "is-compact" : ""} ${className}`} role="img" aria-label={`Mídia indisponível para ${name}`}>
          <AdminWarningIcon size={compact ? 18 : 24} />
          {!compact ? <small>Mídia indisponível</small> : null}
        </span>
      );
    }
    return <iframe className={`exercise-media-asset ${className}`} src={embed} title={`Demonstração de ${name}`} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" />;
  }

  if (kind === "link" || kind === "object") {
    return (
      <a className={`exercise-media-link ${className}`} href={source} target="_blank" rel="noreferrer" aria-label={`Abrir mídia de ${name}`}>
        <AdminDumbbellIcon size={compact ? 18 : 22} />
        {!compact ? <small>Abrir mídia</small> : null}
      </a>
    );
  }

  return <img className={`exercise-media-asset ${loaded ? "is-loaded" : "is-loading"} ${className}`} src={source} alt={`Demonstração de ${name}`} loading="lazy" decoding="async" draggable={false} onLoad={() => setLoaded(true)} onError={tryNext} />;
}
