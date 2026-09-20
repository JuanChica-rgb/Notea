import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from '../common/WhatsAppAvatar';
import { InteractiveBlockPlayer } from '../editor/blocks/InteractiveBlockPlayer';
import { 
  Users, 
  Swords, 
  Copy, 
  Check, 
  Share2, 
  ArrowLeft, 
  Zap, 
  Trophy, 
  Flame, 
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Opponent {
  id: string;
  username: string;
  fullName: string;
  university: string;
  career: string;
  rpPoints: number;
  avatarUrl?: string;
  isIncognito?: boolean;
}

export const MultiplayerLobbyView: React.FC = () => {
  const { 
    user, 
    cards, 
    activeCardId, 
    setCurrentView, 
    updateUserRP, 
    showToast 
  } = useApp();

  const [mode, setMode] = useState<'lobby' | 'searching' | 'battle' | 'result'>('lobby');
  const [roomCode, setRoomCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  });
  const [copied, setCopied] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>(activeCardId || cards[0]?.id || '');
  const [inputJoinCode, setInputJoinCode] = useState('');

  // Matched opponent
  const [opponent, setOpponent] = useState<Opponent | null>(null);

  // Battle State
  const [playerProgress, setPlayerProgress] = useState(0); // 0 to 100%
  const [opponentProgress, setOpponentProgress] = useState(0); // 0 to 100%
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [matchWinner, setMatchWinner] = useState<'player' | 'opponent' | null>(null);

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];
  const blocks = selectedCard?.blocks || [];

  // Matchmaking simulation
  const handleStartQuickMatch = () => {
    setMode('searching');

    // Simulate searching peer from same university or career
    setTimeout(() => {
      const mockOpponents: Opponent[] = [
        {
          id: 'opp_1',
          username: 'valeria_m',
          fullName: 'Valeria Mendoza',
          university: user.university,
          career: user.career,
          rpPoints: user.rpPoints + 15,
          avatarUrl: ''
        },
        {
          id: 'opp_2',
          username: 'diego_tec',
          fullName: 'Diego R.',
          university: user.university,
          career: user.career,
          rpPoints: Math.max(100, user.rpPoints - 20),
          avatarUrl: ''
        },
        {
          id: 'opp_3',
          username: 'sofia_p',
          fullName: 'Sofía Pardo',
          university: user.university,
          career: user.career,
          rpPoints: user.rpPoints + 45,
          avatarUrl: ''
        }
      ];

      const chosen = mockOpponents[Math.floor(Math.random() * mockOpponents.length)];
      setOpponent(chosen);
      setMode('battle');
      setPlayerProgress(0);
      setOpponentProgress(0);
      setCurrentBlockIndex(0);
      setMatchWinner(null);
    }, 2200);
  };

  // Bot opponent progression loop during battle
  useEffect(() => {
    if (mode !== 'battle' || matchWinner !== null) return;

    const interval = setInterval(() => {
      setOpponentProgress(prev => {
        const increment = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(100, prev + increment);
        if (next >= 100 && matchWinner === null) {
          handleFinishMatch('opponent');
        }
        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [mode, matchWinner]);

  const handlePlayerBlockComplete = (isCorrect: boolean) => {
    if (matchWinner) return;

    const total = blocks.length || 1;
    const progressPerBlock = 100 / total;
    const nextProg = Math.min(100, Math.round(playerProgress + progressPerBlock));
    setPlayerProgress(nextProg);

    if (currentBlockIndex + 1 < blocks.length) {
      setCurrentBlockIndex(prev => prev + 1);
    } else {
      // Player reached finish line!
      handleFinishMatch('player');
    }
  };

  const handleFinishMatch = (winner: 'player' | 'opponent') => {
    setMatchWinner(winner);
    setMode('result');

    if (winner === 'player') {
      const rpGain = 25;
      updateUserRP(rpGain);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      showToast(`¡Victoria épica! Ganaste +${rpGain} RP de Liga`);
    } else {
      const rpLoss = -8;
      updateUserRP(rpLoss);
      showToast(`Derrota. Perdiste 8 RP`);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`https://notea.app/sala/${roomCode}`);
    setCopied(true);
    showToast(`Enlace de sala copiado: notea.app/sala/${roomCode}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputJoinCode.trim().length !== 4) {
      showToast('El código de sala debe tener exactamente 4 caracteres.');
      return;
    }
    setRoomCode(inputJoinCode.trim().toUpperCase());
    handleStartQuickMatch();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentView('library')}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Biblioteca
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
          <Swords className="w-4 h-4" />
          Duelo Multijugador 1v1
        </span>
      </div>

      {/* 1. LOBBY VIEW */}
      {mode === 'lobby' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Salas y Duelos de Ráfaga
              </span>
              <h1 className="text-2xl font-bold font-display text-zinc-100 mt-1">
                Desafía a tus Compañeros
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                Compite en tiempo real. Resuelve los bloques antes que tu oponente para ganar puntos de liga Elo y ascender en el ranking de tu universidad.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartQuickMatch}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 flex items-center gap-2 transition-all flex-shrink-0"
            >
              <Zap className="w-4 h-4" />
              Emparejamiento Rápido (Matchmaking)
            </button>
          </div>

          {/* Select Content for Match */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              1. Selecciona el Cuaderno o Juego para el Duelo:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cards.map(c => {
                const isSelected = selectedCardId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCardId(c.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{c.accessCode}</span>
                    <h4 className="text-xs font-bold text-zinc-200 truncate mt-0.5">{c.title}</h4>
                    <span className="text-[10px] text-zinc-400 block mt-1">{c.subjectName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Room or Join Room Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room Box */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-zinc-100">Crear Sala Privada</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Comparte este código de 4 caracteres o enlace directo con un amigo para que entre a tu sala.
              </p>

              {/* 4-character code display */}
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Código de Sala</span>
                  <span className="text-3xl font-black font-mono tracking-widest text-indigo-400">
                    {roomCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyRoomLink}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '¡Copiado!' : 'Copiar Enlace'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleStartQuickMatch}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
              >
                Abrir Sala y Esperar Rival
              </button>
            </div>

            {/* Join by Code Box */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-100">Unirse a una Sala</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Si tu compañero te dio un código de 4 caracteres, ingrésalo para retarlo de inmediato:
              </p>

              <form onSubmit={handleJoinWithCode} className="space-y-3">
                <input
                  type="text"
                  maxLength={4}
                  value={inputJoinCode}
                  onChange={e => setInputJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ej: 7K2M"
                  className="w-full text-center py-3 text-2xl font-black font-mono tracking-widest bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  Entrar a la Sala
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEARCHING / MATCHMAKING SPINNER */}
      {mode === 'searching' && (
        <div className="py-20 text-center space-y-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold font-display text-zinc-100">
            Buscando rival en {user.university.split(' ')[0]}...
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Emparejando con estudiantes de {user.career} con rango de RP similar.
          </p>
          <button
            type="button"
            onClick={() => setMode('lobby')}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Cancelar Búsqueda
          </button>
        </div>
      )}

      {/* 3. LIVE BATTLE VIEW WITH REAL-TIME PROGRESS TRACK */}
      {mode === 'battle' && opponent && (
        <div className="space-y-6">
          {/* REAL-TIME PROGRESS BAR TRACK */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-purple-400" />
                Duelo en Vivo • {selectedCard?.title}
              </span>
              <span className="font-mono text-indigo-400 font-bold">
                Pregunta {currentBlockIndex + 1} de {blocks.length}
              </span>
            </div>

            {/* Race Track */}
            <div className="space-y-4 pt-2">
              {/* Player 1 (You) Track */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 font-semibold text-indigo-300">
                    <WhatsAppAvatar url={user.avatarUrl} size="sm" isIncognito={user.isIncognito} />
                    <span>Tú (@{user.username})</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-400">{playerProgress}%</span>
                </div>
                <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    style={{ width: `${playerProgress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 relative"
                  />
                </div>
              </div>

              {/* Player 2 (Opponent) Track */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 font-semibold text-rose-300">
                    <WhatsAppAvatar url={opponent.avatarUrl} size="sm" isIncognito={opponent.isIncognito} />
                    <span>Rival (@{opponent.username}) • {opponent.rpPoints} RP</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400">{opponentProgress}%</span>
                </div>
                <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    style={{ width: `${opponentProgress}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Battle Block to Solve */}
          {blocks[currentBlockIndex] ? (
            <div className="space-y-4">
              <InteractiveBlockPlayer
                block={blocks[currentBlockIndex]}
                onComplete={handlePlayerBlockComplete}
                isGameMode={true}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              Cargando siguiente bloque...
            </div>
          )}
        </div>
      )}

      {/* 4. RESULT SCREEN (ELO RP GAIN/LOSS) */}
      {mode === 'result' && opponent && (
        <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
            matchWinner === 'player' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10' 
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/10'
          }`}>
            {matchWinner === 'player' ? <Trophy className="w-10 h-10" /> : <Swords className="w-10 h-10" />}
          </div>

          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              matchWinner === 'player' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {matchWinner === 'player' ? '¡VICTORIA ÉPICA!' : 'DERROTA AJUSTADA'}
            </span>
            <h2 className="text-3xl font-bold font-display text-zinc-100 mt-1">
              {matchWinner === 'player' ? 'Dominaste el Duelo' : 'Tu rival completó primero'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              {matchWinner === 'player'
                ? `Superaste a @${opponent.username} en la carrera por dominar ${selectedCard?.title}.`
                : `@${opponent.username} resolvió más rápido. ¡Vuelve a retarlo para recuperar tus RP!`}
            </p>
          </div>

          {/* Elo Adjustment Display */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs mx-auto space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Ajuste de Liga Elo:</span>
            <div className="text-3xl font-black font-mono">
              {matchWinner === 'player' ? (
                <span className="text-emerald-400">+25 RP</span>
              ) : (
                <span className="text-rose-400">-8 RP</span>
              )}
            </div>
            <span className="text-[11px] text-zinc-500 block">
              Puntos actuales: <strong className="text-zinc-200">{user.rpPoints} RP</strong>
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartQuickMatch}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
            >
              Revancha Inmediata
            </button>
            <button
              type="button"
              onClick={() => setMode('lobby')}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Volver al Lobby
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('rankings')}
              className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Ver Tabla de Clasificación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
