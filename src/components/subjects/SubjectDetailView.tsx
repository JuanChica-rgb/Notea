import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClassroomCard } from '../common/ClassroomCard';
import { BookOpen, Compass, Search, Filter, Layers, Plus } from 'lucide-react';

export const SubjectDetailView: React.FC = () => {
  const { user, cards, subjects, setCurrentView, setEditorContentType, setEditingCardId } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || 'Álgebra Lineal');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const subjectCards = cards.filter(c => {
    if (selectedSubject && c.subjectName !== selectedSubject) return false;
    if (semesterFilter !== 'all' && c.semester !== semesterFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleCreateInSubject = () => {
    setEditingCardId(null);
    setEditorContentType('material');
    setCurrentView('editor');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Explorador por Materia
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400">{user.career}</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-zinc-100 mt-1">
            Materias & Contenidos Académicos
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Navega por las materias oficiales de tu malla curricular y descubre los cuadernos y juegos creados por la comunidad estudiantil.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateInSubject}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg flex items-center gap-2 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Aportar en esta Materia
        </button>
      </div>

      {/* Selectors and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Subject Pills */}
        <div className="flex flex-wrap gap-2 flex-1">
          {subjects.map(s => {
            const isSelected = selectedSubject === s.name;
            const count = cards.filter(c => c.subjectName === s.name).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubject(s.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s.name}
                <span className="ml-1.5 px-1 rounded bg-black/30 text-[10px] font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en la materia..."
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Cards Display */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Contenidos en {selectedSubject} ({subjectCards.length})
        </h2>

        {subjectCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectCards.map(card => (
              <ClassroomCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl">
            <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Aún no hay cuadernos en {selectedSubject}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Sé el primero en crear y compartir un cuaderno o juego interactivo.</p>
            <button
              type="button"
              onClick={handleCreateInSubject}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
            >
              + Crear Cuaderno en {selectedSubject}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
