import React from 'react';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from '../common/WhatsAppAvatar';
import { 
  User, 
  Lock, 
  Unlock, 
  Mail, 
  Building, 
  GraduationCap, 
  BookOpen, 
  Flame, 
  Trophy, 
  Calendar,
  Shield,
  ArrowLeft,
  LogIn
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { user, toggleIncognito, setCurrentView, setIsAuthModalOpen, showToast } = useApp();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentView('library')}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Biblioteca
        </button>

        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <LogIn className="w-3.5 h-3.5" />
          Cambiar de Cuenta / Registro
        </button>
      </div>

      {/* Profile Card */}
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <WhatsAppAvatar
              url={user.avatarUrl}
              size="lg"
              isIncognito={user.isIncognito}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-zinc-100">
                  {user.fullName}
                </h1>
                {user.isIncognito && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Incógnito
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-indigo-400">@{user.username}</p>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-zinc-500" />
                {user.email}
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center min-w-[80px]">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Puntos RP</span>
              <span className="text-lg font-black font-mono text-amber-400 block">{user.rpPoints}</span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center min-w-[80px]">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Racha</span>
              <span className="text-lg font-black font-mono text-orange-400 block flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 fill-orange-400" />
                {user.streakDays}d
              </span>
            </div>
          </div>
        </div>

        {/* PRIVACY / INCOGNITO TOGGLE */}
        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100">
                Modo Privado / Incógnito
              </span>
              <span className="text-xs text-purple-400">
                {user.isIncognito ? '(Activado)' : '(Desactivado)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Si está activo, tu apodo se ocultará en los rankings globales mostrándote como <strong>"Usuario Anónimo"</strong> para proteger tu privacidad.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleIncognito}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
              user.isIncognito
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {user.isIncognito ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {user.isIncognito ? 'Incógnito Activo' : 'Activar Modo Privado'}
          </button>
        </div>

        {/* ACADEMIC DETAILS */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Ubicación Académica Oficial
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
                <Building className="w-3 h-3 text-indigo-400" />
                Universidad
              </span>
              <p className="text-xs font-bold text-zinc-200 mt-0.5">{user.university}</p>
            </div>

            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-indigo-400" />
                Carrera
              </span>
              <p className="text-xs font-bold text-zinc-200 mt-0.5">{user.career}</p>
            </div>

            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Semestre en Curso
              </span>
              <p className="text-xs font-bold text-zinc-200 mt-0.5">{user.currentSemester}.° Semestre</p>
            </div>

            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" />
                Estado del Avatar
              </span>
              <p className="text-xs font-bold text-zinc-200 mt-0.5">Silueta WhatsApp Segura (Por Defecto)</p>
            </div>
          </div>
        </div>

        {/* ENROLLED SUBJECTS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Materias Cursadas Activas
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.enrolledSubjects.map((sub, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
