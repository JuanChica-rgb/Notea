import React, { useState } from 'react';
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
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface InteractiveBlockPlayerProps {
  block: InteractiveBlock;
  onComplete?: (isCorrect: boolean, points: number) => void;
  isGameMode?: boolean;
}

export const InteractiveBlockPlayer: React.FC<InteractiveBlockPlayerProps> = ({
  block,
  onComplete,
  isGameMode = false
}) => {
  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl text-left">
      {/* Optional attached image */}
      {block.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-zinc-800 max-h-72 w-full bg-black/40">
          <img 
            src={block.imageUrl} 
            alt="Material adjunto" 
            className="w-full h-full object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {block.type === 'content_card' && (
        <ContentCardPlayer block={block} />
      )}
      {block.type === 'flashcard' && (
        <FlashcardPlayer block={block} onComplete={onComplete} isGameMode={isGameMode} />
      )}
      {block.type === 'connect' && (
        <ConnectPlayer block={block} onComplete={onComplete} />
      )}
      {block.type === 'sequence' && (
        <SequencePlayer block={block} onComplete={onComplete} />
      )}
      {block.type === 'fill_blank' && (
        <FillBlankPlayer block={block} onComplete={onComplete} />
      )}
      {block.type === 'swipe_classify' && (
        <SwipeClassifyPlayer block={block} onComplete={onComplete} />
      )}
      {block.type === 'error_detect' && (
        <ErrorDetectPlayer block={block} onComplete={onComplete} />
      )}
      {block.type === 'hotspot' && (
        <HotspotPlayer block={block} onComplete={onComplete} />
      )}
      {block.type === 'true_false_rush' && (
        <TrueFalseRushPlayer block={block} onComplete={onComplete} />
      )}
      {block.type === 'slider_estimator' && (
        <SliderEstimatorPlayer block={block} onComplete={onComplete} />
      )}
    </div>
  );
};

// 0. Content Card Player
const ContentCardPlayer: React.FC<{ block: ContentCardBlockData }> = ({ block }) => (
  <div className="space-y-3">
    {block.title && (
      <h3 className="text-lg font-bold font-display text-zinc-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        {block.title}
      </h3>
    )}
    <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
      {block.body}
    </div>
  </div>
);

