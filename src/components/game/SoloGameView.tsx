import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { InteractiveBlockPlayer } from '../editor/blocks/InteractiveBlockPlayer';
import { ArrowLeft, Clock, Award, CheckCircle2, RotateCcw, Trophy, Sparkles, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SoloGameView: React.FC = () => {
  const { 
    activeCardId, 
    cards, 
    setCurrentView, 
    updateUserRP, 
    showToast 
  } = useApp();

  const card = cards.find(c => c.id === activeCardId) || cards[0];

  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<{ isCorrect: boolean; points: number }[]>([]);

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  const blocks = card?.blocks || [];
  const currentBlock = blocks[currentBlockIndex];

  const handleBlockComplete = (isCorrect: boolean, points: number) => {
    const updated = [...completedBlocks, { isCorrect, points }];
    setCompletedBlocks(updated);

    if (currentBlockIndex + 1 < blocks.length) {
      setCurrentBlockIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      const totalPoints = updated.reduce((acc, cur) => acc + cur.points, 0);
      const earnedRP = Math.max(20, Math.round(totalPoints / 4));

      updateUserRP(earnedRP);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
      showToast(`¡Ráfaga completada! Ganaste +${earnedRP} RP`);
    }
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRestart = () => {
    setCurrentBlockIndex(0);
    setSeconds(0);
    setIsFinished(false);
    setCompletedBlocks([]);
  };

  if (!card) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <p>No se encontró el juego seleccionado.</p>
        <button
          onClick={() => setCurrentView('library')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs"
        >
          Volver a la Biblioteca
        </button>
      </div>
    );
  }

  const accuracyPercent = completedBlocks.length > 0
    ? Math.round((completedBlocks.filter(b => b.isCorrect).length / completedBlocks.length) * 100)
    : 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <button
          type="button"
          onClick={() => setCurrentView('library')}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentView('multiplayer_lobby')}
            className="px-3 py-1 bg-purple-950/60 border border-purple-800/80 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-900/60 transition-colors flex items-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5" />
            Jugar en Duelo 1v1
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(seconds)}
          </div>
        </div>
      </div>

      {/* Game Banner Header */}
      <div className="p-4 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
            Juego Ráfaga • {card.subjectName}
          </span>
          <h1 className="text-xl font-bold font-display text-zinc-100 mt-0.5">
            {card.title}
          </h1>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-1 bg-zinc-800 rounded-lg text-zinc-300">
          {card.accessCode}
        </span>
      </div>

      {/* Active Game Block or Finished Screen */}
      {!isFinished && currentBlock ? (
        <div className="space-y-4">
          <InteractiveBlockPlayer
            block={currentBlock}
            onComplete={handleBlockComplete}
            isGameMode={true}
          />
        </div>
      ) : (
        /* Final Statistics Screen */
        <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              ¡Desafío de Ráfaga Superado!
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-zinc-100 mt-1">
              Puntaje Registrado en la Liga
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
              Tu tiempo y precisión han sido evaluados y sumados a tus Puntos de Liga (RP).
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {/* Time employed */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Tiempo Total
              </span>
              <span className="text-2xl font-black font-mono text-zinc-100 mt-1 block">
                {formatTime(seconds)}
              </span>
            </div>

            {/* Precision Accuracy */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Precisión
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                {accuracyPercent}%
              </span>
            </div>

            {/* RP Points Earned */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Puntos Ganados
              </span>
              <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
                +{Math.max(20, Math.round((completedBlocks.length * 12)))} RP
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reintentar Ráfaga
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('rankings')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              Ver Clasificación
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('multiplayer_lobby')}
              className="px-5 py-2.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/80 text-purple-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Swords className="w-3.5 h-3.5" />
              Retar en Duelo 1v1
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
