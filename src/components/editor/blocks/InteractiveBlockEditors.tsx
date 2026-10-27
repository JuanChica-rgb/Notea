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
import { MathText, formulaAt, formulaSlots } from '../../common/MathText';
import { ImageCropDialog } from '../../common/ImageCropDialog';
import { ImagePickDialog } from '../../common/ImagePickDialog';
import { useApp } from '../../../context/AppContext';
import { storage } from '../../../lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Plus, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

const FORMULAS = [
  { label: 'Fracción', icon: '\\frac{a}{b}', template: '\\frac{}{}', cursor: 6 },
  { label: 'Integral', icon: '\\int', template: '\\int_{}^{}', cursor: 6 },
  { label: 'Derivada', icon: '\\frac{d}{dx}', template: '\\frac{d}{dx}', cursor: 12 },
  { label: 'Exponente', icon: 'x^{2}', template: '^{}', cursor: 2 },
  { label: 'Subíndice', icon: 'x_{1}', template: '_{}', cursor: 2 },
  { label: 'Raíz', icon: '\\sqrt{x}', template: '\\sqrt{}', cursor: 6 },
  { label: 'Sumatoria', icon: '\\sum', template: '\\sum_{}^{}', cursor: 6 },
  { label: 'Límite', icon: '\\lim', template: '\\lim_{}', cursor: 6 },
  { label: 'Más menos', icon: '\\pm', template: '\\pm', cursor: 3 },
  { label: 'Infinito', icon: '\\infty', template: '\\infty', cursor: 6 },
  { label: 'Paréntesis', icon: '\\left(x\\right)', template: '\\left({}\\right)', cursor: 7 },
];

function isFormulaField(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (target instanceof HTMLTextAreaElement) return true;
  if (!(target instanceof HTMLInputElement) || target.type !== 'text') return false;
  const hint = `${target.placeholder} ${target.getAttribute('aria-label') || ''}`.toLowerCase();
  return !hint.includes('http') && !hint.includes('imagen') && !hint.includes('url');
}

type FormulaField = HTMLInputElement | HTMLTextAreaElement;
type Composer = { start: number | null; end: number | null; cursor: number };

function writeField(field: FormulaField, next: string, cursor: number) {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  const tracker = (field as HTMLInputElement & { _valueTracker?: { setValue: (value: string) => void } })._valueTracker;
  tracker?.setValue(field.value);
  setter?.call(field, next);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  requestAnimationFrame(() => {
    field.focus();
    field.setSelectionRange(cursor, cursor);
  });
}

function holeIn(value: string, start: number, end: number) {
  const slots = formulaSlots(value).filter(slot => slot.open >= start && slot.close < end);
  const empty = slots.find(slot => slot.close === slot.open + 1);
  const slot = empty ?? slots[0];
  return slot ? slot.open + 1 : start + 1;
}

function adjacentSlot(value: string, cursor: number, backward: boolean, start: number, end: number) {
  const slots = formulaSlots(value).filter(slot => slot.open >= start && slot.close < end);
  if (backward) {
    for (let i = slots.length - 1; i >= 0; i -= 1) {
      if (slots[i].open + 1 < cursor) return slots[i].open + 1;
    }
    return null;
  }
  for (const slot of slots) {
    if (slot.open + 1 > cursor) return slot.open + 1;
  }
  return null;
}

type FieldBox = {
  top: number;
  left: number;
  width: number;
  fieldTop: number;
  height: number;
  padding: string;
  font: string;
  lineHeight: string;
};

