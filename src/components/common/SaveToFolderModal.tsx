import React, { useMemo, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../lib/firebase';

interface SaveToFolderModalProps {
  cardId: string;
  onClose: () => void;
}

export const SaveToFolderModal: React.FC<SaveToFolderModalProps> = ({ cardId, onClose }) => {
  const { folders, cards, assignCardToFolder, user } = useApp();
  const ownerId = auth.currentUser?.uid || user.id;
  const card = cards.find(item => item.id === cardId);
  const [choice, setChoice] = useState(card?.folderId || '');

  const userFolders = useMemo(
    () => folders.filter(folder => !folder.ownerId || folder.ownerId === ownerId),
    [folders, ownerId]
  );

  const save = async () => {
    await assignCardToFolder(cardId, choice || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            Guardar en carpeta
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-400">Elige una de tus carpetas para vincular este contenido.</p>
        {userFolders.length > 0 ? (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => setChoice('')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs border ${!choice ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
            >
              Sin carpeta
            </button>
            {userFolders.map(folder => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setChoice(folder.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs border ${choice === folder.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
              >
                {folder.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Crea una carpeta en Mi Biblioteca para organizar este contenido.</p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void save()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
          >
            Guardar en carpeta
          </button>
        </div>
      </div>
    </div>
  );
};
