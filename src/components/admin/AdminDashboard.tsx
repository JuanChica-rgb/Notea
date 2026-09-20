import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  GitMerge, 
  Plus, 
  Trash2, 
  Clock, 
  Building, 
  GraduationCap, 
  BookOpen, 
  AlertCircle 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    pendingRequests, 
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
    showToast
  } = useApp();

  type AdminTab = 'pending' | 'universities' | 'careers' | 'subjects';
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');

  // Form states for quick entity additions
  const [newUnivName, setNewUnivName] = useState('');
  const [newCareerName, setNewCareerName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCareer, setNewSubjectCareer] = useState(careers[0]?.name || 'Ingeniería de Software');
  const [newSubjectSemester, setNewSubjectSemester] = useState<number>(1);

  // Merge modal state
  const [mergeTargetRequest, setMergeTargetRequest] = useState<string | null>(null);
  const [selectedMergeWith, setSelectedMergeWith] = useState('');

  const pendingList = pendingRequests.filter(r => r.status === 'pending');

  const handleAddUniv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnivName.trim()) return;
    addUniversity(newUnivName.trim());
    setNewUnivName('');
    showToast(`Universidad "${newUnivName}" agregada a la lista oficial.`);
  };

  const handleAddCareer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCareerName.trim()) return;
    addCareer(newCareerName.trim());
    setNewCareerName('');
    showToast(`Carrera "${newCareerName}" agregada a la lista oficial.`);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const careerObj = careers.find(c => c.name === newSubjectCareer);
    addSubject(newSubjectName.trim(), careerObj?.id || careers[0]?.id || 'c1', newSubjectSemester);
    setNewSubjectName('');
    showToast(`Materia "${newSubjectName}" agregada al semestre ${newSubjectSemester}.`);
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      {/* Admin Banner */}
      <div className="p-6 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Panel de Administración y Moderación Académica
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400">Notea Backoffice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-zinc-100 mt-1">
            Gestión Académica & Cola de Aprobación
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Revisa solicitudes de "Opción Otra" enviadas durante registros y administra el catálogo oficial de universidades, carreras y materias.
          </p>
        </div>

        {/* Pending Badge */}
        <div className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-amber-400 font-bold text-xs">
          <Clock className="w-4 h-4" />
          <span>{pendingList.length} Solicitud(es) pendiente(s)</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Cola de Aprobación ("Opción Otra")
          {pendingList.length > 0 && (
            <span className="px-1.5 py-0.2 bg-black text-amber-300 rounded-full text-[10px] font-mono">
              {pendingList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('universities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'universities'
              ? 'bg-zinc-800 text-indigo-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Universidades ({universities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('careers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'careers'
              ? 'bg-zinc-800 text-indigo-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Carreras ({careers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'subjects'
              ? 'bg-zinc-800 text-indigo-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Materias Oficiales ({subjects.length})
        </button>
      </div>

      {/* 1. PENDING REQUESTS QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Solicitudes de Usuarios ("Opción Otra")
            </h3>
            <span className="text-xs text-zinc-500">
              Al aprobar, la entidad queda automáticamente disponible para todos los estudiantes en los selectores.
            </span>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map(req => {
                const isPending = req.status === 'pending';
                return (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-zinc-900/90 border-amber-500/40 shadow-lg'
                        : req.status === 'approved'
                        ? 'bg-zinc-950/50 border-emerald-500/30 opacity-70'
                        : req.status === 'merged'
                        ? 'bg-zinc-950/50 border-indigo-500/30 opacity-70'
                        : 'bg-zinc-950/50 border-zinc-800 opacity-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.type === 'university'
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : req.type === 'career'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {req.type === 'university' ? 'Universidad' : req.type === 'career' ? 'Carrera' : 'Materia'}
                          </span>

                          <span className="text-xs text-zinc-400">
                            Enviado por: <strong className="text-zinc-200">@{req.submittedByUsername}</strong>
                          </span>

                          <span className="text-xs text-zinc-500">• {req.submittedAt}</span>
                        </div>

                        <h4 className="text-lg font-bold text-zinc-100 mt-1">
                          "{req.customValue}"
                        </h4>

                        <div className="text-xs text-zinc-400 mt-0.5 space-x-3">
                          {req.relatedEntityName && <span>Relacionado a: <strong>{req.relatedEntityName}</strong></span>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {isPending ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Approve */}
                          <button
                            type="button"
                            onClick={() => approvePendingRequest(req.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprobar
                          </button>

                          {/* Merge */}
                          <button
                            type="button"
                            onClick={() => setMergeTargetRequest(req.id)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                            Fusionar
                          </button>

                          {/* Reject */}
                          <button
                            type="button"
                            onClick={() => rejectPendingRequest(req.id)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-400 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                          Estado: <span className="uppercase text-zinc-200">{req.status}</span>
                        </div>
                      )}
                    </div>

                      {/* Sub-dialog for Merging */}
                      {mergeTargetRequest === req.id && (
                        <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-indigo-500/40 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                            <GitMerge className="w-4 h-4" />
                            <span>Fusionar "{req.customValue}" con una materia existente oficial (para corregir errores ortográficos):</span>
                          </div>

                          <div className="flex gap-2">
                            <select
                              value={selectedMergeWith}
                              onChange={e => setSelectedMergeWith(e.target.value)}
                              className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                            >
                              <option value="">Selecciona materia oficial existente...</option>
                              {subjects.map(s => {
                                const careerObj = careers.find(c => c.id === s.careerId);
                                return (
                                  <option key={s.id} value={s.name}>
                                    {s.name} ({careerObj?.name || 'Común'})
                                  </option>
                                );
                              })}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleExecuteMerge(req.id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                            >
                              Confirmar Fusión
                            </button>
                            <button
                              type="button"
                              onClick={() => setMergeTargetRequest(null)}
                              className="px-3 py-2 bg-zinc-800 text-zinc-400 text-xs rounded-xl"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-zinc-300">¡Cola limpia y al día!</h4>
              <p className="text-xs text-zinc-500 mt-1">
                No hay solicitudes pendientes de "Opción Otra" para revisar en este momento.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. UNIVERSITIES CRUD */}
      {activeTab === 'universities' && (
        <div className="space-y-4">
          <form onSubmit={handleAddUniv} className="flex gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <input
              type="text"
              value={newUnivName}
              onChange={e => setNewUnivName(e.target.value)}
              placeholder="Nueva universidad oficial (ej. Universidad de Buenos Aires)..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Agregar Universidad
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {universities.map(u => (
              <div key={u.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">{u.name}</span>
                <span className="text-[10px] text-zinc-500 uppercase">{u.country}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CAREERS CRUD */}
      {activeTab === 'careers' && (
        <div className="space-y-4">
          <form onSubmit={handleAddCareer} className="flex gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <input
              type="text"
              value={newCareerName}
              onChange={e => setNewCareerName(e.target.value)}
              placeholder="Nueva carrera oficial (ej. Bioingeniería, Arquitectura)..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Agregar Carrera
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {careers.map(c => (
              <div key={c.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">{c.name}</span>
                <span className="text-[10px] text-indigo-400 font-mono">10 Semestres</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUBJECTS CRUD */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <form onSubmit={handleAddSubject} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Registrar Nueva Materia Oficial:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                placeholder="Nombre de la materia..."
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newSubjectCareer}
                onChange={e => setNewSubjectCareer(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100"
              >
                {careers.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select
                value={newSubjectSemester}
                onChange={e => setNewSubjectSemester(Number(e.target.value))}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                  <option key={s} value={s}>{s}.° Semestre</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Registrar Materia
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {subjects.map(s => {
              const careerObj = careers.find(c => c.id === s.careerId);
              return (
                <div key={s.id} className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{s.name}</h4>
                    <span className="text-[10px] text-zinc-400">{careerObj?.name || 'Tronco Común'} • {s.semester}.° Semestre</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSubject(s.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400"
                    title="Eliminar materia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
