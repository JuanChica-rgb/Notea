import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { normalizeUsername } from '../../utils/username';
import { EducatorBadge } from '../profile/EducatorVerification';
import type { EducatorKind } from '../../types';

export function EducatorRequests() {
  const { directoryUsers, reviewEducatorRequest, openCreatorProfile } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);
  const pending = useMemo(
    () => directoryUsers.filter(person => person.educatorStatus === 'pending'),
    [directoryUsers],
  );

  if (pending.length === 0) {
    return <p className="text-sm text-zinc-500">No hay solicitudes de tutor o profesor.</p>;
  }

  return (
    <div className="divide-y divide-zinc-800">
      {pending.map(person => (
        <div key={person.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button type="button" onClick={() => openCreatorProfile(person)} className="text-sm font-semibold text-zinc-100 hover:text-indigo-300">
              {person.fullName || person.username}
            </button>
            <p className="text-xs text-zinc-500">
              @{person.username}
              {' · '}
              {person.educatorKind === 'tutor' ? 'Tutor' : 'Profesor'}
              {person.educatorUniversity ? ` · ${person.educatorUniversity}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busyId === person.id}
              onClick={() => {
                setBusyId(person.id);
                void reviewEducatorRequest(person.id, 'verified').finally(() => setBusyId(null));
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-100 rounded-lg text-xs font-semibold"
            >
              Verificar
            </button>
            <button
              type="button"
              disabled={busyId === person.id}
              onClick={() => {
                setBusyId(person.id);
                void reviewEducatorRequest(person.id, 'rejected').finally(() => setBusyId(null));
              }}
              className="px-3 py-1.5 text-zinc-500 hover:text-rose-300 disabled:opacity-40 rounded-lg text-xs font-semibold"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPeoplePanel() {
  const {
    directoryUsers,
    setUserAdminRole,
    assignEducatorVerification,
    clearEducatorVerification,
    openCreatorProfile,
  } = useApp();
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [kind, setKind] = useState<EducatorKind>('professor');
  const [university, setUniversity] = useState('');

  const matches = useMemo(() => {
    const handle = normalizeUsername(query);
    const text = query.trim().toLowerCase();
    if (handle.length < 2 && text.length < 2) return [];
    return directoryUsers
      .filter(person => person.username.includes(handle) || person.fullName.toLowerCase().includes(text))
      .slice(0, 8);
  }, [directoryUsers, query]);

  return (
    <div className="space-y-4 max-w-xl">
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Buscar por @ o nombre"
        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
      />
      {query.trim().length >= 2 && matches.length === 0 && (
        <p className="text-sm text-zinc-500">No hay cuentas con ese nombre.</p>
      )}
      <div className="divide-y divide-zinc-800">
        {matches.map(person => {
          const editing = editorId === person.id;
          const verified = person.educatorStatus === 'verified';
          return (
            <div key={person.id} className="py-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <button type="button" onClick={() => openCreatorProfile(person)} className="text-sm font-semibold text-zinc-100 hover:text-indigo-300">
                    @{person.username}
                  </button>
                  <p className="text-xs text-zinc-500">{person.fullName}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {person.role === 'admin' && (
                      <span className="text-[11px] text-amber-300">Admin</span>
                    )}
                    <EducatorBadge kind={person.educatorKind} university={person.educatorUniversity} status={person.educatorStatus} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === person.id}
                    onClick={() => {
                      setBusyId(person.id);
                      void setUserAdminRole(person.id, person.role !== 'admin').finally(() => setBusyId(null));
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-100 rounded-lg text-xs font-semibold"
                  >
                    {person.role === 'admin' ? 'Quitar admin' : 'Dar admin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editing) {
                        setEditorId(null);
                        return;
                      }
                      setEditorId(person.id);
                      setKind(person.educatorKind || 'professor');
                      setUniversity(person.educatorUniversity || person.university || '');
                    }}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                  >
                    {verified ? 'Cambiar etiqueta' : 'Tutor o profesor'}
                  </button>
                </div>
              </div>
              {editing && (
                <form
                  onSubmit={event => {
                    event.preventDefault();
                    setBusyId(person.id);
                    void assignEducatorVerification(person.id, kind, university).finally(() => {
                      setBusyId(null);
                      setEditorId(null);
                    });
                  }}
                  className="space-y-2"
                >
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setKind('professor')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${kind === 'professor' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}>Profesor</button>
                    <button type="button" onClick={() => setKind('tutor')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${kind === 'tutor' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}>Tutor</button>
                  </div>
                  <input
                    value={university}
                    onChange={event => setUniversity(event.target.value)}
                    placeholder="Universidad"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                  <div className="flex gap-3">
                    <button type="submit" disabled={busyId === person.id || !university.trim()} className="text-xs font-semibold text-zinc-100 disabled:opacity-40">
                      Verificar
                    </button>
                    {verified && (
                      <button
                        type="button"
                        disabled={busyId === person.id}
                        onClick={() => {
                          setBusyId(person.id);
                          void clearEducatorVerification(person.id).finally(() => {
                            setBusyId(null);
                            setEditorId(null);
                          });
                        }}
                        className="text-xs text-zinc-500 hover:text-rose-300 disabled:opacity-40"
                      >
                        Quitar
                      </button>
                    )}
                    <button type="button" onClick={() => setEditorId(null)} className="text-xs text-zinc-500">Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
