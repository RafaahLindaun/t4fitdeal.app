import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  // GIFs must use their original URL. Supabase's image renderer can turn an
  // animated GIF into a static thumbnail, which made exercise previews look blank/frozen.
  if (!source || !/\.(?:png|jpe?g|webp)(?:\?|$)/i.test(source)) return "";
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
    const originals = unique([mediaUrl, ...exactManifestMatches]);
    if (!compact) return originals;
    return unique(originals.flatMap((candidate) => [compactImageCandidate(candidate), candidate]));
  }, [compact, manifestFiles, mediaUrl, name, slug]);

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
    setLoaded(false);
    setPreviewOpen(false);
  }, [candidates.join("|")]);

  useEffect(() => {
    if (!previewOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [previewOpen]);

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

  const openPreview = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (!compact) return;
    event.preventDefault();
    event.stopPropagation();
    setPreviewOpen(true);
  };

  const preview = previewOpen && typeof document !== "undefined" ? createPortal(
    <div className="exercise-media-preview-backdrop" role="presentation" onClick={() => setPreviewOpen(false)}>
      <section className="exercise-media-preview" role="dialog" aria-modal="true" aria-label={`Prévia de ${name}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="exercise-media-preview-close" aria-label="Fechar prévia" onClick={() => setPreviewOpen(false)}>×</button>
        <strong>{name}</strong>
        {kind === "video" ? (
          <video src={source} muted autoPlay loop playsInline controls />
        ) : kind === "youtube" || kind === "vimeo" ? (
          <iframe src={kind === "youtube" ? youtubeEmbedUrl(source) : vimeoEmbedUrl(source)} title={`Demonstração de ${name}`} allow="autoplay; encrypted-media; picture-in-picture" />
        ) : (
          <img src={source} alt={`Demonstração de ${name}`} draggable={false} />
        )}
      </section>
    </div>,
    document.body,
  ) : null;

  if (kind === "video") {
    return <><span className={compact ? "exercise-media-preview-trigger" : ""} role={compact ? "button" : undefined} tabIndex={compact ? 0 : undefined} onClick={compact ? openPreview : undefined} onKeyDown={compact ? (event) => { if (event.key === "Enter" || event.key === " ") openPreview(event); } : undefined}><video className={`exercise-media-asset ${loaded ? "is-loaded" : "is-loading"} ${className}`} src={source} muted autoPlay loop playsInline preload="metadata" onLoadedData={() => setLoaded(true)} onError={tryNext} aria-label={`Demonstração de ${name}`} /></span>{preview}</>;
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
    if (compact) {
      return <><span className="exercise-media-preview-trigger" role="button" tabIndex={0} onClick={openPreview} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openPreview(event); }}><span className={`exercise-media-fallback is-compact ${className}`}><AdminDumbbellIcon size={18}/></span></span>{preview}</>;
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

  if (compact) {
    return <><span className="exercise-media-preview-trigger" role="button" tabIndex={0} onClick={openPreview} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openPreview(event); }}><img className={`exercise-media-asset ${loaded ? "is-loaded" : "is-loading"} ${className}`} src={source} alt={`Demonstração de ${name}`} loading="lazy" decoding="async" draggable={false} onLoad={() => setLoaded(true)} onError={tryNext} /></span>{preview}</>;
  }

  return <img className={`exercise-media-asset ${loaded ? "is-loaded" : "is-loading"} ${className}`} src={source} alt={`Demonstração de ${name}`} loading="lazy" decoding="async" draggable={false} onLoad={() => setLoaded(true)} onError={tryNext} />;
}
