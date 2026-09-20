import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClassroomCard } from '../common/ClassroomCard';
import { ContentType } from '../../types';
import { 
  Gamepad2, 
  BookOpen, 
  UserCheck, 
  Star, 
  FolderPlus, 
  Folder as FolderIcon, 
  Filter, 
  Plus, 
  Search,
  Sparkles,
  Layers
} from 'lucide-react';

export const MyLibraryView: React.FC = () => {
  const { 
    user, 
    cards, 
    folders, 
    addFolder, 
    setCurrentView, 
    setEditorContentType, 
    setEditingCardId 
  } = useApp();

  // Content Type Filter: 'material' or 'game'
  const [contentType, setContentType] = useState<ContentType>('material');

  // Quick Filters: 'all' | 'created_by_me' | 'favorites'
  const [quickFilter, setQuickFilter] = useState<'all' | 'created_by_me' | 'favorites'>('all');

  // Selected folder filter (optional)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // New folder creation state
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');

  // Search input within library
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters
  const filteredCards = cards.filter(card => {
    // 1. Content Type Filter (Material vs Juegos)
    if (card.contentType !== contentType) return false;

    // 2. Quick Filters
    if (quickFilter === 'created_by_me' && card.authorId !== user.id) return false;
    if (quickFilter === 'favorites' && !card.isFavorite) return false;

    // 3. Folder Filter
    if (selectedFolderId && card.folderId !== selectedFolderId) return false;

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchSubject = card.subjectName.toLowerCase().includes(q);
      const matchCode = card.accessCode.toLowerCase().includes(q);
      const matchUniv = card.universityName.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchCode && !matchUniv) return false;
    }

    return true;
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleQuickCreate = () => {
    setEditingCardId(null);
    setEditorContentType(contentType);
    setCurrentView('editor');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner & Welcome Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 border border-zinc-800 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Mi Biblioteca Académica
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400">{user.university}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-zinc-100 mt-1">
            Hola, {user.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Explora tus cuadernos interactivos, fichas de estudio y desafíos de ráfaga para tus materias de {user.currentSemester}.° semestre.
          </p>
        </div>

        <button
          type="button"
          onClick={handleQuickCreate}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          {contentType === 'material' ? 'Crear Nuevo Cuaderno' : 'Crear Nuevo Juego'}
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="space-y-4">
        {/* 1. Main Content Type Toggle: Juegos vs Material de estudio */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setContentType('material');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                contentType === 'material'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Material de Estudio (Cuadernos)
            </button>

            <button
              type="button"
              onClick={() => {
                setContentType('game');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                contentType === 'game'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Juegos Competitivos (Ráfagas)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filtrar por título, materia..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 2. Quick Filters: "Creados por mí" and "Favoritos" */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-zinc-400 mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filtros Rápidos:
          </span>

          <button
            type="button"
            onClick={() => setQuickFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              quickFilter === 'all'
                ? 'bg-zinc-800 border-zinc-600 text-zinc-100 shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'created_by_me' ? 'all' : 'created_by_me')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              quickFilter === 'created_by_me'
                ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300 shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            Creados por mí
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'favorites' ? 'all' : 'favorites')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              quickFilter === 'favorites'
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Favoritos
          </button>
        </div>

        {/* 3. Carpetas Personalizadas */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Carpetas Personalizadas (Organiza por materias o parciales)
              </h3>
            </div>

            {!isAddingFolder && (
              <button
                type="button"
                onClick={() => setIsAddingFolder(true)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Carpeta
              </button>
            )}
          </div>

          {/* Add Folder Form */}
          {isAddingFolder && (
            <form onSubmit={handleCreateFolder} className="flex flex-wrap items-center gap-2 p-2 bg-zinc-900 border border-zinc-700 rounded-xl">
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Nombre de la carpeta (ej. Parcial 1, Fórmulas)..."
                className="flex-1 min-w-[200px] px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              {/* Color picker pills */}
              <div className="flex items-center gap-1.5">
                {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewFolderColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      newFolderColor === color ? 'scale-110 border-white' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsAddingFolder(false)}
                className="px-2.5 py-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg"
              >
                Cancelar
              </button>
            </form>
          )}

          {/* Folder Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                selectedFolderId === null
                  ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Todas las carpetas
            </button>
            {folders.map(folder => {
              const isSelected = selectedFolderId === folder.id;
              const count = cards.filter(c => c.folderId === folder.id && c.contentType === contentType).length;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolderId(isSelected ? null : folder.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-500 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: folder.color }} 
                  />
                  <span>{folder.name}</span>
                  <span className="text-[10px] px-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CARDS GRID (Google Classroom Style) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-display text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            {contentType === 'material' ? 'Cuadernos y Materiales de Estudio' : 'Juegos y Ráfagas Competitivas'}
            <span className="text-xs font-normal text-zinc-400 font-mono">
              ({filteredCards.length} disponibles)
            </span>
          </h2>
        </div>

        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map(card => (
              <ClassroomCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl">
            <Sparkles className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">
              No hay {contentType === 'material' ? 'materiales' : 'juegos'} que coincidan con estos filtros
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Intenta cambiar los filtros o crea tu propio contenido interactivo ahora mismo.
            </p>
            <button
              type="button"
              onClick={handleQuickCreate}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              + Crear {contentType === 'material' ? 'Cuaderno' : 'Juego'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