// 1. Flashcard 3D with Flip & Self-Evaluation (Easy / Medium / Hard)
const FlashcardPlayer: React.FC<{ 
  block: FlashcardBlockData; 
  onComplete?: (c: boolean, p: number) => void;
  isGameMode: boolean;
}> = ({ block, onComplete }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastery, setMastery] = useState<'easy' | 'medium' | 'hard' | null>(null);

  const handleSelfEval = (level: 'easy' | 'medium' | 'hard') => {
    setMastery(level);
    if (onComplete) {
      const pts = level === 'easy' ? 100 : level === 'medium' ? 70 : 40;
      onComplete(true, pts);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Ficha de Repaso 3D (Estilo NotebookLM)</span>
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Voltear Ficha
        </button>
      </div>

      {/* 3D Card Container */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
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
              {block.question}
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
              {block.answer}
            </p>
            <div className="text-center text-xs text-indigo-400">
              Auto-evalúa tu dominio abajo 👇
            </div>
          </div>
        </div>
      </div>

      {/* Self-evaluation Mastery buttons */}
      <div className="pt-2">
        <span className="block text-xs font-semibold text-zinc-400 mb-2 text-center">
          ¿Cómo dominas este concepto?
        </span>
        <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => handleSelfEval('hard')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
              mastery === 'hard'
                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                : 'bg-zinc-800/80 border-zinc-700 text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            Difícil ⚠️
          </button>
          <button
            type="button"
            onClick={() => handleSelfEval('medium')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
              mastery === 'medium'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                : 'bg-zinc-800/80 border-zinc-700 text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            Medio ⚖️
          </button>
          <button
            type="button"
            onClick={() => handleSelfEval('easy')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
              mastery === 'easy'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-zinc-800/80 border-zinc-700 text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            Dominado ✓
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Conectar / Relacionar (Two clear columns A & B matching)
const ConnectPlayer: React.FC<{
  block: ConnectBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, string>>({}); // leftId -> rightId
  const [validated, setValidated] = useState(false);

  // Scramble rights once
  const [shuffledRights] = useState(() => {
    return [...block.pairs].sort(() => Math.random() - 0.5);
  });

  const handleLeftClick = (id: string) => {
    if (validated) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (rightPairId: string) => {
    if (validated || !selectedLeft) return;
    setConnections({
      ...connections,
      [selectedLeft]: rightPairId
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
    const isAllCorrect = correct === block.pairs.length;
    if (onComplete) {
      onComplete(isAllCorrect, Math.round((correct / block.pairs.length) * 100));
    }
  };

  const handleReset = () => {
    setConnections({});
    setSelectedLeft(null);
    setValidated(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-100">{block.prompt}</h4>
        <span className="text-xs text-zinc-400">
          {Object.keys(connections).length} / {block.pairs.length} parejas formadas
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
                {pair.left}
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
                {pair.right}
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

        {!validated ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={Object.keys(connections).length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Comprobar Respuestas
          </button>
        ) : (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            ¡Evaluado!
          </span>
        )}
      </div>
    </div>
  );
};

// 3. Organización / Secuencia
const SequencePlayer: React.FC<{
  block: SequenceBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [items, setItems] = useState(() => {
    // start shuffled
    return [...block.items].sort(() => Math.random() - 0.5);
  });
  const [validated, setValidated] = useState(false);

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
    const isAllCorrect = correct === items.length;
    if (onComplete) {
      onComplete(isAllCorrect, Math.round((correct / items.length) * 100));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-zinc-100">{block.prompt}</h4>
        <span className="text-xs text-zinc-400">Ordena los pasos de arriba hacia abajo usando las flechas:</span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const isCorrect = validated && item.correctOrder === idx + 1;
          const isWrong = validated && item.correctOrder !== idx + 1;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isCorrect
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                  : isWrong
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-200'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-400 flex items-center justify-center">
                {idx + 1}
              </span>

              <span className="flex-1 text-xs sm:text-sm font-medium">{item.text}</span>

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

      <div className="flex justify-end pt-2">
        {!validated ? (
          <button
            type="button"
            onClick={handleCheck}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Validar Orden
          </button>
        ) : (
          <span className="text-xs font-bold text-indigo-400">Secuencia revisada</span>
        )}
      </div>
    </div>
  );
};

// 4. Rellenar Espacios ("Fill Blank") with ABCD or Free Typing Case-Insensitive
const FillBlankPlayer: React.FC<{
  block: FillBlankBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCheck = () => {
    setValidated(true);
    let correct = false;

    if (block.mode === 'multiple_choice') {
      correct = selectedOption?.trim().toLowerCase() === block.correctAnswer.trim().toLowerCase();
    } else {
      // Case-insensitive free text comparison
      correct = typedAnswer.trim().toLowerCase() === block.correctAnswer.trim().toLowerCase();
    }

    setIsCorrect(correct);
    if (onComplete) {
      onComplete(correct, correct ? 100 : 0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Rellenar Espacio</span>
        <p className="text-base sm:text-lg font-medium text-zinc-100 mt-1 leading-relaxed">
          {block.sentence}
        </p>
      </div>

      {block.mode === 'multiple_choice' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {block.options.map((opt, i) => {
            const isSelected = selectedOption === opt;
            const isRight = validated && opt.toLowerCase() === block.correctAnswer.toLowerCase();
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
                <span>{opt}</span>
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
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
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
            {isCorrect ? '¡Excelente! Respuesta Correcta.' : `Incorrecto. La respuesta correcta es: "${block.correctAnswer}"`}
          </div>
          {block.explanation && <p className="text-zinc-400 mt-1">{block.explanation}</p>}
        </div>
      )}

      {!validated && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleCheck}
            disabled={block.mode === 'multiple_choice' ? !selectedOption : !typedAnswer.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
          >
            Comprobar Respuesta
          </button>
        </div>
      )}
    </div>
  );
};

// 5. Clasificación Rápida ("Swipe") - 2 categories (drag/swipe lists) or >2 bottom box categories
const SwipeClassifyPlayer: React.FC<{
  block: SwipeClassifyBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState(false);

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
    if (onComplete) {
      onComplete(all, Math.round((correct / block.items.length) * 100));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-zinc-100">{block.prompt}</h4>
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
              <span className="text-xs sm:text-sm font-medium">{item.text}</span>

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
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        {!validated ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={Object.keys(assignments).length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
          >
            Comprobar Clasificación
          </button>
        ) : (
          <span className="text-xs font-bold text-indigo-400">Clasificación revisada</span>
        )}
      </div>
    </div>
  );
};

// 6. Detección de Error / Protección de errores (Estilo CAPTCHA interactivo)
const ErrorDetectPlayer: React.FC<{
  block: ErrorDetectBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const imgRef = React.useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSuccess !== null || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPos({ x, y });

    // Distance formula
    const dx = x - block.targetZone.xPercent;
    const dy = y - block.targetZone.yPercent;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const hit = dist <= (block.targetZone.radiusPercent || 15);
    setIsSuccess(hit);
    if (onComplete) {
      onComplete(hit, hit ? 100 : 0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
          Detección de Error (CAPTCHA Interactivo)
        </span>
        <h4 className="text-sm font-bold text-zinc-100 mt-0.5">{block.instruction}</h4>
      </div>

      <div 
        ref={imgRef}
        onClick={handleClick}
        className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-zinc-700 cursor-crosshair bg-black"
      >
        {block.imageUrl ? (
          <img src={block.imageUrl} alt="Error detector" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
            Imagen no configurada
          </div>
        )}

        {/* User touch indicator */}
        {clickPos && (
          <div
            style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%`, transform: 'translate(-50%, -50%)' }}
            className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSuccess ? 'border-emerald-400 bg-emerald-500/40 text-white' : 'border-rose-500 bg-rose-500/40 text-white'
            }`}
          >
            {isSuccess ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          </div>
        )}

        {/* Reveal target zone on failure */}
        {isSuccess === false && (
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

      {isSuccess !== null && (
        <div className={`p-3 rounded-xl border text-xs ${
          isSuccess ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200' : 'bg-rose-950/40 border-rose-500 text-rose-200'
        }`}>
          <div className="font-bold">
            {isSuccess ? '¡Excelente detección del error!' : 'No diste en el punto exacto.'}
          </div>
          <p className="text-zinc-300 mt-0.5">{block.explanation}</p>
        </div>
      )}
    </div>
  );
};

// 7. Diagrama / Hotspot (Sequential or Free)
const HotspotPlayer: React.FC<{
  block: HotspotBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [visitedPoints, setVisitedPoints] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const handlePointClick = (ptId: string, ptOrder?: number) => {
    if (visitedPoints.includes(ptId) || failed) return;

    if (block.isSequential) {
      const expectedStep = visitedPoints.length + 1;
      if (ptOrder !== expectedStep) {
        setFailed(true);
        if (onComplete) onComplete(false, 0);
        return;
      }
    }

    const next = [...visitedPoints, ptId];
    setVisitedPoints(next);

    if (next.length === block.hotspots.length) {
      if (onComplete) onComplete(true, 100);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Diagrama Interactivo {block.isSequential ? '(Secuencia Estricta)' : '(Exploración Libre)'}
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            {visitedPoints.length} / {block.hotspots.length} identificados
          </span>
        </div>
        <h4 className="text-sm font-bold text-zinc-100 mt-0.5">{block.instruction}</h4>
      </div>

      <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-zinc-700 bg-black">
        {block.imageUrl ? (
          <img src={block.imageUrl} alt="Diagram" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
            Diagrama sin imagen
          </div>
        )}

        {block.hotspots.map((pt, idx) => {
          const isVisited = visitedPoints.includes(pt.id);
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => handlePointClick(pt.id, pt.stepOrder || idx + 1)}
              style={{ left: `${pt.xPercent}%`, top: `${pt.yPercent}%`, transform: 'translate(-50%, -50%)' }}
              className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-xl transition-transform hover:scale-110 ${
                isVisited
                  ? 'bg-emerald-600 border-white text-white'
                  : 'bg-indigo-600/90 border-white text-white'
              }`}
            >
              {isVisited ? <Check className="w-4 h-4" /> : idx + 1}
            </button>
          );
        })}
      </div>

      {failed && (
        <div className="p-3 bg-rose-950/40 border border-rose-500 text-rose-200 rounded-xl text-xs">
          ⚠️ Has presionado un punto fuera de secuencia. Vuelve a intentarlo desde el paso 1.
        </div>
      )}

      {visitedPoints.length === block.hotspots.length && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          ¡Completaste todos los puntos del diagrama correctamente!
        </div>
      )}
    </div>
  );
};

// 8. Ráfaga Verdadero / Falso (V/F) Carousel with Green/Red Swipe Animation
const TrueFalseRushPlayer: React.FC<{
  block: TrueFalseRushBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentStatement = block.statements[currentIndex];

  const handleAnswer = (choice: boolean) => {
    if (feedback !== null || isFinished || !currentStatement) return;

    const hit = choice === currentStatement.isTrue;
    setFeedback(hit ? 'correct' : 'wrong');

    if (hit) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < block.statements.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
        if (onComplete) {
          const totalHits = hit ? correctCount + 1 : correctCount;
          onComplete(totalHits === block.statements.length, Math.round((totalHits / block.statements.length) * 100));
        }
      }
    }, 700);
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

      {!isFinished && currentStatement ? (
        <div
          className={`relative min-h-[180px] p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-xl ${
            feedback === 'correct'
              ? 'bg-emerald-950/60 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500'
              : feedback === 'wrong'
              ? 'bg-rose-950/60 border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500'
              : 'bg-zinc-800/90 border-zinc-700'
          }`}
        >
          {/* Real-time color flash indicator */}
          {feedback && (
            <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${
              feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {feedback === 'correct' ? '¡ACIERTO! ✓' : '¡FALLASTE! ✗'}
            </div>
          )}

          <p className="text-base sm:text-lg font-semibold text-zinc-100 my-auto text-center leading-relaxed">
            "{currentStatement.statement}"
          </p>

          {/* Swipe Buttons (Left = Falso, Right = Verdadero) */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              className="py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 active:bg-rose-600 text-rose-300 font-bold text-sm border border-rose-500/40 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              ← Falso (Deslizar Izq)
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(true)}
              className="py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 active:bg-emerald-600 text-emerald-300 font-bold text-sm border border-emerald-500/40 transition-all flex items-center justify-center gap-2"
            >
              Verdadero (Deslizar Der) →
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-zinc-800/80 rounded-2xl border border-zinc-700 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-zinc-100">¡Ráfaga V/F Finalizada!</h4>
          <p className="text-xs text-zinc-300">
            Aciertos: <span className="font-bold text-emerald-400">{correctCount}</span> de {block.statements.length}
          </p>
        </div>
      )}
    </div>
  );
};

// 9. Slider Estimador with Tolerance
const SliderEstimatorPlayer: React.FC<{
  block: SliderEstimatorBlockData;
  onComplete?: (c: boolean, p: number) => void;
}> = ({ block, onComplete }) => {
  const [val, setVal] = useState<number>(Math.round((block.min + block.max) / 2));
  const [submitted, setSubmitted] = useState(false);

  const diff = Math.abs(val - block.correctValue);
  const isWithinTolerance = diff <= (block.tolerance || 1);

  const handleSubmit = () => {
    setSubmitted(true);
    if (onComplete) {
      onComplete(isWithinTolerance, isWithinTolerance ? 100 : Math.max(0, 50 - diff * 5));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Slider Estimador
        </span>
        <h4 className="text-sm font-bold text-zinc-100 mt-0.5">{block.prompt}</h4>
      </div>

      <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-4">
        {/* Dynamic Display Value */}
        <div className="text-center">
          <span className="text-3xl sm:text-4xl font-black font-mono text-indigo-400">
            {val}
          </span>
          <span className="ml-1.5 text-sm text-zinc-400">{block.unit}</span>
        </div>

        {/* Range Slider */}
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

      {submitted ? (
        <div className={`p-3 rounded-xl border text-xs ${
          isWithinTolerance 
            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200' 
            : 'bg-rose-950/40 border-rose-500 text-rose-200'
        }`}>
          <div className="font-bold flex items-center gap-1.5">
            {isWithinTolerance ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            {isWithinTolerance ? '¡Estimación precisa dentro del rango permitido!' : 'Tu estimación estuvo alejada del valor real.'}
          </div>
          <p className="text-zinc-300 mt-1">
            Valor real: <span className="font-bold font-mono">{block.correctValue} {block.unit}</span> (tolerancia: ±{block.tolerance} {block.unit}).
          </p>
          <p className="text-zinc-400 mt-0.5">{block.explanation}</p>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
          >
            Confirmar Estimación
          </button>
        </div>
      )}
    </div>
  );
};
