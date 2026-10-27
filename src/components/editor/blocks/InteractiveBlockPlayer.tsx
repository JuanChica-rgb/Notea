import React, { useEffect, useRef, useState } from 'react';
import { 
  InteractiveBlock, 
  FlashcardBlockData, 
  ConnectBlockData, 
  SequenceBlockData, 
  FillBlankBlockData, 
  SwipeClassifyBlockData, 
  ErrorDetectBlockData, 
  HotspotBlockData, 
  TrueFalseRushBlockData, 
  SliderEstimatorBlockData,
  ContentCardBlockData
} from '../../../types';
import { 
  RotateCw, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown,
  GripVertical, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { getBlockMaxPoints, scorePartial } from '../../../utils/scoring';
import { MathText } from '../../common/MathText';

interface InteractiveBlockPlayerProps {
  block: InteractiveBlock;
  onComplete?: (isCorrect: boolean, points: number, maxPoints?: number) => void;
  onNext?: () => void;
  nextLabel?: string;
  isGameMode?: boolean;
}

const BlockActions: React.FC<{
  requiresCheck: boolean;
  canCheck?: boolean;
  checked?: boolean;
  isCorrect?: boolean | null;
  onCheck?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  checkLabel?: string;
  canAdvance?: boolean;
}> = ({
  requiresCheck,
  canCheck = true,
  checked = false,
  isCorrect = null,
  onCheck,
  onNext,
  nextLabel = 'Siguiente bloque',
  checkLabel = 'Comprobar',
  canAdvance,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-zinc-800/80">
    {checked && isCorrect !== null && (
      <span className={`sm:mr-auto text-xs font-bold flex items-center gap-1.5 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {isCorrect ? 'Correcto' : 'Incorrecto'}
      </span>
    )}
    {requiresCheck && (
      <button
        type="button"
        onClick={onCheck}
        disabled={!canCheck || checked}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
      >
        <Check className="w-4 h-4" />
        {checked ? 'Comprobado' : checkLabel}
      </button>
    )}
    {onNext && (
      <button
        type="button"
        onClick={onNext}
        disabled={requiresCheck && !(canAdvance ?? checked)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
      >
        {nextLabel}
        <ArrowRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

type PlayerNav = {
  onComplete?: (correctItems: number, totalItems: number) => void;
  onNext?: () => void;
  nextLabel?: string;
};

export const InteractiveBlockPlayer: React.FC<InteractiveBlockPlayerProps> = ({
  block,
  onComplete,
  onNext,
  nextLabel = 'Siguiente bloque',
  isGameMode = false
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    const timeLimit = block.type !== 'content_card' && block.estimatedTimeSeconds && block.estimatedTimeSeconds > 0 ? block.estimatedTimeSeconds : 0;
    if (!isGameMode || timeLimit <= 0) return;
    const interval = window.setInterval(() => setElapsedSeconds(value => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [block.id, block.estimatedTimeSeconds, isGameMode]);

  const timeLimit = block.type !== 'content_card' && block.estimatedTimeSeconds && block.estimatedTimeSeconds > 0 ? block.estimatedTimeSeconds : 0;

  const complete = (correctItems: number, totalItems: number) => {
    if (!onComplete) return;
    const maxPoints = getBlockMaxPoints(block, isGameMode);
    let points = scorePartial(correctItems, totalItems, maxPoints);
    if (isGameMode && maxPoints > 0 && timeLimit > 0) {
      const multiplier = elapsedSeconds <= timeLimit * 0.5
        ? 1
        : elapsedSeconds <= timeLimit
        ? 0.75
        : elapsedSeconds <= timeLimit * 1.5
        ? 0.5
        : 0;
      points = Math.round(points * multiplier);
    }
    const isCorrect = totalItems === 0 ? true : correctItems === totalItems;
    onComplete(isCorrect, points, maxPoints);
  };

  const progress = timeLimit > 0
    ? Math.min(100, (elapsedSeconds / timeLimit) * 100)
    : 0;
  const progressColor = progress <= 50 ? 'bg-emerald-500' : progress <= 100 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl text-left">
      {isGameMode && block.type !== 'content_card' && timeLimit > 0 && (
        <div className="mb-4 space-y-1.5" aria-label="Tiempo límite">
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>Tiempo: {elapsedSeconds}s</span>
            <span>Límite: {timeLimit}s</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className={`h-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {/* Optional attached image */}
      {block.imageUrl && block.type !== 'hotspot' && block.type !== 'error_detect' && (
        <div className="mb-4 rounded-xl overflow-hidden border border-zinc-800 max-h-72 w-full bg-black/40">
          <img 
            src={block.imageUrl} 
            alt="Material adjunto" 
            className="block w-full aspect-[16/9] max-h-[28rem] object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {block.type === 'content_card' && (
        <ContentCardPlayer
          block={block}
          onComplete={() => complete(0, 0)}
          onNext={onNext}
          nextLabel={nextLabel}
        />
      )}
      {block.type === 'flashcard' && (
        <FlashcardPlayer
          block={block}
          onComplete={complete}
          onNext={onNext}
          nextLabel={nextLabel}
          isGameMode={isGameMode}
        />
      )}
      {block.type === 'connect' && (
        <ConnectPlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
      {block.type === 'sequence' && (
        <SequencePlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
      {block.type === 'fill_blank' && (
        <FillBlankPlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
      {block.type === 'swipe_classify' && (
        <SwipeClassifyPlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
      {block.type === 'error_detect' && (
        <ErrorDetectPlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
      {block.type === 'hotspot' && (
        <HotspotPlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
      {block.type === 'true_false_rush' && (
        <TrueFalseRushPlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
      {block.type === 'slider_estimator' && (
        <SliderEstimatorPlayer block={block} onComplete={complete} onNext={onNext} nextLabel={nextLabel} />
      )}
    </div>
  );
};

// 0. Content Card Player
const ContentCardPlayer: React.FC<{ block: ContentCardBlockData; onComplete: () => void } & PlayerNav> = ({
  block,
  onComplete,
  onNext,
  nextLabel
}) => (
  <div className="space-y-3">
    {block.title && (
      <h3 className="text-lg font-bold font-display text-zinc-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        <MathText text={block.title} />
      </h3>
    )}
    <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 text-sm text-zinc-300 leading-relaxed">
      <MathText text={block.body} />
    </div>
    <BlockActions
      requiresCheck={false}
      onNext={onNext ? () => { onComplete(); onNext(); } : undefined}
      nextLabel={nextLabel}
    />
  </div>
);

// 1. Flashcard 3D with Flip & Self-Evaluation (Easy / Medium / Hard)
const FlashcardPlayer: React.FC<{ 
  block: FlashcardBlockData; 
  isGameMode: boolean;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(value => !value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Ficha de Repaso 3D (Estilo NotebookLM)</span>
        <button
          type="button"
          onClick={handleFlip}
          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Voltear Ficha
        </button>
      </div>

      {/* 3D Card Container */}
      <div 
        onClick={handleFlip}
        className="perspective-1000 w-full min-h-[200px] cursor-pointer"
      >
        <div 
          className={`w-full h-full min-h-[200px] transition-transform duration-500 transform-style-3d relative rounded-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden p-6 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 rounded-2xl flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                Frente • Pregunta
              </span>
              <span className="text-xs text-zinc-400">Haz clic para voltear</span>
            </div>
            <p className="text-base sm:text-lg font-medium text-zinc-100 my-auto text-center py-4">
              <MathText text={block.question} />
            </p>
            <div className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1">
              <RotateCw className="w-3 h-3" />
              Toca para ver la respuesta en 3D
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/40 rounded-2xl flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Reverso • Respuesta
              </span>
              <span className="text-xs text-zinc-400">Explicación guiada</span>
            </div>
            <p className="text-sm sm:text-base text-zinc-200 my-auto text-center py-4 leading-relaxed">
              <MathText text={block.answer} />
            </p>
            <div className="text-center text-xs text-indigo-400">
              Voltea la ficha para confirmar que la revisaste.
            </div>
          </div>
        </div>
      </div>

      <BlockActions
        requiresCheck={false}
        onNext={onNext ? () => { onComplete?.(1, 1); onNext(); } : undefined}
        nextLabel={nextLabel}
      />
    </div>
  );
};

// 2. Conectar / Relacionar (Two clear columns A & B matching)
const ConnectPlayer: React.FC<{
  block: ConnectBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, string>>({}); // leftId -> rightId
  const [validated, setValidated] = useState(false);
  const [isAllCorrect, setIsAllCorrect] = useState(false);

  // Scramble rights once
  const [shuffledRights] = useState(() => {
    return [...block.pairs].sort(() => Math.random() - 0.5);
  });

  const handleLeftClick = (id: string) => {
    if (validated) return;
    setSelectedLeft(id);
  };

  const dropConnection = (leftId: string) => {
    if (validated) return;
    setConnections(current => {
      const next = { ...current };
      delete next[leftId];
      return next;
    });
    if (selectedLeft === leftId) setSelectedLeft(null);
  };

  const handleRightClick = (rightPairId: string) => {
    if (validated) return;
    if (!selectedLeft) {
      const owner = Object.entries(connections).find(([, rightId]) => rightId === rightPairId)?.[0];
      if (owner) dropConnection(owner);
      return;
    }
    setConnections(current => {
      const next = { ...current };
      Object.entries(next).forEach(([leftId, rightId]) => {
        if (rightId === rightPairId) delete next[leftId];
      });
      next[selectedLeft] = rightPairId;
      return next;
    });
    setSelectedLeft(null);
  };

  const handleCheck = () => {
    setValidated(true);
    let correct = 0;
    block.pairs.forEach(p => {
      if (connections[p.id] === p.id) {
        correct += 1;
      }
    });
    const allCorrect = correct === block.pairs.length;
    setIsAllCorrect(allCorrect);
    onComplete?.(correct, block.pairs.length);
  };

  const handleReset = () => {
    setConnections({});
    setSelectedLeft(null);
    setValidated(false);
    setIsAllCorrect(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-100"><MathText text={block.prompt} /></h4>
        <span className="text-xs text-zinc-400">
          Elige a la izquierda y luego su pareja. Quitar suelta solo esa.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Column A */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Columna A</span>
          {block.pairs.map(pair => {
            const isSelected = selectedLeft === pair.id;
            const hasConnection = !!connections[pair.id];
            const isCorrect = validated && connections[pair.id] === pair.id;
            const isWrong = validated && connections[pair.id] && connections[pair.id] !== pair.id;

            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => handleLeftClick(pair.id)}
                className={`w-full p-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                  isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                    : isWrong
                    ? 'bg-rose-950/50 border-rose-500 text-rose-300'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                    : hasConnection
                    ? 'bg-zinc-800/90 border-indigo-500/50 text-indigo-200'
                    : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <MathText text={pair.left} />
                {hasConnection && (
                  <span className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-medium text-indigo-200">
                    <span className="min-w-0">Con <MathText text={block.pairs.find(item => item.id === connections[pair.id])?.right || ''} /></span>
                    {!validated && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={event => {
                          event.stopPropagation();
                          dropConnection(pair.id);
                        }}
                        onKeyDown={event => {
                          if (event.key !== 'Enter') return;
                          event.stopPropagation();
                          dropConnection(pair.id);
                        }}
                        className="shrink-0 text-zinc-400 hover:text-rose-300"
                      >
                        Quitar
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Column B */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Columna B</span>
          {shuffledRights.map(pair => {
            const isPairedWith = Object.entries(connections).find(([_, rId]) => rId === pair.id);
            const isCorrect = validated && isPairedWith && isPairedWith[0] === pair.id;
            const isWrong = validated && isPairedWith && isPairedWith[0] !== pair.id;

            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => handleRightClick(pair.id)}
                className={`w-full p-3 rounded-xl text-xs font-medium text-left border transition-all ${
                  isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                    : isWrong
                    ? 'bg-rose-950/50 border-rose-500 text-rose-300'
                    : isPairedWith
                    ? 'bg-zinc-800/90 border-indigo-500/50 text-indigo-200'
                    : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <MathText text={pair.right} />
                {isPairedWith && (
                  <span className="mt-1.5 block text-[11px] font-medium text-indigo-200">
                    Con <MathText text={block.pairs.find(item => item.id === isPairedWith[0])?.left || ''} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-zinc-400 hover:text-zinc-200 underline"
        >
          Limpiar conexiones
        </button>

      </div>
      <BlockActions
        requiresCheck
        canCheck={Object.keys(connections).length > 0}
        checked={validated}
        isCorrect={validated ? isAllCorrect : null}
        onCheck={handleCheck}
        onNext={onNext}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};

// 3. Organización / Secuencia
const SequencePlayer: React.FC<{
  block: SequenceBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [items, setItems] = useState(() => {
    // start shuffled
    return [...block.items].sort(() => Math.random() - 0.5);
  });
  const [validated, setValidated] = useState(false);
  const [isAllCorrect, setIsAllCorrect] = useState(false);
  const dragging = useRef<string | null>(null);
  const overIndex = useRef<number | null>(null);
  const [lift, setLift] = useState<{ id: string; x: number; y: number; width: number; offsetY: number } | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const dropOn = (target: number) => {
    const fromId = dragging.current;
    dragging.current = null;
    overIndex.current = null;
    setLift(null);
    setHoverIndex(null);
    if (!fromId || validated || Number.isNaN(target)) return;
    setItems(current => {
      const from = current.findIndex(entry => entry.id === fromId);
      if (from < 0 || from === target) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (validated) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    setItems(newItems);
  };

  const handleCheck = () => {
    setValidated(true);
    let correct = 0;
    items.forEach((it, idx) => {
      if (it.correctOrder === idx + 1) {
        correct++;
      }
    });
    const allCorrect = correct === items.length;
    setIsAllCorrect(allCorrect);
    onComplete?.(correct, items.length);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-zinc-100"><MathText text={block.prompt} /></h4>
        <span className="text-xs text-zinc-400">Arrastra cada paso para ordenarlo. También sirven las flechas.</span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const isCorrect = validated && item.correctOrder === idx + 1;
          const isWrong = validated && item.correctOrder !== idx + 1;

          return (
            <div
              key={item.id}
              data-seq={idx}
              onPointerDown={event => {
                if (validated || (event.target as HTMLElement).closest('button')) return;
                const box = event.currentTarget.getBoundingClientRect();
                dragging.current = item.id;
                overIndex.current = idx;
                setHoverIndex(idx);
                setLift({
                  id: item.id,
                  x: box.left,
                  y: box.top,
                  width: box.width,
                  offsetY: event.clientY - box.top,
                });
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={event => {
                if (dragging.current !== item.id) return;
                setLift(current => current ? { ...current, y: event.clientY - current.offsetY } : current);
                const row = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-seq]');
                const target = Number(row?.getAttribute('data-seq'));
                if (Number.isNaN(target)) return;
                overIndex.current = target;
                setHoverIndex(target);
              }}
              onPointerUp={() => dropOn(overIndex.current ?? Number.NaN)}
              onPointerCancel={() => dropOn(Number.NaN)}
              className={`flex items-center gap-3 p-3 rounded-xl border touch-none ${
                lift?.id === item.id
                  ? 'cursor-grabbing opacity-30 border-dashed border-zinc-600'
                  : hoverIndex === idx
                  ? 'cursor-grab border-indigo-400'
                  : 'cursor-grab'
              } ${
                isCorrect
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                  : isWrong
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-200'
              }`}
            >
              {!validated && <GripVertical className="w-4 h-4 shrink-0 text-zinc-500" />}
              <span className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-400 flex items-center justify-center">
                {idx + 1}
              </span>

              <span className="flex-1 text-xs sm:text-sm font-medium"><MathText text={item.text} /></span>

              {!validated && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === items.length - 1}
                    className="p-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {lift && (
        <div
          className="fixed z-50 pointer-events-none flex items-center gap-3 p-3 rounded-xl border border-indigo-400 bg-zinc-800 text-zinc-100 shadow-2xl shadow-black/70 scale-105"
          style={{ left: lift.x, top: lift.y, width: lift.width }}
        >
          <GripVertical className="w-4 h-4 shrink-0 text-zinc-300" />
          <span className="flex-1 text-xs sm:text-sm font-medium">
            <MathText text={items.find(entry => entry.id === lift.id)?.text || ''} />
          </span>
        </div>
      )}

      <BlockActions
        requiresCheck
        checked={validated}
        isCorrect={validated ? isAllCorrect : null}
        onCheck={handleCheck}
        onNext={onNext}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};

// 4. Rellenar Espacios ("Fill Blank") with ABCD or Free Typing Case-Insensitive
const FillBlankPlayer: React.FC<{
  block: FillBlankBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCheck = () => {
    setValidated(true);
    let correct = false;

    if (block.mode === 'multiple_choice') {
      const selectedIndex = selectedOption ? block.options.indexOf(selectedOption) : -1;
      correct = selectedIndex === (block.correctOptionIndex ?? block.options.indexOf(block.correctAnswer));
    } else {
      // Case-insensitive free text comparison
      correct = typedAnswer.trim().toLowerCase() === block.correctAnswer.trim().toLowerCase();
    }

    setIsCorrect(correct);
    if (onComplete) {
      onComplete(correct ? 1 : 0, 1);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Rellenar Espacio</span>
        <p className="text-base sm:text-lg font-medium text-zinc-100 mt-1 leading-relaxed">
          <MathText text={block.sentence} />
        </p>
      </div>

      {block.mode === 'multiple_choice' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {block.options.map((opt, i) => {
            const isSelected = selectedOption === opt;
            const isRight = validated && opt.trim().toLowerCase() === block.correctAnswer.trim().toLowerCase();
            const isWrong = validated && isSelected && !isRight;

            return (
              <button
                key={i}
                type="button"
                disabled={validated}
                onClick={() => setSelectedOption(opt)}
                className={`p-3 rounded-xl border text-xs font-semibold text-left flex items-center gap-2.5 transition-all ${
                  isRight
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : isWrong
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-zinc-800/70 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                  {String.fromCharCode(65 + i)}
                </span>
                <span><MathText text={opt} /></span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={typedAnswer}
            onChange={e => setTypedAnswer(e.target.value)}
            disabled={validated}
            placeholder="Escribe la respuesta aquí (no importa mayúsculas/minúsculas)..."
            className={`w-full px-4 py-2.5 bg-zinc-800 border rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none ${
              validated
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                  : 'border-rose-500 bg-rose-950/40 text-rose-200'
                : 'border-zinc-700 focus:border-indigo-500'
            }`}
          />
          <span className="text-[11px] text-zinc-500">
            Validación tolerante a mayúsculas/minúsculas.
          </span>
        </div>
      )}

      {validated && (
        <div className={`p-3 rounded-xl border text-xs ${
          isCorrect ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <div className="font-bold flex items-center gap-1.5 mb-0.5">
            {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            {isCorrect ? '¡Excelente! Respuesta correcta.' : 'Respuesta incorrecta.'}
          </div>
          {block.mode !== 'multiple_choice' && block.explanation && <p className="text-zinc-400 mt-1"><MathText text={block.explanation} /></p>}
        </div>
      )}

      {!validated && (
        <p className="text-xs text-zinc-500">Elige o escribe tu respuesta y pulsa Comprobar para ver si es correcta.</p>
      )}
      <BlockActions
        requiresCheck
        canCheck={block.mode === 'multiple_choice' ? Boolean(selectedOption) : Boolean(typedAnswer.trim())}
        checked={validated}
        isCorrect={validated ? isCorrect : null}
        onCheck={handleCheck}
        onNext={onNext}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};

// 5. Clasificación Rápida ("Swipe") - 2 categories (drag/swipe lists) or >2 bottom box categories
const SwipeClassifyPlayer: React.FC<{
  block: SwipeClassifyBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);

  const isTwoCategories = block.categories.length === 2;

  const handleAssign = (itemId: string, category: string) => {
    if (validated) return;
    setAssignments(prev => ({ ...prev, [itemId]: category }));
  };

  const handleCheck = () => {
    setValidated(true);
    let correct = 0;
    block.items.forEach(it => {
      if (assignments[it.id] === it.category) correct++;
    });
    const all = correct === block.items.length;
    setAllCorrect(all);
    onComplete?.(correct, block.items.length);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-zinc-100"><MathText text={block.prompt} /></h4>
        <span className="text-xs text-zinc-400">
          {isTwoCategories 
            ? 'Selecciona la categoría (izquierda o derecha) para cada elemento:' 
            : 'Asigna cada elemento a su respectiva caja inferior:'}
        </span>
      </div>

      {/* Elements list */}
      <div className="space-y-2">
        {block.items.map(item => {
          const assigned = assignments[item.id];
          const isRight = validated && assigned === item.category;
          const isWrong = validated && assigned && assigned !== item.category;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                isRight
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                  : isWrong
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-200'
              }`}
            >
              <span className="text-xs sm:text-sm font-medium"><MathText text={item.text} /></span>

              {/* Category picker buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {block.categories.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={validated}
                    onClick={() => handleAssign(item.id, cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      assigned === cat
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <MathText text={cat} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <BlockActions
        requiresCheck
        canCheck={Object.keys(assignments).length > 0}
        checked={validated}
        isCorrect={validated ? allCorrect : null}
        onCheck={handleCheck}
        onNext={onNext}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};

// 6. Detección de Error / Protección de errores (Estilo CAPTCHA interactivo)
const ErrorDetectPlayer: React.FC<{
  block: ErrorDetectBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [validated, setValidated] = useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (validated || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickPos({ x, y });
    setIsSuccess(null);
  };

  const handleCheck = () => {
    if (!clickPos) return;
    const dx = clickPos.x - block.targetZone.xPercent;
    const dy = clickPos.y - block.targetZone.yPercent;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hit = dist <= (block.targetZone.radiusPercent || 15);
    setIsSuccess(hit);
    setValidated(true);
    onComplete?.(hit ? 1 : 0, 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
          Detección de Error (CAPTCHA Interactivo)
        </span>
        <h4 className="text-sm font-bold text-zinc-100 mt-0.5"><MathText text={block.instruction} /></h4>
      </div>

      <div 
        ref={imgRef}
        onClick={handleClick}
        className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-700 cursor-crosshair bg-black"
      >
        {block.imageUrl ? (
          <img src={block.imageUrl} alt="Error detector" className="w-full h-full object-contain select-none" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
            Imagen no configurada
          </div>
        )}

        {clickPos && (
          <div
            style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%`, transform: 'translate(-50%, -50%)' }}
            className={`absolute w-8 h-8 rounded-full border-[3px] flex items-center justify-center shadow-lg pointer-events-none ${
              !validated
                ? 'border-white bg-indigo-500 text-white'
                : isSuccess
                ? 'border-emerald-200 bg-emerald-500 text-white'
                : 'border-rose-200 bg-rose-500 text-white'
            }`}
          >
            {validated ? (isSuccess ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />) : <span className="w-2 h-2 rounded-full bg-white" />}
          </div>
        )}

        {validated && isSuccess === false && (
          <div
            style={{
              left: `${block.targetZone.xPercent}%`,
              top: `${block.targetZone.yPercent}%`,
              width: `${block.targetZone.radiusPercent * 2}%`,
              height: `${block.targetZone.radiusPercent * 2}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/20 pointer-events-none"
          />
        )}
      </div>

      {validated && isSuccess !== null && (
        <div className={`p-3 rounded-xl border text-xs ${
          isSuccess ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200' : 'bg-rose-950/40 border-rose-500 text-rose-200'
        }`}>
          <div className="font-bold">{isSuccess ? 'Zona seleccionada correctamente.' : 'La zona seleccionada es incorrecta.'}</div>
          <p className="text-zinc-300 mt-0.5"><MathText text={block.explanation} /></p>
        </div>
      )}
      <BlockActions
        requiresCheck
        canCheck={Boolean(clickPos)}
        checked={validated}
        isCorrect={validated ? isSuccess : null}
        onCheck={handleCheck}
        onNext={onNext}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};

// 7. Diagrama / Hotspot (Sequential or Free)
const HotspotPlayer: React.FC<{
  block: HotspotBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [visitedPoints, setVisitedPoints] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [markers, setMarkers] = useState<{ x: number; y: number; hit: boolean }[]>([]);
  const totalPoints = block.hotspots.length;

  const handleSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (validated) return;
    if (!block.isSequential && markers.length >= totalPoints) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const nearest = block.hotspots
      .map(point => ({ point, distance: Math.hypot(x - point.xPercent, y - point.yPercent) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const radius = nearest?.point.radiusPercent ?? 8;
    const isOnHotspot = Boolean(nearest && nearest.distance <= radius);
    const alreadyVisited = isOnHotspot && visitedPoints.includes(nearest.point.id);

    if (block.isSequential) {
      if (isOnHotspot && !alreadyVisited && !failed) {
        const expectedStep = visitedPoints.length + 1;
        if (nearest.point.stepOrder !== expectedStep) {
          setFailed(true);
          setMarkers(prev => [...prev, { x, y, hit: false }]);
          return;
        }
        setVisitedPoints(prev => [...prev, nearest.point.id]);
        setMarkers(prev => [...prev, { x, y, hit: true }]);
        return;
      }
      setFailed(true);
      setMarkers(prev => [...prev, { x, y, hit: false }]);
      return;
    }

    if (isOnHotspot && !alreadyVisited) {
      setVisitedPoints(prev => [...prev, nearest.point.id]);
    }
    setMarkers(prev => [...prev, { x, y, hit: false }]);
  };

  const handleClear = () => {
    if (validated) return;
    setVisitedPoints([]);
    setFailed(false);
    setIsCorrect(false);
    setMarkers([]);
  };

  const handleCheck = () => {
    const correctCount = visitedPoints.length;
    const allFound = !failed && correctCount === totalPoints && totalPoints > 0;
    setIsCorrect(allFound);
    setValidated(true);
    onComplete?.(correctCount, Math.max(1, totalPoints));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Diagrama Interactivo {block.isSequential ? '(Secuencia Estricta)' : '(Exploración Libre)'}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono font-bold text-indigo-300">
              {block.isSequential
                ? `${visitedPoints.length} / ${totalPoints} identificados`
                : `${markers.length} / ${totalPoints} puntos`}
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={validated || markers.length === 0}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar
            </button>
          </div>
        </div>
        <h4 className="text-sm font-bold text-zinc-100 mt-0.5"><MathText text={block.instruction} /></h4>
        {!block.isSequential && (
          <p className="text-[11px] text-zinc-500 mt-1">
            Marca exactamente {totalPoints} {totalPoints === 1 ? 'punto' : 'puntos'}. Al comprobar sabrás si están bien.
          </p>
        )}
      </div>

      <div
        onClick={handleSurfaceClick}
        className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-700 bg-black cursor-crosshair"
      >
        {block.imageUrl ? (
          <img src={block.imageUrl} alt="Diagram" className="w-full h-full object-contain select-none pointer-events-none" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
            Diagrama sin imagen
          </div>
        )}

        {markers.map((marker, index) => (
          <div
            key={`${marker.x}-${marker.y}-${index}`}
            className="absolute w-7 h-7 rounded-full border-2 border-white bg-indigo-500/90 text-white flex items-center justify-center shadow-lg pointer-events-none"
            style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="text-[10px] font-black">{index + 1}</span>
          </div>
        ))}
      </div>

      {failed && !validated && (
        <div className="p-3 bg-rose-950/40 border border-rose-500 text-rose-200 rounded-xl text-xs">
          Has presionado un punto fuera de secuencia. Comprueba para ver el resultado.
        </div>
      )}

      {validated && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
          isCorrect ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200' : 'bg-rose-950/40 border-rose-500 text-rose-200'
        }`}>
          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {isCorrect
            ? 'Completaste todos los puntos del diagrama correctamente.'
            : `Identificaste ${visitedPoints.length} de ${totalPoints} puntos.`}
        </div>
      )}
      <BlockActions
        requiresCheck
        canCheck={!block.isSequential ? markers.length === totalPoints && totalPoints > 0 : markers.length > 0 || visitedPoints.length > 0 || failed}
        checked={validated}
        isCorrect={validated ? isCorrect : null}
        onCheck={handleCheck}
        onNext={onNext}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};

// 8. Ráfaga Verdadero / Falso (V/F) Carousel with Green/Red Swipe Animation
const TrueFalseRushPlayer: React.FC<{
  block: TrueFalseRushBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [checkedCurrent, setCheckedCurrent] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [validated, setValidated] = useState(false);

  const currentStatement = block.statements[currentIndex];
  const isLast = currentIndex + 1 >= block.statements.length;

  const handleSelect = (choice: boolean) => {
    if (checkedCurrent || validated || !currentStatement) return;
    setSelected(choice);
  };

  const handleCheck = () => {
    if (selected === null || !currentStatement || checkedCurrent) return;
    const hit = selected === currentStatement.isTrue;
    setFeedback(hit ? 'correct' : 'wrong');
    setCheckedCurrent(true);
    const nextCorrect = correctCount + (hit ? 1 : 0);
    if (hit) setCorrectCount(nextCorrect);
    if (isLast) {
      setValidated(true);
      onComplete?.(nextCorrect, block.statements.length);
    }
  };

  const handleNextStatement = () => {
    if (!checkedCurrent || isLast) return;
    setCurrentIndex(prev => prev + 1);
    setSelected(null);
    setCheckedCurrent(false);
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="font-bold text-purple-400 uppercase tracking-wider">
          Ráfaga Verdadero / Falso
        </span>
        <span className="font-mono">
          {currentIndex + 1} de {block.statements.length}
        </span>
      </div>

      {currentStatement && (
        <div
          className={`relative min-h-[180px] p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-xl ${
            feedback === 'correct'
              ? 'bg-emerald-950/60 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500'
              : feedback === 'wrong'
              ? 'bg-rose-950/60 border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500'
              : 'bg-zinc-800/90 border-zinc-700'
          }`}
        >
          {feedback && (
            <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${
              feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {feedback === 'correct' ? '¡ACIERTO! ✓' : '¡FALLASTE! ✗'}
            </div>
          )}

          <p className="text-base sm:text-lg font-semibold text-zinc-100 my-auto text-center leading-relaxed">
            "<MathText text={currentStatement.statement} />"
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              onClick={() => handleSelect(false)}
              disabled={checkedCurrent}
              className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 disabled:opacity-80 ${
                selected === false
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40'
              }`}
            >
              <X className="w-5 h-5" />
              Falso
            </button>
            <button
              type="button"
              onClick={() => handleSelect(true)}
              disabled={checkedCurrent}
              className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 disabled:opacity-80 ${
                selected === true
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
              }`}
            >
              Verdadero
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {checkedCurrent && !isLast && (
        <button
          type="button"
          onClick={handleNextStatement}
          className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-xl"
        >
          Siguiente afirmación
        </button>
      )}

      <BlockActions
        requiresCheck
        canCheck={selected !== null}
        checked={checkedCurrent}
        isCorrect={feedback === 'correct' ? true : feedback === 'wrong' ? false : null}
        onCheck={handleCheck}
        onNext={onNext}
        canAdvance={validated}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};

// 9. Slider Estimador with Tolerance
const SliderEstimatorPlayer: React.FC<{
  block: SliderEstimatorBlockData;
} & PlayerNav> = ({ block, onComplete, onNext, nextLabel }) => {
  const [val, setVal] = useState<number>(Math.round((block.min + block.max) / 2));
  const [submitted, setSubmitted] = useState(false);

  const diff = Math.abs(val - block.correctValue);
  const isWithinTolerance = diff <= (block.tolerance || 1);

  const handleCheck = () => {
    setSubmitted(true);
    onComplete?.(isWithinTolerance ? 1 : 0, 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Slider Estimador
        </span>
        <h4 className="text-sm font-bold text-zinc-100 mt-0.5"><MathText text={block.prompt} /></h4>
      </div>

      <div className={`p-4 rounded-xl border space-y-4 ${
        submitted
          ? isWithinTolerance
            ? 'bg-emerald-950/40 border-emerald-500'
            : 'bg-rose-950/40 border-rose-500'
          : 'bg-zinc-950/60 border-zinc-800'
      }`}>
        <div className="text-center">
          <span className={`text-3xl sm:text-4xl font-black font-mono ${
            submitted ? (isWithinTolerance ? 'text-emerald-400' : 'text-rose-400') : 'text-indigo-400'
          }`}>
            {val}
          </span>
          <span className="ml-1.5 text-sm text-zinc-400">{block.unit}</span>
        </div>

        <input
          type="range"
          min={block.min}
          max={block.max}
          step={1}
          value={val}
          disabled={submitted}
          onChange={e => setVal(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
        />

        <div className="flex justify-between text-xs text-zinc-500 font-mono">
          <span>{block.min} {block.unit}</span>
          <span>{block.max} {block.unit}</span>
        </div>
      </div>

      {submitted && (
        <div className={`p-3 rounded-xl border text-xs ${
          isWithinTolerance 
            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200' 
            : 'bg-rose-950/40 border-rose-500 text-rose-200'
        }`}>
          <div className="font-bold flex items-center gap-1.5">
            {isWithinTolerance ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            {isWithinTolerance ? 'Estimación precisa dentro del rango permitido.' : 'Tu estimación estuvo alejada del valor real.'}
          </div>
          <p className="text-zinc-300 mt-1">
            Valor real: <span className="font-bold font-mono">{block.correctValue} {block.unit}</span> (tolerancia: ±{block.tolerance} {block.unit}).
          </p>
          <p className="text-zinc-400 mt-0.5"><MathText text={block.explanation} /></p>
        </div>
      )}
      <BlockActions
        requiresCheck
        checked={submitted}
        isCorrect={submitted ? isWithinTolerance : null}
        onCheck={handleCheck}
        onNext={onNext}
        nextLabel={nextLabel}
        checkLabel="Comprobar"
      />
    </div>
  );
};
