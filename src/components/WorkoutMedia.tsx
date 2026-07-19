import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import type {
  WorkoutExerciseRecord,
  WorkoutMediaType,
} from "../lib/workout";

const FINAL_FALLBACK = "/gifs/agachamento-livre.gif";

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").split("/")[0];
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("/")[0];
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoId(url: string) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}

function labelFor(type: WorkoutMediaType) {
  if (type === "video") return "VÍDEO";
  if (type === "image") return "IMAGEM";
  if (type === "link") return "LINK";
  return "GIF";
}

export default function WorkoutMedia({
  exercise,
  compact = false,
}: {
  exercise: WorkoutExerciseRecord;
  compact?: boolean;
}) {
  const candidates = useMemo(
    () =>
      exercise.mediaCandidates?.length
        ? exercise.mediaCandidates
        : [exercise.mediaUrl, FINAL_FALLBACK].filter(Boolean),
    [exercise.id, exercise.mediaUrl, exercise.mediaCandidates],
  );

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setExpanded(false);
  }, [exercise.id]);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [expanded]);

  const source =
    candidates[candidateIndex] ??
    candidates[candidates.length - 1] ??
    FINAL_FALLBACK;

  const youtube = useMemo(() => youtubeId(source), [source]);
  const vimeo = useMemo(() => vimeoId(source), [source]);

  const tryNextCandidate = () => {
    setCandidateIndex((current) =>
      Math.min(current + 1, Math.max(0, candidates.length - 1)),
    );
  };

  const renderMedia = (full: boolean) => {
    if (youtube) {
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtube}?playsinline=1&rel=0`}
          title={exercise.name}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (vimeo) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeo}`}
          title={exercise.name}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (exercise.mediaType === "video") {
      return (
        <video
          src={source}
          controls={full}
          muted={!full}
          autoPlay={!full}
          loop={!full}
          playsInline
          preload={full ? "metadata" : "auto"}
          onError={tryNextCandidate}
        >
          Seu navegador não conseguiu abrir este vídeo.
        </video>
      );
    }

    if (exercise.mediaType === "link" && /^https?:\/\//i.test(source)) {
      return (
        <iframe
          src={source}
          title={exercise.name}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      );
    }

    return (
      <img
        src={source}
        alt={exercise.name}
        draggable={false}
        onError={tryNextCandidate}
      />
    );
  };

  const handleKeyboardOpen = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setExpanded(true);
    }
  };

  if (compact) {
    return (
      <div className="workout-media-compact">
        {renderMedia(false)}
      </div>
    );
  }

  const overlay =
    expanded && typeof document !== "undefined"
      ? createPortal(
          <div
            className="workout-media-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`Demonstração de ${exercise.name}`}
          >
            <button
              type="button"
              className="workout-media-viewer-backdrop"
              onClick={() => setExpanded(false)}
              aria-label="Fechar demonstração"
            />

            <section className="workout-media-viewer-card">
              <header>
                <div>
                  <span>DEMONSTRAÇÃO DO EXERCÍCIO</span>
                  <strong>{exercise.name}</strong>
                  <small>
                    {exercise.equipment ||
                      exercise.muscleGroup ||
                      "Execução guiada"}
                  </small>
                </div>
                <button
                  type="button"
                  className="workout-media-viewer-close"
                  onClick={() => setExpanded(false)}
                  aria-label="Fechar demonstração"
                >
                  <span className="workout-close-icon" aria-hidden="true" />
                </button>
              </header>

              <div className="workout-media-viewer-content">
                {renderMedia(true)}
              </div>

              <footer>
                <span>{labelFor(exercise.mediaType)}</span>
                <p>
                  Observe a postura e siga as orientações cadastradas
                  pelo professor.
                </p>
              </footer>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className="workout-media-panel"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={handleKeyboardOpen}
        aria-label={`Ampliar demonstração de ${exercise.name}`}
      >
        <span className="workout-media-content">
          {renderMedia(false)}
        </span>
        <span className="workout-media-kind">
          {labelFor(exercise.mediaType)}
        </span>
        <span className="workout-media-expand-hint">
          Toque para ampliar
        </span>
      </div>

      {overlay}
    </>
  );
}
