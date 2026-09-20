import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Swords, Trophy, Users, Calendar, Clock, Award, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Tournament {
  id: string;
  title: string;
  subject: string;
  division: string;
  participantsCount: number;
  maxParticipants: number;
  prizeRP: number;
  startsIn: string;
  status: 'open' | 'in_progress' | 'completed';
}

export const TournamentsView: React.FC = () => {
  const { user, updateUserRP, showToast } = useApp();

  const [registeredIds, setRegisteredIds] = useState<string[]>(['trn_1']);

  const tournaments: Tournament[] = [
    {
      id: 'trn_1',
      title: 'Torneo Interuniversitario de Cálculo Diferencial',
      subject: 'Cálculo Diferencial',
      division: 'División Oro / Platino',
      participantsCount: 28,
      maxParticipants: 32,
      prizeRP: 500,
      startsIn: 'Hoy a las 19:00',
      status: 'open'
    },
    {
      id: 'trn_2',
      title: 'Desafío Relámpago de Álgebra Lineal & Matrices',
      subject: 'Álgebra Lineal',
      division: 'Abierta a todos los semestres',
      participantsCount: 16,
      maxParticipants: 16,
      prizeRP: 350,
      startsIn: 'En curso',
      status: 'in_progress'
    },
    {
      id: 'trn_3',
      title: 'Copa Universitaria de Algoritmos & Grafos',
      subject: 'Estructuras de Datos',
      division: 'Carreras de Ingeniería',
      participantsCount: 12,
      maxParticipants: 32,
      prizeRP: 600,
      startsIn: 'Mañana a las 18:00',
      status: 'open'
    }
  ];

  const handleRegister = (trn: Tournament) => {
    if (registeredIds.includes(trn.id)) {
      showToast('Ya estás registrado en este torneo.');
      return;
    }
    setRegisteredIds([...registeredIds, trn.id]);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    showToast(`¡Inscripción confirmada para "${trn.title}"!`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <Swords className="w-3.5 h-3.5" />
              Torneos & Desafíos Relámpago
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400">Bracket Competitivo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-zinc-100 mt-1">
            Competencias Académicas
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Inscríbete en brackets de eliminación directa por materias para ganar bolsas de Puntos de Liga (RP) y trofeos exclusivos.
          </p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400">Tus RP Actuales</span>
            <span className="text-lg font-black font-mono text-zinc-100 block">{user.rpPoints} RP</span>
          </div>
        </div>
      </div>

      {/* Tournaments List */}
      <div className="space-y-4">
        {tournaments.map(trn => {
          const isRegistered = registeredIds.includes(trn.id);

          return (
            <div
              key={trn.id}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-all shadow-lg"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold">
                    {trn.subject}
                  </span>
                  <span className="text-xs text-zinc-400">• {trn.division}</span>
                  {trn.status === 'in_progress' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold animate-pulse">
                      EN CURSO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {trn.startsIn}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold font-display text-zinc-100">
                  {trn.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    {trn.participantsCount} / {trn.maxParticipants} participantes
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Award className="w-3.5 h-3.5" />
                    Premio: +{trn.prizeRP} RP
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center">
                {isRegistered ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Inscripción Confirmada
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRegister(trn)}
                    disabled={trn.participantsCount >= trn.maxParticipants}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    {trn.participantsCount >= trn.maxParticipants ? 'Cupos Llenos' : 'Inscribirme Gratis'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