function useStudyImage(onUrl: (url?: string) => void) {
  const { user, showToast } = useApp();
  const onUrlRef = React.useRef(onUrl);
  onUrlRef.current = onUrl;
  const [cropFile, setCropFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const accept = (file?: File) => {
    if (!file) return;
    const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)) {
      showToast('Usa una foto JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('La foto debe pesar menos de 8 MB.');
      return;
    }
    setCropFile(file);
  };

  const confirm = async (file: File) => {
    setCropFile(null);
    if (!user.id || user.isGuest) {
      showToast('Entra con tu cuenta para subir la imagen.');
      return;
    }
    setUploading(true);
    try {
      const storageRef = ref(storage, `content/${user.id}/${Date.now()}_imagen.jpg`);
      const snapshot = await uploadBytes(storageRef, file, { contentType: 'image/jpeg' });
      onUrlRef.current(await getDownloadURL(snapshot.ref));
    } catch (error) {
      console.error(error);
      showToast('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return { accept, confirm, uploading, cropFile, setCropFile, clear: () => onUrlRef.current(undefined) };
}

function measureField(field: FormulaField, parent: DOMRect): FieldBox {
  const rect = field.getBoundingClientRect();
  const style = window.getComputedStyle(field);
  return {
    top: rect.bottom - parent.top + 6,
    left: rect.left - parent.left,
    width: rect.width,
    fieldTop: rect.top - parent.top,
    height: rect.height,
    padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
    font: style.font,
    lineHeight: style.lineHeight,
  };
}

interface BlockEditorProps {
  block: InteractiveBlock;
  onChange: (updated: InteractiveBlock) => void;
  onDelete: () => void;
  isGameContent?: boolean;
  expectsTime?: boolean;
  onMove?: (direction: 'up' | 'down') => void;
}

export const InteractiveBlockEditor: React.FC<BlockEditorProps> = ({ block, onChange, onDelete, isGameContent, expectsTime, onMove }) => {
  const usesInteractiveImage = block.type === 'error_detect' || block.type === 'hotspot';
  const boxRef = React.useRef<HTMLDivElement>(null);
  const keepPanel = React.useRef(false);
  const imageUpload = useStudyImage(url => onChange({ ...block, imageUrl: url }));
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const surfaceFields = React.useRef<FormulaField[]>([]);
  const [formulaField, setFormulaField] = React.useState<FormulaField | null>(null);
  const [composer, setComposer] = React.useState<Composer | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [formulaAnchor, setFormulaAnchor] = React.useState<FieldBox | null>(null);
  const [surfaces, setSurfaces] = React.useState<Array<FieldBox & { value: string; id: string }>>([]);

  const placeTemplate = (template: string, cursorInTemplate: number) => {
    if (!formulaField || !composer) return;
    const value = formulaField.value;
    if (composer.start == null) {
      const at = formulaField.selectionStart ?? composer.cursor;
      const wrapped = `$${template}$`;
      writeField(formulaField, value.slice(0, at) + wrapped + value.slice(at), at + 1 + cursorInTemplate);
      setComposer({ start: at, end: at + wrapped.length, cursor: at + 1 + cursorInTemplate });
      return;
    }
    const at = composer.cursor;
    writeField(formulaField, value.slice(0, at) + template + value.slice(at), at + cursorInTemplate);
    setComposer({ start: composer.start, end: composer.end! + template.length, cursor: at + cursorInTemplate });
  };

  const openFormula = (field: FormulaField, start: number, end: number) => {
    const cursor = holeIn(field.value, start, end);
    field.focus();
    field.setSelectionRange(cursor, cursor);
    setFormulaField(field);
    setComposer({ start, end, cursor });
    setPanelOpen(true);
  };

  React.useLayoutEffect(() => {
    const root = boxRef.current;
    if (!root) return;
    const fields = [...root.querySelectorAll('textarea, input')].filter(isFormulaField);
    surfaceFields.current = fields;
    fields.forEach((field, index) => {
      field.dataset.noteaField = String(index);
      const editing = field === formulaField && composer?.start != null;
      const inSlot = editing && formulaSlots(field.value).some(slot => composer.cursor > slot.open && composer.cursor <= slot.close);
      field.classList.toggle('notea-formula-source', field.value.includes('$'));
      field.classList.toggle('notea-formula-in-slot', inSlot);
    });
    const parent = root.getBoundingClientRect();
    setSurfaces(fields.filter(field => field.value.includes('$')).map(field => ({
      ...measureField(field, parent),
      value: field.value,
      id: field.dataset.noteaField || '',
    })));
    if (formulaField?.isConnected) setFormulaAnchor(measureField(formulaField, parent));
    else setFormulaAnchor(null);
  }, [formulaField, composer, block]);

  const openFormulaPanel = () => {
    const field = (formulaField?.isConnected ? formulaField : null) ?? surfaceFields.current[0];
    if (!field) return;
    const cursor = field.selectionStart ?? field.value.length;
    keepPanel.current = true;
    field.focus();
    setFormulaField(field);
    setComposer({ start: null, end: null, cursor });
    setPanelOpen(true);
  };

  return (
    <div
      ref={boxRef}
      className="relative p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-4 hover:border-zinc-700/80 transition-all text-left"
      onFocus={event => {
        if (!isFormulaField(event.target)) {
          setFormulaField(null);
          setComposer(null);
          setPanelOpen(false);
          return;
        }
        const cursor = event.target.selectionStart ?? 0;
        const keep = keepPanel.current;
        keepPanel.current = false;
        setFormulaField(event.target);
        setComposer({ start: null, end: null, cursor });
        setPanelOpen(keep);
      }}
      onSelect={event => {
        if (!isFormulaField(event.target)) return;
        const field = event.target;
        const cursor = field.selectionStart ?? 0;
        setComposer(current => {
          if (current?.start != null && current.end != null && cursor > current.start && cursor < current.end) return { ...current, cursor };
          return { start: null, end: null, cursor };
        });
        setPanelOpen(currentOpen => {
          if (!currentOpen) return false;
          const hit = formulaAt(field.value, cursor);
          return hit != null && cursor > hit.start && cursor < hit.end;
        });
      }}
      onKeyUp={event => {
        if (!isFormulaField(event.target)) return;
        const cursor = event.target.selectionStart ?? 0;
        setComposer(current => {
          if (current?.start != null && current.end != null && cursor > current.start && cursor < current.end) return { ...current, cursor };
          return { start: null, end: null, cursor };
        });
      }}
      onKeyDown={event => {
        if (!isFormulaField(event.target) || !composer || composer.start == null || composer.end == null) return;
        const field = event.target;
        const value = field.value;
        if (value[composer.start] !== '$') {
          setComposer({ start: null, end: null, cursor: field.selectionStart ?? 0 });
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setComposer({ start: null, end: null, cursor: composer.end });
          field.setSelectionRange(composer.end, composer.end);
          return;
        }
        if (event.key === 'Tab') {
          const next = adjacentSlot(value, composer.cursor, event.shiftKey, composer.start, composer.end);
          if (next == null) return;
          event.preventDefault();
          field.setSelectionRange(next, next);
          setComposer({ ...composer, cursor: next });
          return;
        }
        if (event.key === 'Backspace') {
          event.preventDefault();
          if (composer.cursor <= composer.start + 1) {
            const inner = value.slice(composer.start + 1, composer.end - 1);
            if (!inner) {
              writeField(field, value.slice(0, composer.start) + value.slice(composer.end), composer.start);
              setComposer({ start: null, end: null, cursor: composer.start });
            }
            return;
          }
          writeField(field, value.slice(0, composer.cursor - 1) + value.slice(composer.cursor), composer.cursor - 1);
          setComposer({ start: composer.start, end: composer.end - 1, cursor: composer.cursor - 1 });
          return;
        }
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey || event.key === '$') return;
        event.preventDefault();
        writeField(field, value.slice(0, composer.cursor) + event.key + value.slice(composer.cursor), composer.cursor + 1);
        setComposer({ start: composer.start, end: composer.end + 1, cursor: composer.cursor + 1 });
      }}
      onBlur={event => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setFormulaField(null);
        setComposer(null);
        setPanelOpen(false);
      }}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div
          className="flex items-center gap-2"
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            imageUpload.accept(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
            {getBlockTypeName(block.type)}
          </span>
          <button
            type="button"
            onClick={() => setImagePickerOpen(true)}
            className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              block.imageUrl
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {imageUpload.uploading ? 'Subiendo...' : block.imageUrl ? 'Cambiar imagen' : 'Adjuntar imagen'}
          </button>
          <button
            type="button"
            aria-label="Insertar fórmula"
            title="Insertar fórmula"
            onMouseDown={event => event.preventDefault()}
            onClick={openFormulaPanel}
            className="notea-formula-btn px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-100 hover:bg-indigo-600"
          >
            <MathText text={"$\\sqrt{x}$"} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove?.('up')} className="p-1.5 text-zinc-500 hover:text-indigo-400 rounded-lg" title="Subir bloque">↑</button>
          <button type="button" onClick={() => onMove?.('down')} className="p-1.5 text-zinc-500 hover:text-indigo-400 rounded-lg" title="Bajar bloque">↓</button>
          <button type="button" onClick={onDelete} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Eliminar este bloque">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isGameContent && block.type !== 'content_card' && (
        <div className={`grid grid-cols-1 ${expectsTime ? 'sm:grid-cols-2' : ''} gap-3 p-3 bg-zinc-950/40 rounded-xl border border-zinc-800`}>
          <label className="text-xs font-semibold text-zinc-300">Puntos (máx. 20)
            <input
              type="number"
              min="0"
              max="20"
              value={block.basePoints ?? 10}
              onChange={event => onChange({ ...block, basePoints: Math.min(20, Math.max(0, Number(event.target.value) || 0)) })}
              className="w-full mt-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
            />
          </label>
          {expectsTime && (
            <label className="text-xs font-semibold text-zinc-300">Tiempo esperado (segundos)
              <input
                type="number"
                min="1"
                value={block.estimatedTimeSeconds && block.estimatedTimeSeconds > 0 ? block.estimatedTimeSeconds : 30}
                onChange={event => onChange({ ...block, estimatedTimeSeconds: Math.max(1, Number(event.target.value) || 1) })}
                className="w-full mt-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
              />
            </label>
          )}
        </div>
      )}

      {!usesInteractiveImage && block.imageUrl && (
        <div className="relative rounded-xl border border-zinc-800 overflow-hidden bg-black/40">
          <img src={block.imageUrl} alt="Imagen del bloque" className="w-full aspect-video object-contain" referrerPolicy="no-referrer" />
          <button
            type="button"
            onClick={imageUpload.clear}
            className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-xs text-zinc-200 hover:text-rose-300"
          >
            Quitar
          </button>
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
        <ErrorDetectEditor block={block} onChange={onChange} onPickImage={() => setImagePickerOpen(true)} onImageFile={imageUpload.accept} />
      )}
      {block.type === 'hotspot' && (
        <HotspotEditor block={block} onChange={onChange} onPickImage={() => setImagePickerOpen(true)} onImageFile={imageUpload.accept} />
      )}
      {block.type === 'true_false_rush' && (
        <TrueFalseRushEditor block={block} onChange={onChange} />
      )}
      {block.type === 'slider_estimator' && (
        <SliderEstimatorEditor block={block} onChange={onChange} />
      )}

      {surfaces.map(surface => {
        const field = surfaceFields.current.find(item => item.dataset.noteaField === surface.id);
        const active = field === formulaField;
        return (
          <div
            key={surface.id}
            className="notea-formula-overlay absolute z-10 overflow-visible text-zinc-100 whitespace-pre-wrap"
            style={{
              top: surface.fieldTop,
              left: surface.left,
              width: surface.width,
              minHeight: surface.height,
              padding: surface.padding,
              font: surface.font,
              lineHeight: surface.lineHeight,
            }}
          >
            <MathText
              text={surface.value}
              showSlots
              activeCursor={active ? composer?.cursor ?? null : null}
              onFormulaClick={(start, end) => {
                if (field) openFormula(field, start, end);
              }}
            />
          </div>
        );
      })}

      {formulaField && formulaAnchor && panelOpen && composer && (
        <div
          className="absolute z-20"
          style={{
            top: formulaAnchor.top + (composer.start != null && /\\(frac|sum|lim|int|sqrt|left)/.test(formulaField.value.slice(composer.start, composer.end ?? composer.start)) ? 22 : 0),
            left: formulaAnchor.left,
            width: Math.max(formulaAnchor.width, 320),
          }}
          onMouseDown={event => event.preventDefault()}
        >
          <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-1.5 shadow-xl space-y-1">
            {composer.start != null && composer.end != null && (
              <div className="px-2 py-1.5 text-lg text-zinc-100">
                <MathText
                  text={formulaField.value.slice(composer.start, composer.end)}
                  showSlots
                  activeCursor={composer.cursor - composer.start}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {FORMULAS.map(item => (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => placeTemplate(item.template, item.cursor)}
                  className="notea-formula-btn px-2.5 py-1 rounded-lg text-zinc-100 bg-zinc-800 hover:bg-indigo-600 hover:text-white"
                >
                  <MathText text={`$${item.icon}$`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {imagePickerOpen && (
        <ImagePickDialog
          title="Adjuntar imagen"
          onCancel={() => setImagePickerOpen(false)}
          onFile={file => {
            setImagePickerOpen(false);
            imageUpload.accept(file);
          }}
        />
      )}
      {imageUpload.cropFile && (
        <ImageCropDialog
          file={imageUpload.cropFile}
          aspect={16 / 9}
          title="Ajusta la imagen"
          onCancel={() => imageUpload.setCropFile(null)}
          onConfirm={imageUpload.confirm}
        />
      )}
    </div>
  );
};

const RadiusZone: React.FC<{
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
  label?: string;
  colorClass?: string;
}> = ({ xPercent, yPercent, radiusPercent, label, colorClass = 'border-rose-400 bg-rose-500/25' }) => (
  <>
    <div
      className={`absolute rounded-full border-[3px] shadow-[0_0_0_2px_rgba(0,0,0,0.45)] pointer-events-none ${colorClass}`}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: `${Math.max(radiusPercent * 2, 6)}%`,
        aspectRatio: '1 / 1',
        transform: 'translate(-50%, -50%)',
      }}
    />
    <div
      className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-zinc-900 shadow-lg pointer-events-none"
      style={{ left: `${xPercent}%`, top: `${yPercent}%`, transform: 'translate(-50%, -50%)' }}
    />
    {label && (
      <span
        className="absolute px-1.5 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white pointer-events-none whitespace-nowrap"
        style={{ left: `${xPercent}%`, top: `${yPercent}%`, transform: 'translate(-50%, calc(-50% - 1.15rem))' }}
      >
        {label}
      </span>
    )}
  </>
);

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
        {block.mode === 'multiple_choice' ? (
          <>
            <label className="text-xs font-semibold text-emerald-400">Opción correcta:</label>
            <select
              value={block.correctOptionIndex ?? Math.max(0, block.options.findIndex(option => option === block.correctAnswer))}
              onChange={e => {
                const index = Number(e.target.value);
                onChange({ ...block, correctOptionIndex: index, correctAnswer: block.options[index] || '' });
              }}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-emerald-500/50 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              {block.options.map((option, index) => (
                <option key={index} value={index}>{String.fromCharCode(65 + index)}: {option || 'Sin texto'}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label className="text-xs font-semibold text-emerald-400">Respuesta Correcta:</label>
            <input
              type="text"
              value={block.correctAnswer}
              onChange={e => onChange({ ...block, correctAnswer: e.target.value })}
              placeholder="Ej: cos(x)"
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-emerald-500/50 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </>
        )}
      </div>
      {block.mode === 'free_text' && (
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
      )}
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
const ErrorDetectEditor: React.FC<{ block: ErrorDetectBlockData; onChange: (b: InteractiveBlock) => void; onPickImage: () => void; onImageFile: (file?: File) => void }> = ({ block, onChange, onPickImage, onImageFile }) => {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [placed, setPlaced] = React.useState(
    block.targetZone.xPercent !== 50 || block.targetZone.yPercent !== 50 || block.targetZone.radiusPercent !== 15
  );
  const [imageBox, setImageBox] = React.useState({ left: 0, top: 0, width: 100, height: 100 });

  const syncImageBox = React.useCallback(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img?.naturalWidth) return;
    const containerRatio = wrap.clientWidth / wrap.clientHeight;
    const imageRatio = img.naturalWidth / img.naturalHeight;
    let renderWidth = wrap.clientWidth;
    let renderHeight = wrap.clientHeight;
    let offsetX = 0;
    let offsetY = 0;
    if (imageRatio > containerRatio) {
      renderHeight = wrap.clientWidth / imageRatio;
      offsetY = (wrap.clientHeight - renderHeight) / 2;
    } else {
      renderWidth = wrap.clientHeight * imageRatio;
      offsetX = (wrap.clientWidth - renderWidth) / 2;
    }
    setImageBox({
      left: (offsetX / wrap.clientWidth) * 100,
      top: (offsetY / wrap.clientHeight) * 100,
      width: (renderWidth / wrap.clientWidth) * 100,
      height: (renderHeight / wrap.clientHeight) * 100,
    });
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setPlaced(true);
    onChange({
      ...block,
      targetZone: {
        ...block.targetZone,
        xPercent: x,
        yPercent: y,
        radiusPercent: block.targetZone.radiusPercent || 12,
      }
    });
  };

  const showMark = placed;

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

      <div className="rounded-2xl border border-zinc-700 bg-zinc-950/70 overflow-visible">
        <div
          className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2"
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            onImageFile(event.dataTransfer.files?.[0]);
          }}
        >
          <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
          <button type="button" onClick={onPickImage} className="text-xs font-semibold text-zinc-200 hover:text-white">
            {block.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </button>
          <span className="text-[11px] text-zinc-500">o arrástrala aquí. Luego marca el error.</span>
        </div>

        {block.imageUrl ? (
          <div
            ref={wrapRef}
            className="relative aspect-[16/9] w-full bg-black cursor-crosshair overflow-visible rounded-b-2xl"
          >
            <img
              ref={imgRef}
              src={block.imageUrl}
              alt="Detección de error"
              className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
              referrerPolicy="no-referrer"
              onLoad={syncImageBox}
            />
            <div
              onClick={handleImageClick}
              className="absolute"
              style={{
                left: `${imageBox.left}%`,
                top: `${imageBox.top}%`,
                width: `${imageBox.width}%`,
                height: `${imageBox.height}%`,
              }}
            >
              {!showMark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="px-3 py-1.5 rounded-lg bg-black/70 text-[11px] font-semibold text-zinc-200">
                    Haz clic para marcar el punto y ajustar su radio
                  </span>
                </div>
              )}
              {showMark && (
                <>
                  <RadiusZone
                    xPercent={block.targetZone.xPercent}
                    yPercent={block.targetZone.yPercent}
                    radiusPercent={block.targetZone.radiusPercent}
                    label="Punto marcado"
                    colorClass="border-rose-400 bg-rose-500/35"
                  />
                  <div
                    className="absolute z-20 w-44 p-2 rounded-xl bg-zinc-900/95 border border-rose-500/40 shadow-xl"
                    style={{
                      left: `${block.targetZone.xPercent}%`,
                      top: `${Math.min(92, block.targetZone.yPercent + Math.max(block.targetZone.radiusPercent, 8))}%`,
                      transform: 'translate(-50%, 10px)',
                    }}
                    onClick={event => event.stopPropagation()}
                  >
                    <label className="flex items-center justify-between text-[10px] font-bold text-rose-200 uppercase tracking-wide">
                      Radio de tolerancia
                      <span className="font-mono text-rose-300">{block.targetZone.radiusPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="40"
                      value={block.targetZone.radiusPercent}
                      onChange={e => onChange({ ...block, targetZone: { ...block.targetZone, radiusPercent: Number(e.target.value) } })}
                      className="w-full mt-1 accent-rose-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="px-3 py-8 text-center text-xs text-zinc-500">Sube una foto para marcar el error.</p>
        )}
      </div>

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
const HotspotEditor: React.FC<{ block: HotspotBlockData; onChange: (b: InteractiveBlock) => void; onPickImage: () => void; onImageFile: (file?: File) => void }> = ({ block, onChange, onPickImage, onImageFile }) => {
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
      radiusPercent: 8,
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

      <div
        className="flex items-center gap-2"
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault();
          onImageFile(event.dataTransfer.files?.[0]);
        }}
      >
        <button type="button" onClick={onPickImage} className="text-xs px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-200 hover:text-white">
          {block.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        <span className="text-[11px] text-zinc-500">o arrástrala aquí</span>
      </div>

      {block.imageUrl && (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400">Haz clic sobre la imagen para añadir un punto. El círculo es el radio de tolerancia.</p>
          <div 
            ref={imgRef}
            onClick={handleImageClick}
            className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-zinc-700 cursor-crosshair bg-black"
          >
            <img src={block.imageUrl} alt="Diagram" className="w-full h-full object-contain select-none" referrerPolicy="no-referrer" />
            {block.hotspots.map((point, index) => (
              <RadiusZone
                key={point.id}
                xPercent={point.xPercent}
                yPercent={point.yPercent}
                radiusPercent={point.radiusPercent ?? 8}
                label={`${index + 1}`}
                colorClass="border-indigo-400 bg-indigo-500/25"
              />
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
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={pt.radiusPercent ?? 8}
                  onChange={e => onChange({ ...block, hotspots: block.hotspots.map(h => h.id === pt.id ? { ...h, radiusPercent: Number(e.target.value) } : h) })}
                  className="w-24 accent-indigo-500"
                  aria-label="Radio de tolerancia"
                />
                <span className="text-[10px] font-mono text-indigo-300 w-8">{pt.radiusPercent ?? 8}%</span>
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
