import React from 'react';
import { BookOpen, Compass, GraduationCap, ShieldCheck, X } from 'lucide-react';
import { isNoteaAdmin, useApp, type AppView } from '../../context/AppContext';

const ITEMS: { view: AppView; label: string; icon: React.ReactNode }[] = [
  { view: 'library', label: 'Mi biblioteca', icon: <BookOpen className="w-4 h-4" /> },
  { view: 'subject_detail', label: 'Explorar', icon: <Compass className="w-4 h-4" /> },
  { view: 'courses', label: 'Mis cursos', icon: <GraduationCap className="w-4 h-4" /> },
];

export function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentView, setCurrentView, user, pendingRequests, directoryUsers, openAuthModal, authReady } = useApp();
  const isAdmin = isNoteaAdmin(user);
  const pendingCount = pendingRequests.filter(request => request.status === 'pending').length
    + directoryUsers.filter(person => person.educatorStatus === 'pending').length;

  const go = (view: AppView) => {
    if (authReady && user.isGuest && view === 'library') {
      openAuthModal('login');
      if (window.matchMedia('(max-width: 767px)').matches) onClose();
      return;
    }
    setCurrentView(view);
    if (window.matchMedia('(max-width: 767px)').matches) onClose();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 top-16 z-20 bg-black/50 md:hidden"
        />
      )}
      <aside
        aria-hidden={!open}
        inert={!open}
        className={`fixed top-16 bottom-0 left-0 z-20 w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Menú</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {ITEMS.filter(item => !authReady || !user.isGuest || item.view === 'library' || item.view === 'subject_detail').map(item => {
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => go(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-left transition-colors ${
                  active
                    ? 'bg-zinc-800 text-indigo-300'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              onClick={() => go('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-left transition-colors ${
                currentView === 'admin'
                  ? 'bg-zinc-800 text-amber-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
              {pendingCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
