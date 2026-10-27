import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, BookOpen, Gamepad2, GraduationCap, X } from 'lucide-react';

export const FloatingCreateButton: React.FC = () => {
  const { user, setCurrentView, setEditorContentType, setEditingCardId, openAuthModal } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateMaterial = () => {
    if (user.isGuest) {
      openAuthModal('login');
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setEditingCardId(null);
    setEditorContentType('material');
    setCurrentView('editor');
  };

  const handleOpenCourses = () => {
    if (user.isGuest) {
      openAuthModal('login');
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    sessionStorage.setItem('notea_course_create', '1');
    window.dispatchEvent(new Event('notea-course-create'));
    setCurrentView('courses');
  };

  const handleCreateGame = () => {
    if (user.isGuest) {
      openAuthModal('login');
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setEditingCardId(null);
    setEditorContentType('game');
    setCurrentView('editor');
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
      {/* Floating Options Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-72 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-2 space-y-1 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Crear en Notea</span>
            <p className="text-[11px] text-zinc-500">Selecciona el formato que deseas diseñar:</p>
          </div>

          {/* Option A: Material de Estudio / Cuaderno */}
          <button
            type="button"
            onClick={handleCreateMaterial}
            className="w-full p-3 rounded-xl hover:bg-zinc-800/80 transition-colors flex items-start gap-3 text-left group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-300">
                Material de Estudio / Cuaderno
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cuaderno para estudiar y publicar en un curso.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleOpenCourses}
            className="w-full p-3 rounded-xl hover:bg-zinc-800/80 transition-colors flex items-start gap-3 text-left group"
          >
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-sky-300">Curso</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Un espacio con código para tu materia, avisos y cuadernos.</p>
            </div>
          </button>

          {/* Option B: Juego Competitivo / Ráfaga */}
          <button
            type="button"
            onClick={handleCreateGame}
            className="w-full p-3 rounded-xl hover:bg-zinc-800/80 transition-colors flex items-start gap-3 text-left group"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-purple-300">
                Juego
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Para el muro del curso o para jugar en clase.
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Main Floating "+" Button */}
      <button
        type="button"
        onClick={() => {
          if (user.isGuest) {
            openAuthModal('login');
            return;
          }
          setIsOpen(!isOpen);
        }}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform duration-200 focus:outline-none ${
          isOpen
            ? 'bg-zinc-800 text-zinc-200 rotate-45 border border-zinc-700'
            : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/30'
        }`}
        title="Crear nuevo contenido (+)"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7" />}
      </button>
    </div>
  );
};
