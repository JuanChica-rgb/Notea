import React, { useState } from 'react';
import { NOTEA_SCRIPT_EXAMPLE, NOTEA_SCRIPT_RULES, notebookToScript, parseNoteaScript, type NoteaDraft } from '../../utils/noteaScript';
import type { ContentType, InteractiveBlock } from '../../types';

export function AdminScriptPanel({
  contentType,
  title,
  description,
  university,
  subject,
  blocks,
  onApply,
}: {
  contentType: ContentType;
  title: string;
  description: string;
  university: string;
  subject: string;
  blocks: InteractiveBlock[];
  onApply: (draft: NoteaDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState('');

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1600);
  };

  const apply = () => {
    const result = parseNoteaScript(source);
    setErrors(result.errors);
    if (!result.draft) return;
    if (!window.confirm('Esto reemplaza los bloques de este borrador. ¿Seguimos?')) return;
    onApply(result.draft);
  };

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-indigo-300">Lenguaje Notea</span>
          <span className="block text-[11px] text-zinc-500">Solo administrador. Un guion con reglas para que una IA arme el material.</span>
        </span>
        <span className="text-xs text-zinc-400">{open ? 'Cerrar' : 'Abrir'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Cabecera con tipo, titulo, descripcion, universidad, materia y tiempos. Luego cada bloque separado por ---. Tipos: texto, flashcard, conectar, secuencia, rellenar, clasificar, vf, slider.
          </p>
          <textarea
            value={source}
            onChange={event => setSource(event.target.value)}
            rows={12}
            spellCheck={false}
            placeholder="Pega aquí el guion"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
          {errors.length > 0 && (
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={`${index}-${error}`} className="text-[11px] text-rose-300">{error}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={apply} className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white">
              Aplicar al borrador
            </button>
            <button type="button" onClick={() => void copy(`${NOTEA_SCRIPT_RULES}\n\nEjemplo:\n${NOTEA_SCRIPT_EXAMPLE}`, 'reglas')} className="px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200">
              {copied === 'reglas' ? 'Reglas copiadas' : 'Copiar reglas'}
            </button>
            <button
              type="button"
              onClick={() => setSource(notebookToScript({ contentType, title, description, university, subject, blocks }))}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200"
            >
              Traer este borrador
            </button>
            <button type="button" onClick={() => setSource(NOTEA_SCRIPT_EXAMPLE)} className="px-3 py-1.5 text-xs font-semibold text-zinc-400">
              Ver ejemplo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
