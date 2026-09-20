import React from 'react';
import { 
  InteractiveBlock, 
  ContentCardBlockData, 
  FlashcardBlockData, 
  ConnectBlockData, 
  SequenceBlockData, 
  FillBlankBlockData, 
  SwipeClassifyBlockData, 
  ErrorDetectBlockData, 
  HotspotBlockData, 
  TrueFalseRushBlockData, 
  SliderEstimatorBlockData 
} from '../../../types';
import { Plus, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

interface BlockEditorProps {
  block: InteractiveBlock;
  onChange: (updated: InteractiveBlock) => void;
  onDelete: () => void;
}

export const InteractiveBlockEditor: React.FC<BlockEditorProps> = ({ block, onChange, onDelete }) => {
  const [showImageInput, setShowImageInput] = React.useState(!!block.imageUrl);

  const handleImageChange = (url: string) => {
    onChange({ ...block, imageUrl: url.trim() || undefined });
  };

  return (
    <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-4 hover:border-zinc-700/80 transition-all text-left">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
            {getBlockTypeName(block.type)}
          </span>
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              block.imageUrl 
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300' 
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {block.imageUrl ? 'Imagen adjunta ✓' : '+ Adjuntar Imagen (Opcional)'}
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          title="Eliminar este bloque"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Optional Image URL field */}
      {showImageInput && (
        <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
          <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            URL de imagen para enriquecer la explicación:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={block.imageUrl || ''}
              onChange={e => handleImageChange(e.target.value)}
              placeholder="https://images.unsplash.com/... o enlace de imagen"
              className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            {block.imageUrl && (
              <button
                type="button"
                onClick={() => handleImageChange('')}
                className="px-2 text-xs text-zinc-400 hover:text-rose-400"
              >
                Quitar
              </button>
            )}
          </div>
          {block.imageUrl && (
            <div className="relative h-28 w-full rounded-lg overflow-hidden border border-zinc-800">
              <img src={block.imageUrl} alt="Vista previa" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      )}

      {/* Specific Block Content Editors */}
      {block.type === 'content_card' && (
        <ContentCardEditor block={block} onChange={onChange} />
      )}
      {block.type === 'flashcard' && (
        <FlashcardEditor block={block} onChange={onChange} />
      )}
      {block.type === 'connect' && (
        <ConnectEditor block={block} onChange={onChange} />
      )}
      {block.type === 'sequence' && (
        <SequenceEditor block={block} onChange={onChange} />
      )}
      {block.type === 'fill_blank' && (
        <FillBlankEditor block={block} onChange={onChange} />
      )}
      {block.type === 'swipe_classify' && (
        <SwipeClassifyEditor block={block} onChange={onChange} />
      )}
      {block.type === 'error_detect' && (
        <ErrorDetectEditor block={block} onChange={onChange} />
      )}
      {block.type === 'hotspot' && (
        <HotspotEditor block={block} onChange={onChange} />
      )}
      {block.type === 'true_false_rush' && (
        <TrueFalseRushEditor block={block} onChange={onChange} />
      )}
      {block.type === 'slider_estimator' && (
        <SliderEstimatorEditor block={block} onChange={onChange} />
      )}
    </div>
  );
};

function getBlockTypeName(type: string): string {
  switch (type) {
    case 'content_card': return 'Tarjeta Informativa';
    case 'flashcard': return 'Flashcard Activa 3D';
    case 'connect': return 'Conectar / Relacionar';
    case 'sequence': return 'Organización / Secuencia';
    case 'fill_blank': return 'Rellenar Espacios';
    case 'swipe_classify': return 'Clasificación Rápida (Swipe)';
    case 'error_detect': return 'Detección de Error';
    case 'hotspot': return 'Diagrama / Hotspot';
    case 'true_false_rush': return 'Ráfaga Verdadero / Falso';
    case 'slider_estimator': return 'Slider Estimador';
    default: return type;
  }
}

// 0. Content Card
const ContentCardEditor: React.FC<{ block: ContentCardBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-zinc-300">Título / Encabezado:</label>
      <input
        type="text"
        value={block.title || ''}
        onChange={e => onChange({ ...block, title: e.target.value })}
        placeholder="Ej. Teorema Fundamental o Mnemotecnia..."
        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
      />
    </div>
    <div>
      <label className="text-xs font-medium text-zinc-300">Contenido Explicativo (Texto de estudio o recordatorio):</label>
      <textarea
        value={block.body}
        onChange={e => onChange({ ...block, body: e.target.value })}
        rows={3}
        placeholder="Escribe la explicación teórica, fórmula o concepto clave..."
        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
      />
    </div>
  </div>
);

// 1. Flashcard 3D
const FlashcardEditor: React.FC<{ block: FlashcardBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800">
      <span className="text-xs font-bold text-indigo-400">Frente (Pregunta / Concepto):</span>
      <textarea
        value={block.question}
        onChange={e => onChange({ ...block, question: e.target.value })}
        rows={3}
        placeholder="¿Qué pregunta o concepto se muestra en el frente de la tarjeta 3D?"
        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
      />
    </div>
    <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800">
      <span className="text-xs font-bold text-emerald-400">Reverso (Respuesta Explicada):</span>
      <textarea
        value={block.answer}
        onChange={e => onChange({ ...block, answer: e.target.value })}
        rows={3}
        placeholder="Respuesta que se revelará al voltear en 3D..."
        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
      />
    </div>
  </div>
);

// 2. Conectar / Relacionar (Two clear columns: Columna A and Columna B with + Agregar par)
const ConnectEditor: React.FC<{ block: ConnectBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => {
  const addPair = () => {
    const newPair = { id: `p_${Date.now()}`, left: '', right: '' };
    onChange({ ...block, pairs: [...block.pairs, newPair] });
  };

  const updatePair = (id: string, field: 'left' | 'right', val: string) => {
    onChange({
      ...block,
      pairs: block.pairs.map(p => p.id === id ? { ...p, [field]: val } : p)
    });
  };

  const removePair = (id: string) => {
    onChange({ ...block, pairs: block.pairs.filter(p => p.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-zinc-300">Instrucción:</label>
        <input
          type="text"
          value={block.prompt}
          onChange={e => onChange({ ...block, prompt: e.target.value })}
          placeholder="Relaciona cada término con su definición..."
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-zinc-400 px-1">
        <span>Columna A (Término)</span>
        <span>Columna B (Definición / Pareja)</span>
      </div>

      <div className="space-y-2">
        {block.pairs.map(pair => (
          <div key={pair.id} className="flex items-center gap-2">
            <input
              type="text"
              value={pair.left}
              onChange={e => updatePair(pair.id, 'left', e.target.value)}
              placeholder="Elemento A..."
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-zinc-500">↔</span>
            <input
              type="text"
              value={pair.right}
              onChange={e => updatePair(pair.id, 'right', e.target.value)}
              placeholder="Definición B..."
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => removePair(pair.id)}
              className="p-1.5 text-zinc-500 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPair}
        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-semibold text-indigo-400 flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        + Agregar par
      </button>
    </div>
  );
};

// 3. Organización / Secuencia
const SequenceEditor: React.FC<{ block: SequenceBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => {
  const addItem = () => {
    const newItem = { id: `sq_${Date.now()}`, text: '', correctOrder: block.items.length + 1 };
    onChange({ ...block, items: [...block.items, newItem] });
  };

  const updateItemText = (id: string, text: string) => {
    onChange({
      ...block,
      items: block.items.map(it => it.id === id ? { ...it, text } : it)
    });
  };

  const removeItem = (id: string) => {
    onChange({ ...block, items: block.items.filter(it => it.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-zinc-300">Instrucción para ordenar:</label>
        <input
          type="text"
          value={block.prompt}
          onChange={e => onChange({ ...block, prompt: e.target.value })}
          placeholder="Ordena los siguientes pasos en su secuencia cronológica correcta..."
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="space-y-2">
        {block.items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-400 flex items-center justify-center">
              {idx + 1}
            </span>
            <input
              type="text"
              value={item.text}
              onChange={e => updateItemText(item.id, e.target.value)}
              placeholder={`Paso o elemento #${idx + 1} (en el orden correcto)...`}
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="p-1.5 text-zinc-500 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-semibold text-indigo-400 flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        + Agregar paso a ordenar
      </button>
    </div>
  );
};

// 4. Rellenar Espacios ("Fill Blank")
const FillBlankEditor: React.FC<{ block: FillBlankBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-zinc-300">
        Texto con espacio a completar (indica el espacio con corchetes o escribe la frase):
      </label>
      <input
        type="text"
        value={block.sentence}
        onChange={e => onChange({ ...block, sentence: e.target.value })}
        placeholder="Ej: La derivada de sen(x) es [______]."
        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
      />
    </div>

    {/* Modalidad: Opción Múltiple vs Escritura Libre */}
    <div className="flex items-center gap-4 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
      <span className="text-xs font-bold text-zinc-300">Modalidad:</span>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
        <input
          type="radio"
          name={`fill_mode_${block.id}`}
          checked={block.mode === 'multiple_choice'}
          onChange={() => onChange({ 
            ...block, 
            mode: 'multiple_choice', 
            options: block.options.length ? block.options : ['Opción A', 'Opción B', 'Opción C', 'Opción D'] 
          })}
          className="text-indigo-600"
        />
        Opción Múltiple (A, B, C, D)
      </label>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
        <input
          type="radio"
          name={`fill_mode_${block.id}`}
          checked={block.mode === 'free_text'}
          onChange={() => onChange({ ...block, mode: 'free_text' })}
          className="text-indigo-600"
        />
        Escritura Libre (Case-insensitive)
      </label>
    </div>

    {block.mode === 'multiple_choice' ? (
      <div className="space-y-2 p-3 bg-zinc-950/40 rounded-xl border border-zinc-800">
        <span className="text-xs font-semibold text-zinc-400">Opciones para seleccionar:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {block.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-center text-xs font-bold text-indigo-400">{String.fromCharCode(65 + i)}</span>
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const nextOpts = [...block.options];
                  nextOpts[i] = e.target.value;
                  onChange({ ...block, options: nextOpts });
                }}
                className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p className="text-[11px] text-zinc-400">
        El usuario escribirá su respuesta en un campo de texto. La validación no distingue mayúsculas ni minúsculas.
      </p>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-semibold text-emerald-400">Respuesta Correcta:</label>
        <input
          type="text"
          value={block.correctAnswer}
          onChange={e => onChange({ ...block, correctAnswer: e.target.value })}
          placeholder="Ej: cos(x)"
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-emerald-500/50 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-zinc-400">Explicación para feedback:</label>
        <input
          type="text"
          value={block.explanation || ''}
          onChange={e => onChange({ ...block, explanation: e.target.value })}
          placeholder="Ej: Por regla de diferenciación de funciones trigonométricas."
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  </div>
);

// 5. Clasificación Rápida ("Swipe")
const SwipeClassifyEditor: React.FC<{ block: SwipeClassifyBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => {
  const addCategory = () => {
    onChange({ ...block, categories: [...block.categories, `Categoría ${block.categories.length + 1}`] });
  };

  const addItem = () => {
    const newItem = { id: `sci_${Date.now()}`, text: '', category: block.categories[0] || 'Categoría 1' };
    onChange({ ...block, items: [...block.items, newItem] });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-zinc-300">Instrucción:</label>
        <input
          type="text"
          value={block.prompt}
          onChange={e => onChange({ ...block, prompt: e.target.value })}
          placeholder="Clasifica cada afirmación en su categoría correspondiente..."
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Categories */}
      <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300">
            Categorías ({block.categories.length === 2 ? 'Modo 2 Listas / Swipe' : 'Modo Cajitas Inferiores'}):
          </span>
          <button
            type="button"
            onClick={addCategory}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            + Añadir Categoría
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {block.categories.map((cat, i) => (
            <input
              key={i}
              type="text"
              value={cat}
              onChange={e => {
                const nextCats = [...block.categories];
                nextCats[i] = e.target.value;
                onChange({ ...block, categories: nextCats });
              }}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          ))}
        </div>
      </div>

      {/* Items to classify */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-zinc-400">Elementos a clasificar:</span>
        {block.items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="text"
              value={item.text}
              onChange={e => {
                onChange({
                  ...block,
                  items: block.items.map(it => it.id === item.id ? { ...it, text: e.target.value } : it)
                });
              }}
              placeholder="Texto o afirmación..."
              className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={item.category}
              onChange={e => {
                onChange({
                  ...block,
                  items: block.items.map(it => it.id === item.id ? { ...it, category: e.target.value } : it)
                });
              }}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              {block.categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChange({ ...block, items: block.items.filter(it => it.id !== item.id) })}
              className="p-1.5 text-zinc-500 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-semibold text-indigo-400 flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        + Agregar elemento a clasificar
      </button>
    </div>
  );
};

// 6. Detección de Error (Estilo CAPTCHA interactivo con círculo)
const ErrorDetectEditor: React.FC<{ block: ErrorDetectBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => {
  const imgRef = React.useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange({
      ...block,
      targetZone: {
        ...block.targetZone,
        xPercent: x,
        yPercent: y
      }
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-zinc-300">Instrucción para el usuario:</label>
        <input
          type="text"
          value={block.instruction}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          placeholder="Toca exactamente sobre el error o punto clave en la imagen..."
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-300">URL de la imagen para el CAPTCHA interactivo:</label>
        <input
          type="text"
          value={block.imageUrl || ''}
          onChange={e => onChange({ ...block, imageUrl: e.target.value })}
          placeholder="https://..."
          className="w-full mt-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {block.imageUrl ? (
        <div className="space-y-1">
          <p className="text-[11px] text-zinc-400">
            👉 Haz clic en la imagen donde se ubica el error o punto clave para definir la zona del círculo:
          </p>
          <div 
            ref={imgRef}
            onClick={handleImageClick}
            className="relative h-60 w-full rounded-xl overflow-hidden border border-zinc-700 cursor-crosshair bg-black"
          >
            <img src={block.imageUrl} alt="Captcha" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
            <div
              style={{
                left: `${block.targetZone.xPercent}%`,
                top: `${block.targetZone.yPercent}%`,
                width: `${block.targetZone.radiusPercent * 2}%`,
                height: `${block.targetZone.radiusPercent * 2}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute rounded-full border-2 border-rose-500 bg-rose-500/30 flex items-center justify-center pointer-events-none"
            >
              <span className="text-[10px] font-bold text-white bg-rose-600 px-1 rounded">Zona Clave</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-amber-400 italic">Ingresa una URL de imagen para poder dibujar la zona del error.</p>
      )}

      <div>
        <label className="text-xs font-semibold text-zinc-300">Explicación del error / solución:</label>
        <input
          type="text"
          value={block.explanation}
          onChange={e => onChange({ ...block, explanation: e.target.value })}
          placeholder="Explicación de por qué este punto es el error..."
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  );
};

// 7. Diagrama / Hotspot
const HotspotEditor: React.FC<{ block: HotspotBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => {
  const imgRef = React.useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const newPt = {
      id: `hp_${Date.now()}`,
      label: `Punto #${block.hotspots.length + 1}`,
      xPercent: x,
      yPercent: y,
      stepOrder: block.hotspots.length + 1
    };
    onChange({ ...block, hotspots: [...block.hotspots, newPt] });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-zinc-300">Instrucción:</label>
        <input
          type="text"
          value={block.instruction}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          placeholder="Toca los puntos en el orden indicado..."
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Toggle sequential order vs free */}
      <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
        <div>
          <span className="text-xs font-bold text-zinc-200">Orden estricto (Secuencial):</span>
          <p className="text-[11px] text-zinc-400">Si está activado, el usuario debe pulsar los puntos en orden 1, 2, 3...</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...block, isSequential: !block.isSequential })}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
            block.isSequential ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {block.isSequential ? 'Secuencial Activado' : 'Orden Libre'}
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-300">URL del Diagrama / Imagen:</label>
        <input
          type="text"
          value={block.imageUrl || ''}
          onChange={e => onChange({ ...block, imageUrl: e.target.value })}
          placeholder="https://..."
          className="w-full mt-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {block.imageUrl && (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400">👉 Haz clic sobre la imagen para añadir un nuevo punto hotspot:</p>
          <div 
            ref={imgRef}
            onClick={handleImageClick}
            className="relative h-64 w-full rounded-xl overflow-hidden border border-zinc-700 cursor-crosshair bg-black"
          >
            <img src={block.imageUrl} alt="Diagram" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
            {block.hotspots.map((pt, idx) => (
              <div
                key={pt.id}
                style={{ left: `${pt.xPercent}%`, top: `${pt.yPercent}%`, transform: 'translate(-50%, -50%)' }}
                className="absolute w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-lg pointer-events-none"
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {/* List of points */}
          <div className="space-y-1.5 mt-2">
            {block.hotspots.map((pt, idx) => (
              <div key={pt.id} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={pt.label}
                  onChange={e => {
                    onChange({
                      ...block,
                      hotspots: block.hotspots.map(h => h.id === pt.id ? { ...h, label: e.target.value } : h)
                    });
                  }}
                  className="flex-1 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...block, hotspots: block.hotspots.filter(h => h.id !== pt.id) })}
                  className="text-zinc-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 8. Ráfaga Verdadero / Falso (V/F)
const TrueFalseRushEditor: React.FC<{ block: TrueFalseRushBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => {
  const addStatement = () => {
    const newSt = {
      id: `tf_${Date.now()}`,
      statement: '',
      isTrue: true,
      explanation: ''
    };
    onChange({ ...block, statements: [...block.statements, newSt] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-300">
          Afirmaciones de la Ráfaga (Deslizar Izq = Falso / Der = Verdadero):
        </span>
        <button
          type="button"
          onClick={addStatement}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
        >
          + Añadir Afirmación V/F
        </button>
      </div>

      <div className="space-y-3">
        {block.statements.map(st => (
          <div key={st.id} className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={st.statement}
                onChange={e => {
                  onChange({
                    ...block,
                    statements: block.statements.map(s => s.id === st.id ? { ...s, statement: e.target.value } : s)
                  });
                }}
                placeholder="Afirmación a evaluar..."
                className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
              {/* V or F buttons */}
              <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      ...block,
                      statements: block.statements.map(s => s.id === st.id ? { ...s, isTrue: true } : s)
                    });
                  }}
                  className={`px-3 py-1 text-xs font-bold ${
                    st.isTrue ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  V
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      ...block,
                      statements: block.statements.map(s => s.id === st.id ? { ...s, isTrue: false } : s)
                    });
                  }}
                  className={`px-3 py-1 text-xs font-bold ${
                    !st.isTrue ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  F
                </button>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...block, statements: block.statements.filter(s => s.id !== st.id) })}
                className="p-1.5 text-zinc-500 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={st.explanation}
              onChange={e => {
                onChange({
                  ...block,
                  statements: block.statements.map(s => s.id === st.id ? { ...s, explanation: e.target.value } : s)
                });
              }}
              placeholder="Explicación breve de retroalimentación..."
              className="w-full px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-zinc-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// 9. Slider Estimador
const SliderEstimatorEditor: React.FC<{ block: SliderEstimatorBlockData; onChange: (b: InteractiveBlock) => void }> = ({ block, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-zinc-300">Pregunta o métrica a estimar:</label>
      <input
        type="text"
        value={block.prompt}
        onChange={e => onChange({ ...block, prompt: e.target.value })}
        placeholder="¿En qué año se publicó...? o ¿Cuántas unidades...?"
        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <div>
        <label className="text-[11px] text-zinc-400">Mínimo:</label>
        <input
          type="number"
          value={block.min}
          onChange={e => onChange({ ...block, min: Number(e.target.value) })}
          className="w-full mt-0.5 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
        />
      </div>
      <div>
        <label className="text-[11px] text-zinc-400">Máximo:</label>
        <input
          type="number"
          value={block.max}
          onChange={e => onChange({ ...block, max: Number(e.target.value) })}
          className="w-full mt-0.5 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
        />
      </div>
      <div>
        <label className="text-[11px] text-emerald-400 font-bold">Valor Real:</label>
        <input
          type="number"
          value={block.correctValue}
          onChange={e => onChange({ ...block, correctValue: Number(e.target.value) })}
          className="w-full mt-0.5 px-2 py-1.5 bg-zinc-800 border border-emerald-500 rounded-lg text-xs text-zinc-100"
        />
      </div>
      <div>
        <label className="text-[11px] text-zinc-400">Tolerancia (±):</label>
        <input
          type="number"
          value={block.tolerance}
          onChange={e => onChange({ ...block, tolerance: Number(e.target.value) })}
          className="w-full mt-0.5 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
        />
      </div>
      <div>
        <label className="text-[11px] text-zinc-400">Unidad:</label>
        <input
          type="text"
          value={block.unit}
          onChange={e => onChange({ ...block, unit: e.target.value })}
          placeholder="años, %, etc"
          className="w-full mt-0.5 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
        />
      </div>
    </div>

    <div>
      <label className="text-xs font-semibold text-zinc-300">Explicación del valor:</label>
      <input
        type="text"
        value={block.explanation}
        onChange={e => onChange({ ...block, explanation: e.target.value })}
        placeholder="Dato histórico o referencia del cálculo..."
        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
      />
    </div>
  </div>
);
