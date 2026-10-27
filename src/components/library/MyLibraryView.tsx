import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClassroomCard } from '../common/ClassroomCard';
import { Plus } from 'lucide-react';

const FOLDER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const MyLibraryView: React.FC = () => {
  const {
    user,
    cards,
    folders,
    addFolder,
    updateFolder,
    deleteFolder,
  } = useApp();

  const [quickFilter, setQuickFilter] = useState<'created_by_me' | 'favorites'>('created_by_me');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(FOLDER_COLORS[0]);
  const [menuPoint, setMenuPoint] = useState<{ x: number; y: number } | null>(null);

  const userFolders = folders.filter(folder => !folder.ownerId || folder.ownerId === user.id);
  const selectedFolder = userFolders.find(folder => folder.id === selectedFolderId) ?? null;
  const editingFolder = userFolders.find(folder => folder.id === editingFolderId) ?? null;

  useEffect(() => {
    if (!editingFolderId) return;
    const close = () => {
      setEditingFolderId(null);
      setMenuPoint(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingFolderId]);

  const filteredCards = cards.filter(card => {
    if (selectedFolder) return card.folderId === selectedFolder.id;
    if (quickFilter === 'created_by_me' && card.authorId !== user.id) return false;
    if (quickFilter === 'favorites' && !card.isFavorite) return false;
    return true;
  });

  const handleCreateFolder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const openFolderEditor = (event: React.MouseEvent, folderId: string, name: string, color: string) => {
    event.preventDefault();
    setEditingFolderId(folderId);
    setEditName(name);
    setEditColor(color || FOLDER_COLORS[0]);
    setMenuPoint({
      x: Math.min(event.clientX, window.innerWidth - 280),
      y: Math.min(event.clientY, window.innerHeight - 180),
    });
  };

  const saveFolderEdits = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingFolder) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (trimmed !== editingFolder.name || editColor !== editingFolder.color) {
      void updateFolder(editingFolder.id, trimmed, editColor);
    }
    setEditingFolderId(null);
    setMenuPoint(null);
  };

  const handleDeleteFolder = () => {
    if (!selectedFolder) return;
    if (!window.confirm(`¿Eliminar la carpeta "${selectedFolder.name}"? Los contenidos no se borrarán, solo se desvincularán.`)) return;
    void deleteFolder(selectedFolder.id);
    setSelectedFolderId(null);
  };

  const emptyMessage = selectedFolder
    ? 'Esta carpeta está vacía.'
    : quickFilter === 'favorites'
      ? 'Todavía no tienes favoritos.'
      : 'Todavía no tienes cuadernos ni juegos.';

  const folderClass = (active: boolean) =>
    `inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-sm ${
      active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setSelectedFolderId(null); setQuickFilter('created_by_me'); }}
          className={folderClass(!selectedFolder && quickFilter === 'created_by_me')}
        >
          Míos
        </button>
        <button
          type="button"
          onClick={() => { setSelectedFolderId(null); setQuickFilter('favorites'); }}
          className={folderClass(!selectedFolder && quickFilter === 'favorites')}
        >
          Favoritos
        </button>
        {userFolders.map(folder => {
          const selected = selectedFolder?.id === folder.id;
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                setSelectedFolderId(selected ? null : folder.id);
                if (selected) setQuickFilter('created_by_me');
              }}
              onContextMenu={event => openFolderEditor(event, folder.id, folder.name, folder.color)}
              className={folderClass(selected)}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color || '#6366f1' }} />
              {folder.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setIsAddingFolder(open => !open)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-sm text-zinc-500 hover:text-zinc-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva carpeta
        </button>
        {selectedFolder && (
          <button
            type="button"
            onClick={handleDeleteFolder}
            className="px-2.5 py-1 text-sm text-zinc-500 hover:text-rose-400"
          >
            Eliminar carpeta
          </button>
        )}
      </div>

      {isAddingFolder && (
        <form onSubmit={handleCreateFolder} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={event => setNewFolderName(event.target.value)}
            placeholder="Nombre de la carpeta"
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            autoFocus
          />
          <div className="flex items-center gap-1.5">
            {FOLDER_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewFolderColor(color)}
                style={{ backgroundColor: color }}
                className={`w-4 h-4 rounded-full ${newFolderColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''}`}
                aria-label="Color de la carpeta"
              />
            ))}
          </div>
          <button type="submit" className="px-3 py-1.5 text-sm font-semibold text-zinc-100">
            Guardar
          </button>
          <button type="button" onClick={() => setIsAddingFolder(false)} className="px-2 py-1.5 text-sm text-zinc-500">
            Cancelar
          </button>
        </form>
      )}

      {editingFolder && menuPoint && (
        <>
          <button
            type="button"
            aria-label="Cerrar edición"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => { setEditingFolderId(null); setMenuPoint(null); }}
          />
          <form
          onSubmit={saveFolderEdits}
          className="fixed z-50 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl space-y-3"
          style={{ left: menuPoint.x, top: menuPoint.y }}
          onMouseDown={event => event.stopPropagation()}
        >
          <p className="text-xs font-semibold text-zinc-300">Editar carpeta</p>
          <input
            type="text"
            value={editName}
            onChange={event => setEditName(event.target.value)}
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            aria-label="Nombre de la carpeta"
            autoFocus
          />
          <div className="flex items-center gap-1.5">
            {FOLDER_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setEditColor(color)}
                style={{ backgroundColor: color }}
                className={`w-4 h-4 rounded-full ${editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
                aria-label="Color de la carpeta"
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setEditingFolderId(null); setMenuPoint(null); }}
              className="px-2.5 py-1.5 text-xs text-zinc-400"
            >
              Cancelar
            </button>
            <button type="submit" className="px-2.5 py-1.5 text-xs font-semibold text-zinc-100">
              Guardar
            </button>
          </div>
        </form>
        </>
      )}

      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map(card => (
            <ClassroomCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-zinc-500">{emptyMessage}</p>
      )}
    </div>
  );
};
