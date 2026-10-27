import React, { useEffect, useRef, useState } from 'react';

interface ImageCropDialogProps {
  file: File;
  aspect: number;
  title: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({ file, aspect, title, onCancel, onConfirm }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [url, setUrl] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  const place = (image: HTMLImageElement, nextZoom: number) => {
    const frame = frameRef.current;
    if (!frame?.clientWidth || !image.naturalWidth) return { x: 0, y: 0, width: 0, height: 0 };
    const cover = Math.max(frame.clientWidth / image.naturalWidth, frame.clientHeight / image.naturalHeight);
    const width = image.naturalWidth * cover * nextZoom;
    const height = image.naturalHeight * cover * nextZoom;
    return {
      x: (frame.clientWidth - width) / 2,
      y: (frame.clientHeight - height) / 2,
      width,
      height,
    };
  };

  const clamp = (x: number, y: number, width: number, height: number) => {
    const frame = frameRef.current;
    if (!frame) return { x, y };
    return {
      x: Math.min(0, Math.max(frame.clientWidth - width, x)),
      y: Math.min(0, Math.max(frame.clientHeight - height, y)),
    };
  };

  const layout = (nextZoom = zoom) => {
    const image = imageRef.current;
    if (!image) return null;
    const placed = place(image, nextZoom);
    return placed;
  };

  useEffect(() => {
    const image = imageRef.current;
    if (!image || !url) return;
    const start = () => {
      const placed = place(image, 1);
      setZoom(1);
      setOffset({ x: placed.x, y: placed.y });
    };
    if (image.complete) start();
    else image.addEventListener('load', start, { once: true });
  }, [url]);

  const confirm = async () => {
    const image = imageRef.current;
    const frame = frameRef.current;
    const placed = layout();
    if (!image || !frame || !placed) return;
    const scale = image.naturalWidth / placed.width;
    const sx = Math.max(0, -offset.x * scale);
    const sy = Math.max(0, -offset.y * scale);
    const sw = Math.min(image.naturalWidth - sx, frame.clientWidth * scale);
    const sh = Math.min(image.naturalHeight - sy, frame.clientHeight * scale);
    const outWidth = Math.min(1600, Math.round(sw));
    const outHeight = Math.round(outWidth / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(image, sx, sy, sw, sh, 0, 0, outWidth, outHeight);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return;
    onConfirm(new File([blob], 'recorte.jpg', { type: 'image/jpeg' }));
  };

  const metrics = layout();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <div
          ref={frameRef}
          className="relative mx-auto overflow-hidden rounded-xl bg-zinc-950 touch-none"
          style={{ width: '100%', maxWidth: 480, aspectRatio: String(aspect) }}
          onPointerDown={event => {
            drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            if (!drag.current || !metrics) return;
            const next = clamp(
              drag.current.ox + event.clientX - drag.current.x,
              drag.current.oy + event.clientY - drag.current.y,
              metrics.width,
              metrics.height,
            );
            setOffset(next);
          }}
          onPointerUp={() => { drag.current = null; }}
        >
          {url && (
            <img
              ref={imageRef}
              src={url}
              alt=""
              draggable={false}
              className="absolute max-w-none select-none"
              style={metrics ? { width: metrics.width, height: metrics.height, left: offset.x, top: offset.y } : undefined}
            />
          )}
        </div>
        <label className="block text-xs text-zinc-400">
          Acercar
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={event => {
              const nextZoom = Number(event.target.value);
              const image = imageRef.current;
              const frame = frameRef.current;
              const current = layout();
              if (!image || !frame || !current) {
                setZoom(nextZoom);
                return;
              }
              const next = place(image, nextZoom);
              const centerX = (frame.clientWidth / 2 - offset.x) / current.width;
              const centerY = (frame.clientHeight / 2 - offset.y) / current.height;
              setZoom(nextZoom);
              setOffset(clamp(frame.clientWidth / 2 - centerX * next.width, frame.clientHeight / 2 - centerY * next.height, next.width, next.height));
            }}
            className="w-full mt-1 accent-indigo-500"
          />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="text-xs text-zinc-500">Cancelar</button>
          <button type="button" onClick={() => void confirm()} className="text-xs font-semibold text-zinc-100">Listo</button>
        </div>
      </div>
    </div>
  );
};
