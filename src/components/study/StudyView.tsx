import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { InteractiveBlockPlayer } from '../editor/blocks/InteractiveBlockPlayer';
import { ArrowLeft, Clock, Award, CheckCircle2, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getActivityMaxPoints } from '../../utils/scoring';
import { rememberPractice } from '../../lib/review';
import { isPracticeBlock } from '../../utils/review';

export const StudyView: React.FC = () => {
  const { 
    activeCardId, 
    cards, 
    user,
    setCurrentView, 
    showToast,
  } = useApp();

  const card = cards.find(c => c.id === activeCardId) || cards[0];

  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<{ isCorrect: boolean; points: number; maxPoints: number }[]>([]);
  const [validatedResult, setValidatedResult] = useState<{ isCorrect: boolean; points: number; maxPoints: number } | null>(null);

  // Stopwatch timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  const blocks = card?.blocks || [];
  const currentBlock = blocks[currentBlockIndex];

  const handleBlockComplete = (isCorrect: boolean, points: number, maxPoints = 0) => {
    if (validatedResult) return;
    setValidatedResult({ isCorrect, points, maxPoints });
  };

  const handleNextBlock = () => {
    const result = validatedResult ?? { isCorrect: true, points: 0, maxPoints: 0 };
    if (!user.isGuest && card && currentBlock && isPracticeBlock(currentBlock)) {
      void rememberPractice({
        cardId: card.id,
        blockId: currentBlock.id,
        subjectName: card.subjectName,
        correct: result.isCorrect,
        username: user.username,
        fullName: user.fullName,
        isIncognito: user.isIncognito,
      }).catch(() => undefined);
    }
    const updated = [...completedBlocks, result];
    setCompletedBlocks(updated);
    setValidatedResult(null);
    if (currentBlockIndex + 1 < blocks.length) {
      setCurrentBlockIndex(prev => prev + 1);
    } else {
      // Session finished
      setIsFinished(true);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('¡Sesión de estudio completada!');
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
    setValidatedResult(null);
  };

  if (!card) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <p>No se encontró el contenido seleccionado.</p>
        <button
          onClick={() => setCurrentView(user.isGuest ? 'content_preview' : 'library')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs"
        >
              {user.isGuest ? 'Volver' : 'Volver a la Biblioteca'}
        </button>
      </div>
    );
  }

  const earnedPoints = completedBlocks.reduce((acc, cur) => acc + cur.points, 0);
  const maxPoints = getActivityMaxPoints(blocks, false);
  const accuracyPercent = maxPoints > 0
    ? Math.round((earnedPoints / maxPoints) * 100)
    : 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <button
          type="button"
          onClick={() => setCurrentView(user.isGuest ? 'content_preview' : 'library')}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-4">
          {/* Individual Stopwatch */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-indigo-400">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(seconds)}
          </div>

          {/* Progress Indicator */}
          <span className="text-xs font-semibold text-zinc-400">
            Bloque {currentBlockIndex + 1} de {blocks.length}
          </span>
        </div>
      </div>

      {/* Card Info Header */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            {card.subjectName}
          </span>
          <h1 className="text-xl font-bold font-display text-zinc-100 mt-0.5">
            {card.title}
          </h1>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-1 bg-zinc-800 rounded-lg text-zinc-300">
          {card.accessCode}
        </span>
      </div>

      {/* Active Block View or Finished Screen */}
      {!isFinished && currentBlock ? (
        <div className="space-y-4">
          <InteractiveBlockPlayer
            key={currentBlock.id}
            block={currentBlock}
            onComplete={handleBlockComplete}
            onNext={handleNextBlock}
            nextLabel={currentBlockIndex + 1 < blocks.length ? 'Siguiente bloque' : 'Finalizar estudio'}
            isGameMode={false}
          />
        </div>
      ) : (
        /* Final Statistics Screen */
        <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/10">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              ¡Sesión de Microaprendizaje Completada!
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-zinc-100 mt-1">
              Excelente Trabajo
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
              Has revisado los conceptos clave de {card.title}. Si este material está en un curso, tu precisión queda en el ranking de ese curso.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {/* Time employed */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Tiempo Empleado
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
                Puntos de estudio
              </span>
              <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
                {earnedPoints} / {maxPoints}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 block">Máximo posible: {maxPoints}</span>
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
              Repetir Sesión
            </button>

            <button
              type="button"
              onClick={() => setCurrentView(user.isGuest ? 'content_preview' : 'library')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              {user.isGuest ? 'Volver al material' : 'Ir a Mi Biblioteca'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
};
