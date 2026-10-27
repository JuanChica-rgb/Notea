import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { 
  LogOut,
  Menu,
} from 'lucide-react';

export const Header: React.FC<{ onToggleNav: () => void }> = ({ onToggleNav }) => {
  const { 
    user, 
    setCurrentView, 
    openUserProfile,
    signOutUser,
    openAuthModal,
    authReady,
  } = useApp();
  const guest = authReady && user.isGuest;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 transition-colors">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleNav}
            className="p-2 rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentView(guest ? 'subject_detail' : 'library')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black font-display text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              N
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-xl tracking-tight text-zinc-100 group-hover:text-indigo-400 transition-colors">
                Notea
              </span>
              <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase -mt-1 hidden sm:block">
                Cursos y material
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {guest && (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-100 text-sm font-bold rounded-xl"
            >
              Iniciar sesión
            </button>
          )}

          {!guest && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(prev => !prev)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-800 transition-colors hidden sm:flex items-center gap-1 text-xs"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
              {showLogoutConfirm && (
                <div className="absolute right-0 top-11 z-40 w-52 p-3 bg-zinc-900 border border-rose-500/40 rounded-xl shadow-2xl">
                  <p className="text-xs font-semibold text-rose-300">¿Cerrar sesión?</p>
                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => setShowLogoutConfirm(false)} className="px-2.5 py-1.5 text-[11px] text-zinc-300 bg-zinc-800 rounded-lg">No</button>
                    <button type="button" onClick={() => { setShowLogoutConfirm(false); void signOutUser(); }} className="px-2.5 py-1.5 text-[11px] text-white bg-rose-600 rounded-lg">Sí, salir</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!guest && (
          <button
            type="button"
            onClick={openUserProfile}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-900 transition-colors text-left group"
          >
            <WhatsAppAvatar url={user.avatarUrl} size="sm" />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                {user.fullName || `@${user.username}`}
              </span>
              <span className="text-xs text-zinc-400 max-w-[10rem] truncate">
                {user.university.split(' ')[0]}
              </span>
            </div>
          </button>
          )}
        </div>
      </div>
    </header>
  );
};
