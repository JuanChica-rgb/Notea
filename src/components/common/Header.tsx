import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { 
  Flame, 
  Trophy, 
  BookOpen, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Search, 
  Compass, 
  Swords, 
  Lock, 
  LogIn
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    user, 
    isDarkMode, 
    toggleDarkMode, 
    currentView, 
    setCurrentView, 
    cards, 
    setActiveCardId, 
    pendingRequests,
    setIsAuthModalOpen,
    showToast
  } = useApp();

  const [searchCode, setSearchCode] = useState('');

  const pendingCount = pendingRequests.filter(r => r.status === 'pending').length;

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toUpperCase();
    if (!query) return;

    // Check if it's a 6-character card code e.g. CALC-92 or ARBL-42
    const foundCard = cards.find(c => c.accessCode.toUpperCase() === query);
    if (foundCard) {
      setActiveCardId(foundCard.id);
      if (foundCard.contentType === 'material') {
        setCurrentView('study');
      } else {
        setCurrentView('solo_game');
      }
      showToast(`¡Código encontrado! Abriendo "${foundCard.title}"`);
      setSearchCode('');
      return;
    }

    // If query matches a room code (4 characters) or general search
    if (query.length === 4) {
      setCurrentView('multiplayer_lobby');
      showToast(`Buscando sala privada con código: ${query}`);
      setSearchCode('');
      return;
    }

    // Otherwise search cards by title or subject
    const matches = cards.filter(c => 
      c.title.toLowerCase().includes(query.toLowerCase()) || 
      c.subjectName.toLowerCase().includes(query.toLowerCase())
    );
    if (matches.length > 0) {
      setActiveCardId(matches[0].id);
      setCurrentView(matches[0].contentType === 'material' ? 'study' : 'solo_game');
      showToast(`Abriendo resultado más relevante: "${matches[0].title}"`);
      setSearchCode('');
    } else {
      showToast(`No se encontró ningún contenido con el código o término "${query}".`);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setCurrentView('library')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black font-display text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              N
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-xl tracking-tight text-zinc-100 group-hover:text-indigo-400 transition-colors">
                Notea
              </span>
              <span className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase -mt-1 hidden sm:block">
                Microaprendizaje & Juegos
              </span>
            </div>
          </button>

          {/* Nav Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentView('library')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'library'
                  ? 'bg-zinc-800 text-indigo-400 border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Mi Biblioteca
            </button>

            <button
              onClick={() => setCurrentView('subject_detail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'subject_detail'
                  ? 'bg-zinc-800 text-indigo-400 border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Por Materia
            </button>

            <button
              onClick={() => setCurrentView('rankings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'rankings'
                  ? 'bg-zinc-800 text-indigo-400 border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Rankings
            </button>

            <button
              onClick={() => setCurrentView('tournaments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'tournaments'
                  ? 'bg-zinc-800 text-indigo-400 border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              Torneos
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'admin'
                  ? 'bg-zinc-800 text-amber-400 border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Search Bar / Quick Code Lookup */}
        <div className="flex-1 max-w-xs hidden lg:block">
          <form onSubmit={handleQuickSearch} className="relative">
            <input
              type="text"
              value={searchCode}
              onChange={e => setSearchCode(e.target.value)}
              placeholder="Código rápido (ej. CALC-92 o 7K2M)..."
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* Right Section: RP Points, Streak, Incognito, Theme, Profile */}
        <div className="flex items-center gap-2.5">
          {/* League RP Points */}
          <div 
            onClick={() => setCurrentView('rankings')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors"
            title="Puntos de Liga (RP) acumulados"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-zinc-200 font-mono">{user.rpPoints}</span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">RP</span>
          </div>

          {/* Daily Streak */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-orange-400"
            title={`Racha activa de ${user.streakDays} días consecutivos`}
          >
            <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
            <span className="font-mono">{user.streakDays}</span>
          </div>

          {/* Incognito indicator if active */}
          {user.isIncognito && (
            <div 
              onClick={() => setCurrentView('profile')}
              className="px-2 py-1 bg-purple-950/60 border border-purple-800/80 rounded-xl text-purple-300 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              title="Modo Incógnito activo: tu apodo está oculto en rankings públicos"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Incógnito</span>
            </div>
          )}

          {/* Native Theme Switcher (Modo Oscuro / Claro) */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Switch/Register Account button for demonstration */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-indigo-400 hover:border-zinc-700 transition-colors hidden sm:flex items-center gap-1 text-xs"
            title="Abrir formulario de registro / cambiar usuario"
          >
            <LogIn className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Avatar */}
          <button
            type="button"
            onClick={() => setCurrentView('profile')}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-900 transition-colors text-left group"
          >
            <WhatsAppAvatar url={user.avatarUrl} size="sm" isIncognito={user.isIncognito} />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                {user.isIncognito ? 'Anónimo' : `@${user.username}`}
              </span>
              <span className="text-[10px] text-zinc-400 max-w-[100px] truncate">
                {user.university.split(' ')[0]}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-800/60 py-2 px-2 text-xs bg-zinc-950">
        <button
          onClick={() => setCurrentView('library')}
          className={`flex flex-col items-center gap-0.5 ${currentView === 'library' ? 'text-indigo-400' : 'text-zinc-400'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Biblioteca</span>
        </button>
        <button
          onClick={() => setCurrentView('subject_detail')}
          className={`flex flex-col items-center gap-0.5 ${currentView === 'subject_detail' ? 'text-indigo-400' : 'text-zinc-400'}`}
        >
          <Compass className="w-4 h-4" />
          <span>Materias</span>
        </button>
        <button
          onClick={() => setCurrentView('rankings')}
          className={`flex flex-col items-center gap-0.5 ${currentView === 'rankings' ? 'text-indigo-400' : 'text-zinc-400'}`}
        >
          <Trophy className="w-4 h-4" />
          <span>Rankings</span>
        </button>
        <button
          onClick={() => setCurrentView('tournaments')}
          className={`flex flex-col items-center gap-0.5 ${currentView === 'tournaments' ? 'text-indigo-400' : 'text-zinc-400'}`}
        >
          <Swords className="w-4 h-4" />
          <span>Torneos</span>
        </button>
        <button
          onClick={() => setCurrentView('admin')}
          className={`flex flex-col items-center gap-0.5 ${currentView === 'admin' ? 'text-amber-400' : 'text-zinc-400'}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};
