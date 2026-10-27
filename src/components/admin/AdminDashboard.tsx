import React, { useMemo, useState } from 'react';
import { isNoteaAdmin, useApp } from '../../context/AppContext';
import { AdminPeoplePanel, EducatorRequests } from './AdminPeoplePanel';
import { careerUniversityIds, namesFromList, sortByCatalogOrder, sortedUniqueSubjects } from '../../utils/catalog';
import { ShieldCheck } from 'lucide-react';

const inputClass = 'w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600';

function CatalogPaste({ existing, onAdd }: { existing: string[]; onAdd: (names: string[]) => Promise<{ added: number; skipped: string[] }> }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = namesFromList(text, existing);
    if (parsed.names.length === 0 && parsed.skipped.length === 0) return;
    setBusy(true);
    try {
      const result = parsed.names.length ? await onAdd(parsed.names) : { added: 0, skipped: [] as string[] };
      const omitted = [...parsed.skipped, ...result.skipped];
      setNote(omitted.length > 0
        ? `Se agregaron ${result.added}. Se omitieron ${omitted.length}: ${omitted.slice(0, 6).join(', ')}${omitted.length > 6 ? '…' : ''}`
        : `Se agregaron ${result.added}.`);
      if (result.added > 0) setText('');
    } catch (error) {
      console.error('Error al agregar la lista:', error);
      setNote('No se pudo agregar la lista.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={event => void submit(event)} className="space-y-2">
      <textarea value={text} onChange={event => setText(event.target.value)} rows={4} placeholder="Pega una lista, una por línea" className={inputClass} />
      <button type="submit" disabled={busy} className="text-xs font-semibold text-zinc-300 disabled:opacity-50">Agregar lista</button>
      {note && <p className="text-xs text-zinc-500">{note}</p>}
    </form>
  );
}

export const AdminDashboard: React.FC = () => {
  const {
    pendingRequests,
    user,
    approvePendingRequest,
    rejectPendingRequest,
    mergePendingRequest,
    universities,
    careers,
    subjects,
    addUniversity,
    addCareer,
    addSubject,
    deleteSubject,
    deleteUniversity,
    deleteCareer,
    updateCareer,
    addCatalogBatch,
    directoryUsers,
    showToast,
  } = useApp();

  type AdminTab = 'pending' | 'catalog' | 'accounts';
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');

  const [newUnivName, setNewUnivName] = useState('');
  const [newCareerName, setNewCareerName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newCareerUnivIds, setNewCareerUnivIds] = useState<string[] | null>(null);
  const [mergeTargetRequest, setMergeTargetRequest] = useState<string | null>(null);
  const [selectedMergeWith, setSelectedMergeWith] = useState('');

  const pendingList = pendingRequests.filter(request => request.status === 'pending');
  const educatorPending = useMemo(
    () => directoryUsers.filter(person => person.educatorStatus === 'pending').length,
    [directoryUsers],
  );
  const pendingCount = pendingList.length + educatorPending;

  if (!isNoteaAdmin(user)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShieldCheck className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-zinc-100">Acceso restringido</h1>
        <p className="text-sm text-zinc-500 mt-2">Solo un administrador puede entrar aquí.</p>
      </div>
    );
  }

  const handleAddUniv = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUnivName.trim()) return;
    addUniversity(newUnivName.trim());
    setNewUnivName('');
  };

  const selectedCareerUnivs = newCareerUnivIds ?? universities.map(item => item.id);

  const handleAddCareer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCareerName.trim()) return;
    addCareer(newCareerName.trim(), selectedCareerUnivs);
    setNewCareerName('');
    setNewCareerUnivIds(null);
  };

  const handleAddSubject = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSubjectName.trim()) return;
    addSubject(newSubjectName.trim());
    setNewSubjectName('');
  };

  const handleExecuteMerge = (requestId: string) => {
    if (!selectedMergeWith.trim()) {
      showToast('Selecciona la materia oficial con la que deseas fusionar.');
      return;
    }
    mergePendingRequest(requestId, selectedMergeWith.trim());
    setMergeTargetRequest(null);
    setSelectedMergeWith('');
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'
    }`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setActiveTab('pending')} className={tabClass(activeTab === 'pending')}>
          Pendientes{pendingCount > 0 ? ` ${pendingCount}` : ''}
        </button>
        <button type="button" onClick={() => setActiveTab('catalog')} className={tabClass(activeTab === 'catalog')}>
          Catálogo
        </button>
        <button type="button" onClick={() => setActiveTab('accounts')} className={tabClass(activeTab === 'accounts')}>
          Cuentas
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-8">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-400">Opción Otra</h2>
            {pendingList.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay solicitudes.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {pendingList.map(request => (
                  <div key={request.id} className="py-3 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100">{request.customValue}</p>
                        <p className="text-xs text-zinc-500">
                          {request.type === 'university' ? 'Universidad' : request.type === 'career' ? 'Carrera' : 'Materia'}
                          {' · @'}{request.submittedByUsername}
                          {request.relatedEntityName ? ` · ${request.relatedEntityName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => approvePendingRequest(request.id)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold">
                          Aprobar
                        </button>
                        <button type="button" onClick={() => setMergeTargetRequest(request.id)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg text-xs font-semibold">
                          Fusionar
                        </button>
                        <button type="button" onClick={() => rejectPendingRequest(request.id)} className="px-3 py-1.5 text-zinc-500 hover:text-rose-300 rounded-lg text-xs font-semibold">
                          Rechazar
                        </button>
                      </div>
                    </div>
                    {mergeTargetRequest === request.id && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedMergeWith}
                          onChange={event => setSelectedMergeWith(event.target.value)}
                          className={inputClass}
                        >
                          <option value="">Materia oficial</option>
                          {sortedUniqueSubjects(subjects).map(subject => (
                            <option key={subject.id} value={subject.name}>{subject.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => handleExecuteMerge(request.id)} className="px-3 py-2 bg-zinc-800 text-zinc-100 rounded-lg text-xs font-semibold">
                          Confirmar
                        </button>
                        <button type="button" onClick={() => setMergeTargetRequest(null)} className="px-3 py-2 text-zinc-500 text-xs font-semibold">
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-400">Tutor y profesor</h2>
            <EducatorRequests />
          </section>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400">Universidades</h2>
            <form onSubmit={handleAddUniv} className="flex gap-2">
              <input value={newUnivName} onChange={event => setNewUnivName(event.target.value)} placeholder="Nueva universidad" className={inputClass} />
              <button type="submit" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold shrink-0">Agregar</button>
            </form>
            <CatalogPaste existing={universities.map(item => item.name)} onAdd={names => addCatalogBatch('university', names)} />
            {universities.length === 0 ? (
              <p className="text-sm text-zinc-500">Todavía no hay universidades.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {sortByCatalogOrder(universities).map(university => {
                  const linkedCareers = careers.filter(career => careerUniversityIds(career).includes(university.id));
                  return (
                    <div key={university.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100">{university.name}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          {linkedCareers.length > 0 ? linkedCareers.map(career => career.name).join(' · ') : 'Sin carreras'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.confirm(`¿Eliminar "${university.name}"?`) && deleteUniversity(university.id)}
                        className="text-xs text-zinc-500 hover:text-rose-300 shrink-0"
                      >
                        Eliminar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400">Carreras</h2>
            <form onSubmit={handleAddCareer} className="space-y-3">
              <div className="flex gap-2">
                <input value={newCareerName} onChange={event => setNewCareerName(event.target.value)} placeholder="Nueva carrera" className={inputClass} />
                <button type="submit" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold shrink-0">Agregar</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sortByCatalogOrder(universities).map(university => {
                  const checked = selectedCareerUnivs.includes(university.id);
                  return (
                    <button
                      key={university.id}
                      type="button"
                      onClick={() => setNewCareerUnivIds(checked ? selectedCareerUnivs.filter(id => id !== university.id) : [...selectedCareerUnivs, university.id])}
                      className={`px-2.5 py-1 rounded-lg text-xs ${checked ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}
                    >
                      {university.acronym || university.name}
                    </button>
                  );
                })}
              </div>
            </form>
            <CatalogPaste existing={careers.map(item => item.name)} onAdd={names => addCatalogBatch('career', names)} />
            {careers.length === 0 ? (
              <p className="text-sm text-zinc-500">Todavía no hay carreras.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {sortByCatalogOrder(careers).map(career => {
                  const linked = careerUniversityIds(career);
                  return (
                    <div key={career.id} className="py-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-100">{career.name}</p>
                        <button
                          type="button"
                          onClick={() => window.confirm(`¿Eliminar "${career.name}"?`) && deleteCareer(career.id)}
                          className="text-xs text-zinc-500 hover:text-rose-300 shrink-0"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {universities.map(university => {
                          const active = linked.includes(university.id);
                          return (
                            <button
                              key={university.id}
                              type="button"
                              onClick={() => {
                                const next = active ? linked.filter(id => id !== university.id) : [...linked, university.id];
                                updateCareer(career.id, career.name, next);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}
                            >
                              {university.acronym || university.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400">Materias</h2>
            <form onSubmit={handleAddSubject} className="flex gap-2">
              <input value={newSubjectName} onChange={event => setNewSubjectName(event.target.value)} placeholder="Nueva materia" className={inputClass} />
              <button type="submit" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold shrink-0">Agregar</button>
            </form>
            <CatalogPaste existing={subjects.map(item => item.name)} onAdd={names => addCatalogBatch('subject', names)} />
            {subjects.length === 0 ? (
              <p className="text-sm text-zinc-500">Todavía no hay materias.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {sortByCatalogOrder(subjects).map(subject => (
                  <div key={subject.id} className="py-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-100">{subject.name}</p>
                    <button type="button" onClick={() => deleteSubject(subject.id)} className="text-xs text-zinc-500 hover:text-rose-300 shrink-0">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'accounts' && <AdminPeoplePanel />}
    </div>
  );
};
