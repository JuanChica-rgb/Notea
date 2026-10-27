import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export function ImagePickDialog({
  title,
  onCancel,
  onFile,
}: {
  title: string;
  onCancel: () => void;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (file?: File) => {
    if (file) onFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onMouseDown={onCancel}>
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4"
        onMouseDown={event => event.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <div
          onDragOver={event => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={event => {
            event.preventDefault();
            setOver(false);
            take(event.dataTransfer.files?.[0]);
          }}
          className={`rounded-2xl border border-dashed px-4 py-10 text-center transition-colors ${
            over ? 'border-indigo-400 bg-indigo-500/10' : 'border-zinc-600 bg-zinc-950/60'
          }`}
        >
          <Upload className="w-6 h-6 mx-auto text-zinc-300" />
          <p className="mt-3 text-sm text-zinc-100">Arrastra la foto aquí</p>
          <p className="mt-1 text-xs text-zinc-500">JPG, PNG, WEBP o GIF</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onCancel} className="text-xs text-zinc-500">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
          >
            Elegir en el computador
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={event => {
            take(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
