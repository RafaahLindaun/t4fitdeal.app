import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type {
  WorkoutExerciseRecord,
  WorkoutMediaType,
} from "../lib/workout";
import {
  accquaOverlayTransition,
  accquaOverlayVariants,
  accquaWindowTransition,
  accquaWindowVariants,
} from "../lib/windowMotion";

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

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
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
      unique(
        exercise.mediaCandidates?.length
          ? exercise.mediaCandidates
          : [exercise.mediaUrl],
      ),
    [exercise.id, exercise.mediaUrl, exercise.mediaCandidates],
  );

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setMediaFailed(false);
    setExpanded(false);
  }, [exercise.id, candidates.join("|")]);

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

  const source = candidates[candidateIndex] ?? "";
  const youtube = useMemo(() => youtubeId(source), [source]);
  const vimeo = useMemo(() => vimeoId(source), [source]);

  const tryNextCandidate = () => {
    const next = candidateIndex + 1;
    if (next < candidates.length) {
      setCandidateIndex(next);
      return;
    }
    setMediaFailed(true);
  };

  const renderFallback = (full: boolean) => (
    <div
      className={`workout-media-name-fallback ${
        full ? "is-full" : ""
      } ${compact ? "is-compact" : ""}`}
      role="img"
      aria-label={`Demonstração indisponível para ${exercise.name}`}
    >
      <span>DEMONSTRAÇÃO INDISPONÍVEL</span>
      <strong>{exercise.name}</strong>
      <small>
        {exercise.muscleGroup || exercise.equipment || "Siga a orientação do professor"}
      </small>
    </div>
  );

  const renderMedia = (full: boolean) => {
    if (mediaFailed || !source) return renderFallback(full);

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
    return <div className="workout-media-compact">{renderMedia(false)}</div>;
  }

  const overlay = typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="workout-media-viewer"
              className="workout-media-viewer"
              role="dialog"
              aria-modal="true"
              aria-label={`Demonstração de ${exercise.name}`}
              variants={accquaOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={accquaOverlayTransition}
              data-accqua-window-overlay
              data-accqua-motion-managed
            >
              <button
                type="button"
                className="workout-media-viewer-backdrop"
                onClick={() => setExpanded(false)}
                aria-label="Fechar demonstração"
              />

              <motion.section
                className="workout-media-viewer-card"
                variants={accquaWindowVariants.viewer}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={accquaWindowTransition}
                data-accqua-window-surface="viewer"
              >
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
                  <span>{mediaFailed ? "SEM MÍDIA" : labelFor(exercise.mediaType)}</span>
                  <p>
                    {mediaFailed
                      ? "O exercício continua disponível normalmente pelo nome e pelas orientações cadastradas."
                      : "Observe a postura e siga as orientações cadastradas pelo professor."}
                  </p>
                </footer>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <>
      <div
        className={`workout-media-panel ${mediaFailed ? "has-media-fallback" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={handleKeyboardOpen}
        aria-label={`Ampliar demonstração de ${exercise.name}`}
      >
        <span className="workout-media-content">{renderMedia(false)}</span>
        <span className="workout-media-kind">
          {mediaFailed ? "EXERCÍCIO" : labelFor(exercise.mediaType)}
        </span>
        <span className="workout-media-expand-hint">Toque para ampliar</span>
      </div>

      {overlay}
    </>
  );
}
