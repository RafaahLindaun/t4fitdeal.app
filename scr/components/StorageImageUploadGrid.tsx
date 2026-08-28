import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "../lib/supabase";
import "./storage-image-upload-grid.css";

export type StorageImageValue = {
  id?: string;
  path: string;
  url: string;
  order: number;
};

type UploadState = {
  key: string;
  previewUrl: string;
  name: string;
  status: "uploading" | "error";
  message?: string;
};

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function normalizeOrder(items: StorageImageValue[]) {
  return items.map((item, index) => ({ ...item, order: index }));
}

export default function StorageImageUploadGrid({
  bucket,
  folder,
  value,
  onChange,
  maxFiles = 8,
  multiple = true,
  label = "Imagens",
}: {
  bucket: string;
  folder: string;
  value: StorageImageValue[];
  onChange: (value: StorageImageValue[]) => void;
  maxFiles?: number;
  multiple?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => () => {
    for (const upload of uploads) if (upload.previewUrl.startsWith("blob:")) URL.revokeObjectURL(upload.previewUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUpload = (key: string, patch: Partial<UploadState>) => {
    setUploads((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const allowedSlots = Math.max(0, maxFiles - value.length - uploads.filter((item) => item.status === "uploading").length);
    const selected = Array.from(files).slice(0, multiple ? allowedSlots : Math.min(1, allowedSlots));
    let workingValue = [...value];

    for (const file of selected) {
      const key = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      if (!ACCEPTED.has(file.type)) {
        setUploads((current) => [...current, { key, previewUrl, name: file.name, status: "error", message: "Use GIF, JPG, PNG ou WebP." }]);
        continue;
      }

      setUploads((current) => [...current, { key, previewUrl, name: file.name, status: "uploading" }]);
      try {
        // GIF animado não pode passar pelo compressor de imagem: isso removeria
        // os frames. JPG/PNG/WebP continuam usando a mesma compressão do app.
        const uploadFile = file.type === "image/gif"
          ? file
          : await imageCompression(file, {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1600,
              initialQuality: 0.8,
              useWebWorker: true,
              fileType: file.type,
            });
        const ext = extFor(uploadFile.type || file.type);
        const storagePath = `${folder.replace(/^\/+|\/+$/g, "")}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(storagePath, uploadFile, {
          cacheControl: "31536000",
          contentType: uploadFile.type || file.type,
          upsert: false,
        });
        if (error) throw error;
        const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
        workingValue = normalizeOrder(multiple ? [...workingValue, { path: storagePath, url: publicUrl, order: workingValue.length }] : [{ path: storagePath, url: publicUrl, order: 0 }]);
        onChange(workingValue);
        setUploads((current) => current.filter((item) => item.key !== key));
        URL.revokeObjectURL(previewUrl);
      } catch (error) {
        updateUpload(key, { status: "error", message: error instanceof Error ? error.message : "Falha no upload." });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(normalizeOrder(next));
  };

  const canAdd = value.length + uploads.filter((item) => item.status === "uploading").length < maxFiles;

  return (
    <section className="storage-image-uploader" aria-label={label}>
      <div className="storage-image-uploader-grid">
        {value.map((image, index) => (
          <article
            key={`${image.path}-${index}`}
            className="storage-image-tile is-ready"
            draggable={value.length > 1}
            onDragStart={() => { dragIndex.current = index; }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (dragIndex.current != null) move(dragIndex.current, index); dragIndex.current = null; }}
          >
            <img src={image.url} alt={`Imagem ${index + 1}`} />
            {index === 0 ? <span className="storage-image-cover">CAPA</span> : null}
            <div className="storage-image-actions">
              <button type="button" aria-label="Mover imagem para a esquerda" disabled={index === 0} onClick={() => move(index, index - 1)}>‹</button>
              <button type="button" aria-label="Remover imagem" onClick={() => onChange(normalizeOrder(value.filter((_, current) => current !== index)))}>×</button>
              <button type="button" aria-label="Mover imagem para a direita" disabled={index === value.length - 1} onClick={() => move(index, index + 1)}>›</button>
            </div>
          </article>
        ))}

        {uploads.map((upload) => (
          <article key={upload.key} className={`storage-image-tile is-${upload.status}`}>
            <img src={upload.previewUrl} alt="Preview da imagem" />
            {upload.status === "uploading" ? <span className="storage-image-spinner" aria-label="Enviando imagem" /> : (
              <div className="storage-image-error"><strong>Falhou</strong><small>{upload.message}</small><button type="button" onClick={() => setUploads((current) => current.filter((item) => item.key !== upload.key))}>Remover</button></div>
            )}
          </article>
        ))}

        {canAdd ? (
          <button type="button" className="storage-image-add" onClick={() => inputRef.current?.click()} aria-label={`Adicionar ${multiple ? "imagens" : "imagem"}`}>
            <span>+</span><small>{multiple ? "Adicionar" : "Escolher foto"}</small>
          </button>
        ) : null}
      </div>
      <input ref={inputRef} className="storage-image-input" type="file" accept="image/gif,image/jpeg,image/png,image/webp" multiple={multiple} onChange={(event) => void handleFiles(event.target.files)} />
      {multiple && value.length > 1 ? <p className="storage-image-hint">Arraste as fotos para reordenar. No celular, use as setas.</p> : null}
    </section>
  );
}
