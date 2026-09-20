import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from '../common/WhatsAppAvatar';
import { Trophy, Flame, Medal, Award, Shield, User, Lock, Layers } from 'lucide-react';

export const RankingsView: React.FC = () => {
  const { user, cards } = useApp();

  type RankingTab = 'career' | 'university' | 'national' | 'game';
  const [activeTab, setActiveTab] = useState<RankingTab>('career');
  const [selectedGameCardId, setSelectedGameCardId] = useState<string>(cards[0]?.id || '');

  // Generate dynamic leaderboard list integrating the current user
  const getLeaderboardData = () => {
    // Current user entry
    const userEntry = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      university: user.university,
      career: user.career,
      rpPoints: user.rpPoints,
      streakDays: user.streakDays,
      isIncognito: user.isIncognito,
      avatarUrl: user.avatarUrl,
      isCurrentUser: true
    };

    let peers: typeof userEntry[] = [];

    if (activeTab === 'career') {
      peers = [
        {
          id: 'p1',
          username: 'santiago_dev',
          fullName: 'Santiago M.',
          university: user.university,
          career: user.career,
          rpPoints: Math.max(user.rpPoints + 120, 1420),
          streakDays: 14,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        {
          id: 'p2',
          username: 'valeria_alg',
          fullName: 'Valeria G.',
          university: user.university,
          career: user.career,
          rpPoints: Math.max(user.rpPoints + 45, 1250),
          streakDays: 9,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        userEntry,
        {
          id: 'p3',
          username: 'anonimo_99',
          fullName: 'Anónimo',
          university: user.university,
          career: user.career,
          rpPoints: Math.max(user.rpPoints - 80, 890),
          streakDays: 4,
          isIncognito: true,
          avatarUrl: '',
          isCurrentUser: false
        },
        {
          id: 'p4',
          username: 'carlos_m',
          fullName: 'Carlos Morales',
          university: user.university,
          career: user.career,
          rpPoints: Math.max(user.rpPoints - 160, 720),
          streakDays: 2,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        }
      ];
    } else if (activeTab === 'university') {
      peers = [
        {
          id: 'u1',
          username: 'med_lorena',
          fullName: 'Lorena H.',
          university: user.university,
          career: 'Medicina',
          rpPoints: 2150,
          streakDays: 28,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        {
          id: 'u2',
          username: 'derecho_mateo',
          fullName: 'Mateo R.',
          university: user.university,
          career: 'Derecho',
          rpPoints: 1890,
          streakDays: 19,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        userEntry,
        {
          id: 'u3',
          username: 'psi_camila',
          fullName: 'Camila T.',
          university: user.university,
          career: 'Psicología',
          rpPoints: 1050,
          streakDays: 5,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        {
          id: 'u4',
          username: 'anonimo_ing',
          fullName: 'Anónimo',
          university: user.university,
          career: 'Ingeniería Civil',
          rpPoints: 840,
          streakDays: 3,
          isIncognito: true,
          avatarUrl: '',
          isCurrentUser: false
        }
      ];
    } else if (activeTab === 'national') {
      peers = [
        {
          id: 'n1',
          username: 'lucas_pucp',
          fullName: 'Lucas V.',
          university: 'Pontificia Universidad Católica',
          career: 'Ciencias de la Computación',
          rpPoints: 3450,
          streakDays: 45,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        {
          id: 'n2',
          username: 'mariana_unal',
          fullName: 'Mariana Z.',
          university: 'Universidad Nacional',
          career: 'Ingeniería de Sistemas',
          rpPoints: 2980,
          streakDays: 31,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        {
          id: 'n3',
          username: 'fernando_itba',
          fullName: 'Fernando D.',
          university: 'ITBA',
          career: 'Bioingeniería',
          rpPoints: 2640,
          streakDays: 22,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        userEntry,
        {
          id: 'n4',
          username: 'paula_uam',
          fullName: 'Paula G.',
          university: 'UAM',
          career: 'Física Pura',
          rpPoints: 1120,
          streakDays: 7,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        }
      ];
    } else {
      // Specific Game Ranking
      peers = [
        {
          id: 'g1',
          username: 'speed_master',
          fullName: 'Álvaro S.',
          university: user.university,
          career: user.career,
          rpPoints: 990,
          streakDays: 12,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        },
        userEntry,
        {
          id: 'g2',
          username: 'diana_quiz',
          fullName: 'Diana K.',
          university: user.university,
          career: user.career,
          rpPoints: Math.max(100, user.rpPoints - 35),
          streakDays: 4,
          isIncognito: false,
          avatarUrl: '',
          isCurrentUser: false
        }
      ];
    }

    // Sort descending by RP
    return peers.sort((a, b) => b.rpPoints - a.rpPoints);
  };

  const leaderboard = getLeaderboardData();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-indigo-950/30 border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              Tablas de Clasificación Oficiales
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400">Liga Académica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-zinc-100 mt-1">
            Rankings y Cuadro de Honor
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Suma Puntos de Liga (RP) completando cuadernos, superando ráfagas y ganando duelos 1v1 en tiempo real.
          </p>
        </div>

        {/* User rank badge */}
        <div className="p-4 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl flex items-center gap-3 shadow-xl">
          <WhatsAppAvatar url={user.avatarUrl} size="md" isIncognito={user.isIncognito} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-100">
                {user.isIncognito ? 'Anónimo (Privado)' : `@${user.username}`}
              </span>
              {user.isIncognito && (
                <span title="Modo Incógnito activo">
                  <Lock className="w-3 h-3 text-purple-400" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
              <span className="font-bold text-amber-400 font-mono">{user.rpPoints} RP</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                <Flame className="w-3 h-3 fill-orange-400" />
                {user.streakDays}d
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Hierarchical Tabs: Carrera, Universidad, Nacional, Específico de Juego */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('career')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'career'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-4 h-4" />
          1. Ranking de Carrera
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('university')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'university'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          2. Ranking Universidad
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('national')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'national'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          3. Ranking Nacional
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('game')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'game'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          4. Récord por Juego
        </button>
      </div>

      {/* Game Selector when Tab 4 is selected */}
      {activeTab === 'game' && (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-zinc-300">
            Selecciona el juego o cuaderno para ver su tabla de récords:
          </span>
          <select
            value={selectedGameCardId}
            onChange={e => setSelectedGameCardId(e.target.value)}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
          >
            {cards.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.accessCode})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* LEADERBOARD TABLE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-3.5 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
          <div className="col-span-1 text-center">Pos</div>
          <div className="col-span-5 sm:col-span-6">Estudiante / Apodo</div>
          <div className="col-span-3 sm:col-span-3 text-right">Puntos de Liga (RP)</div>
          <div className="col-span-3 sm:col-span-2 text-right">Racha</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-zinc-800/60">
          {leaderboard.map((item, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const isGold = rank === 1;
            const isSilver = rank === 2;
            const isBronze = rank === 3;

            return (
              <div
                key={item.id}
                className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${
                  item.isCurrentUser
                    ? 'bg-indigo-950/30 border-l-4 border-indigo-500 hover:bg-indigo-950/40'
                    : 'hover:bg-zinc-800/40'
                }`}
              >
                {/* Position / Medal */}
                <div className="col-span-1 flex items-center justify-center font-bold">
                  {isGold && (
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black shadow-lg shadow-amber-500/20">
                      🥇
                    </span>
                  )}
                  {isSilver && (
                    <span className="w-7 h-7 rounded-full bg-zinc-300 text-black flex items-center justify-center text-xs font-black shadow-md">
                      🥈
                    </span>
                  )}
                  {isBronze && (
                    <span className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs font-black shadow-md">
                      🥉
                    </span>
                  )}
                  {!isTop3 && (
                    <span className="font-mono text-xs text-zinc-400">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Avatar & Username (or Anonymous) */}
                <div className="col-span-5 sm:col-span-6 flex items-center gap-3">
                  <WhatsAppAvatar
                    url={item.avatarUrl}
                    size="sm"
                    isIncognito={item.isIncognito}
                  />
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${
                        item.isCurrentUser ? 'text-indigo-300' : 'text-zinc-100'
                      }`}>
                        {item.isIncognito ? 'Usuario Anónimo' : `@${item.username}`}
                      </span>
                      {item.isCurrentUser && (
                        <span className="px-1.5 py-0.2 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-bold text-indigo-300 uppercase">
                          Tú
                        </span>
                      )}
                      {item.isIncognito && (
                        <span title="Oculto por Modo Incógnito">
                          <Lock className="w-3 h-3 text-purple-400" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate">
                      {item.isIncognito ? 'Institución Protegida' : `${item.career} • ${item.university.split(' ')[0]}`}
                    </span>
                  </div>
                </div>

                {/* RP Points */}
                <div className="col-span-3 sm:col-span-3 text-right">
                  <span className="font-mono font-bold text-xs sm:text-sm text-amber-400">
                    {item.rpPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1 font-semibold">RP</span>
                </div>

                {/* Active Streak */}
                <div className="col-span-3 sm:col-span-2 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-950/40 border border-orange-500/20 text-orange-400 text-xs font-bold font-mono">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    {item.streakDays}d
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
