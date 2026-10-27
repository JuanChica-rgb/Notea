import React, { useState } from 'react';
import { BadgeCheck, GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CatalogSearch } from '../common/CatalogSearch';
import type { EducatorKind, EducatorStatus, PublicUser } from '../../types';

export function EducatorBadge({
  kind,
  university,
  status,
}: {
  kind?: EducatorKind;
  university?: string;
  status?: EducatorStatus;
}) {
  if (status !== 'verified' || !kind) return null;
  const label = kind === 'professor' ? 'Profesor verificado' : 'Tutor verificado';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
      <BadgeCheck className="w-3.5 h-3.5" />
      {label}{university ? ` · ${university}` : ''}
    </span>
  );
}

export function EducatorRequestSection() {
  const { user, universities, requestEducatorVerification } = useApp();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EducatorKind>(user.educatorKind || 'professor');
  const [university, setUniversity] = useState(user.educatorUniversity || '');
  const [sending, setSending] = useState(false);

  if (user.educatorStatus === 'verified') {
    return (
      <div className="p-5 bg-zinc-950 rounded-2xl border border-emerald-500/30 space-y-2">
        <p className="text-xs font-bold text-zinc-200">Verificación académica</p>
        <EducatorBadge kind={user.educatorKind} university={user.educatorUniversity} status={user.educatorStatus} />
      </div>
    );
  }

  const send = async () => {
    setSending(true);
    await requestEducatorVerification(kind, university);
    setSending(false);
    setOpen(false);
  };

  return (
    <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-200">¿Eres profesor?</span>
        </div>
        <p className="text-xs text-zinc-400">
          Si enseñas o acompañas estudiantes, puedes pedir la etiqueta de tutor o profesor. Un admin la revisa antes de mostrarla en tu perfil.
        </p>
      </div>

      {user.educatorStatus === 'pending' && (
        <p className="text-xs font-semibold text-amber-300">
          Solicitud en revisión: {user.educatorKind === 'tutor' ? 'tutor' : 'profesor'}
          {user.educatorUniversity ? ` · ${user.educatorUniversity}` : ''}.
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          {user.educatorStatus === 'pending' ? 'Actualizar solicitud' : 'Sí, quiero la etiqueta'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKind('tutor')}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${kind === 'tutor' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
            >
              Tutor
            </button>
            <button
              type="button"
              onClick={() => setKind('professor')}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${kind === 'professor' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
            >
              Profesor
            </button>
          </div>
          <CatalogSearch
            placeholder="Buscar universidad"
            selected={university}
            items={universities}
            emptyLabel="No hay universidades con ese nombre."
            onSelect={setUniversity}
            onClear={() => setUniversity('')}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={sending || !university.trim()}
              onClick={() => void send()}
              className="px-4 py-2 bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
            >
              {sending ? 'Enviando...' : 'Enviar a revisión'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminEducatorControls({ person }: { person: PublicUser }) {
  const {
    universities,
    assignEducatorVerification,
    clearEducatorVerification,
    setUserAdminRole,
  } = useApp();
  const [kind, setKind] = useState<EducatorKind>(person.educatorKind || 'professor');
  const [university, setUniversity] = useState(person.educatorUniversity || person.university || '');
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    setBusy(true);
    await assignEducatorVerification(person.id, kind, university);
    setBusy(false);
  };

  const clear = async () => {
    setBusy(true);
    await clearEducatorVerification(person.id);
    setBusy(false);
  };

  const toggleAdmin = async () => {
    setBusy(true);
    await setUserAdminRole(person.id, person.role !== 'admin');
    setBusy(false);
  };

  return (
    <section className="p-5 bg-zinc-900 border border-amber-500/30 rounded-3xl space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Controles de admin</p>
        <p className="text-xs text-zinc-400 mt-1">Puedes dar admin o poner la etiqueta de tutor o profesor en este perfil.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleAdmin()}
          className="px-3 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold disabled:opacity-40"
        >
          {person.role === 'admin' ? 'Quitar admin' : 'Dar admin'}
        </button>
        {(person.educatorStatus === 'pending' || person.educatorStatus === 'verified') && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void clear()}
            className="px-3 py-2 bg-zinc-800 text-zinc-200 rounded-xl text-xs font-bold disabled:opacity-40"
          >
            Quitar verificación
          </button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={kind}
          onChange={event => setKind(event.target.value as EducatorKind)}
          className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100"
        >
          <option value="professor">Profesor</option>
          <option value="tutor">Tutor</option>
        </select>
        <input
          list="educator-universities"
          value={university}
          onChange={event => setUniversity(event.target.value)}
          placeholder="Universidad"
          className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100"
        />
        <datalist id="educator-universities">
          {universities.map(item => <option key={item.id} value={item.name} />)}
        </datalist>
      </div>
      <button
        type="button"
        disabled={busy || !university.trim()}
        onClick={() => void verify()}
        className="px-4 py-2 bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
      >
        Verificar en este perfil
      </button>
    </section>
  );
}
