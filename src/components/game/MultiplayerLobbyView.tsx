import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../lib/firebase';
import { WhatsAppAvatar } from '../common/WhatsAppAvatar';
import { InteractiveBlockPlayer } from '../editor/blocks/InteractiveBlockPlayer';
import {
  Swords,
  ArrowLeft,
  Trophy,
  Loader2,
  Crown,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getActivityMaxPoints, withConsistentBlockTimes } from '../../utils/scoring';
import { rememberPractice } from '../../lib/review';
import { isPracticeBlock } from '../../utils/review';
import {
  MIN_ROOM_PLAYERS,
  playerProgressPercent,
  rankRoomPlayers,
  roomPlayerList,
} from '../../utils/roomMatch';

const TRACK_COLORS = [
  'from-indigo-500 to-purple-500',
  'from-rose-500 to-amber-500',
  'from-emerald-500 to-cyan-500',
  'from-sky-500 to-blue-500',
  'from-fuchsia-500 to-pink-500',
];

export const MultiplayerLobbyView: React.FC = () => {
  const {
    user,
    cards,
    setCurrentView,
    activeRoom,
    startRoom,
    updateRoomProgress,
    leaveRoom,
  } = useApp();

  const [busy, setBusy] = useState(false);
  const [validatedResult, setValidatedResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const lastResultRef = useRef<{ isCorrect: boolean; points: number } | null>(null);
  const [celebratedRoom, setCelebratedRoom] = useState<string | null>(null);

  const myId = auth.currentUser?.uid || user.id;
  const selectedCard = cards.find(card => card.id === activeRoom?.gameId) || cards[0];
  const blocks = withConsistentBlockTimes(selectedCard?.blocks || []);
  const players = roomPlayerList(activeRoom);
  const me = activeRoom?.players?.[myId];
  const ranked = rankRoomPlayers(players);
  const myBlockIndex = me?.currentBlockIndex || 0;
  const currentBlock = blocks[myBlockIndex];
  const maxPoints = getActivityMaxPoints(blocks, true);
  const handleLeave = async () => {
    await leaveRoom();
    setValidatedResult(null);
    setCurrentView('courses');
  };

  const handleStart = async () => {
    setBusy(true);
    await startRoom();
    setBusy(false);
  };

  const handlePlayerBlockComplete = (isCorrect: boolean, points = 0) => {
    if (activeRoom?.state !== 'playing' || me?.finished) return;
    const result = { isCorrect, points };
    lastResultRef.current = result;
    setValidatedResult(result);
  };

  const handleNextPlayerBlock = () => {
    if (!activeRoom || me?.finished) return;
    const result = lastResultRef.current || validatedResult;
    if (!result) return;
    if (!user.isGuest && currentBlock && selectedCard && isPracticeBlock(currentBlock)) {
      void rememberPractice({
        cardId: selectedCard.id,
        blockId: currentBlock.id,
        subjectName: selectedCard.subjectName,
        correct: result.isCorrect,
        username: user.username,
        fullName: user.fullName,
        isIncognito: user.isIncognito,
      }).catch(() => undefined);
    }
    const nextScore = (me?.score || 0) + result.points;
    const nextIndex = myBlockIndex + 1;
    const finished = nextIndex >= blocks.length;
    lastResultRef.current = null;
    setValidatedResult(null);
    void updateRoomProgress(nextScore, nextIndex, finished);
  };

  useEffect(() => {
    if (activeRoom?.state !== 'finished' || celebratedRoom === activeRoom.roomCode) return;
    const winner = rankRoomPlayers(roomPlayerList(activeRoom))[0];
    if (winner?.id === myId) {
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
    }
    setCelebratedRoom(activeRoom.roomCode);
  }, [activeRoom, celebratedRoom, myId]);

  const screen = !activeRoom
    ? 'menu'
    : activeRoom.state === 'lobby'
      ? 'waiting'
      : activeRoom.state === 'playing'
        ? (me?.finished ? 'waitingOthers' : 'battle')
        : 'result';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { void handleLeave(); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          {activeRoom ? 'Salir' : 'Volver al curso'}
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
          <Swords className="w-4 h-4" />
          Juego del curso
        </span>
      </div>

      {screen === 'menu' && (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-2">
          <h1 className="text-xl font-bold text-zinc-100">Esta partida se abre desde el curso</h1>
          <p className="text-sm text-zinc-400">Un admin publica el juego en el muro. Entras desde ahí mientras el tiempo siga abierto.</p>
        </div>
      )}

      {(screen === 'waiting' || screen === 'waitingOthers') && activeRoom && (
        <div className="space-y-6">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  {screen === 'waitingOthers' ? 'Esperando al resto' : 'Sala abierta'}
                </span>
                <h2 className="text-xl font-bold text-zinc-100 mt-1">{activeRoom.gameTitle}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {screen === 'waitingOthers'
                    ? 'Ya terminaste. El podio aparece cuando todos terminen.'
                    : `Jugadores ${players.length} / ${activeRoom.maxPlayers}. El anfitrión inicia cuando haya al menos ${MIN_ROOM_PLAYERS}.`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <WhatsAppAvatar url={player.avatarUrl} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-zinc-100">
                      @{player.username}
                      {player.id === myId ? ' · Tú' : ''}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {player.isHost ? 'Anfitrión' : 'Jugador'}
                      {screen === 'waitingOthers' ? ` · ${player.score} pts` : ''}
                    </p>
                  </div>
                </div>
                {player.finished ? (
                  <span className="text-[10px] font-bold text-emerald-400">Listo</span>
                ) : (
                  <span className="text-[10px] font-bold text-zinc-500">{index + 1}</span>
                )}
              </div>
            ))}
          </div>

          {screen === 'waiting' && activeRoom.hostId === myId && (
            <button
              type="button"
              disabled={busy || players.length < MIN_ROOM_PLAYERS}
              onClick={() => void handleStart()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-50 text-white font-bold text-sm"
            >
              {players.length < MIN_ROOM_PLAYERS ? `Esperando a alguien del curso (${players.length}/${MIN_ROOM_PLAYERS})` : 'Iniciar partida'}
            </button>
          )}
          {screen === 'waiting' && activeRoom.hostId !== myId && (
            <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Esperando a que el anfitrión inicie la partida…
            </div>
          )}
        </div>
      )}

      {screen === 'battle' && activeRoom && currentBlock && (
        <div className="space-y-6">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-purple-400" />
                En vivo · {activeRoom.gameTitle}
              </span>
              <span className="font-mono text-indigo-400 font-bold">
                Bloque {Math.min(myBlockIndex + 1, blocks.length)} de {blocks.length}
              </span>
            </div>
            <div className="space-y-4 pt-2">
              {players.map((player, index) => {
                const percent = playerProgressPercent(player, activeRoom.totalBlocks || blocks.length);
                return (
                  <div key={player.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 font-semibold text-zinc-200">
                        <WhatsAppAvatar url={player.avatarUrl} size="sm" />
                        <span>@{player.username}{player.id === myId ? ' · Tú' : ''}</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-300">{player.score} pts · {percent}%</span>
                    </div>
                    <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full bg-gradient-to-r ${TRACK_COLORS[index % TRACK_COLORS.length]} rounded-full transition-all duration-300`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <InteractiveBlockPlayer
            key={currentBlock.id}
            block={currentBlock}
            onComplete={handlePlayerBlockComplete}
            onNext={handleNextPlayerBlock}
            nextLabel={myBlockIndex + 1 < blocks.length ? 'Siguiente bloque' : 'Terminé'}
            isGameMode={true}
          />
        </div>
      )}

      {screen === 'battle' && activeRoom && !currentBlock && (
        <div className="text-center py-8 text-zinc-400 text-sm">
          Este juego no tiene bloques disponibles en tu biblioteca.
        </div>
      )}

      {screen === 'result' && activeRoom && (
        <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Trophy className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Resultado de esta sala
            </span>
            <h2 className="text-3xl font-bold font-display text-zinc-100 mt-1">
              {ranked.length <= 2
                ? ranked[0]?.id === myId
                  ? 'Ganaste esta partida'
                  : `Ganó @${ranked[0]?.username}`
                : 'Top temporal de la sala'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              Este podio es solo de esta sala. Tu precisión también queda en el ranking del curso, si el juego está publicado ahí.
            </p>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            {ranked.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-2xl border ${
                  index === 0
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="w-6 text-sm font-black font-mono text-zinc-400">{index + 1}</span>
                  {index === 0 && <Crown className="w-4 h-4 text-amber-300" />}
                  <WhatsAppAvatar url={player.avatarUrl} size="sm" />
                  <span className="text-xs font-bold text-zinc-100">
                    @{player.username}
                    {player.id === myId ? ' · Tú' : ''}
                  </span>
                </div>
                <span className="text-sm font-black font-mono text-indigo-300">{player.score}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-zinc-500">
            Máximo posible en este juego: {maxPoints} pts
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleLeave()}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir al lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
