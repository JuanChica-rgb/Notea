import React, { useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { isNoteaAdmin, useApp } from '../../context/AppContext';
import { storage } from '../../lib/firebase';
import { 
  InteractiveBlock, 
  ContentType, 
  BlockType, 
  StudyItemCard 
} from '../../types';
import { VISUAL_TEMPLATES } from '../../data/mockData';
import { matchCatalogItem, sortedUniqueSubjects } from '../../utils/catalog';
import { applyExpectedTime } from '../../utils/scoring';
import { CatalogSearch } from '../common/CatalogSearch';
import { ImageCropDialog } from '../common/ImageCropDialog';
import { ImagePickDialog } from '../common/ImagePickDialog';
import { AdminScriptPanel } from './AdminScriptPanel';
import { InteractiveBlockEditor } from './blocks/InteractiveBlockEditors';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  Palette, 
  Sparkles, 
  HelpCircle,
  Hash,
  BookOpen,
  Gamepad2,
  Check
} from 'lucide-react';

export const NotebookEditor: React.FC = () => {
  const { 
    user, 
    editorContentType, 
    editingCardId, 
    cards, 
    addCard, 
    updateCard, 
    setCurrentView,
    showToast,
    universities,
    subjects
  } = useApp();

  const editingCard = cards.find(c => c.id === editingCardId);

  // Form Fields
  const [contentType, setContentType] = useState<ContentType>(
    editingCard?.contentType || editorContentType || 'material'
  );
  const [title, setTitle] = useState(editingCard?.title || '');
  const [description, setDescription] = useState(editingCard?.description || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    editingCard?.visibility === 'public' ? 'public' : 'private'
  );
  const catalogSubjects = sortedUniqueSubjects(subjects);
  const [subjectName, setSubjectName] = useState(editingCard?.subjectName || '');
  const [universityName, setUniversityName] = useState(editingCard?.universityName || '');
  const [accessCode, setAccessCode] = useState(
    editingCard?.accessCode || `${subjectName.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'NOTE'}-${Math.floor(10 + Math.random() * 90)}`
  );

  // Cover Personalization (Google Classroom style)
  const [coverType, setCoverType] = useState<'gradient' | 'image' | 'color'>(
    editingCard?.coverType || 'gradient'
  );
  const [coverValue, setCoverValue] = useState<string>(
    editingCard?.coverValue || VISUAL_TEMPLATES[0].value
  );
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  // Blocks array
  const [blocks, setBlocks] = useState<InteractiveBlock[]>(() => {
    if (editingCard?.blocks && editingCard.blocks.length > 0) {
      return editingCard.blocks;
    }
    // Default starting block
    return [
      {
        id: `blk_${Date.now()}`,
        type: 'content_card',
        title: 'Introducción al tema',
        body: 'Escribe aquí la base teórica o los puntos esenciales que se deben dominar.'
      }
    ];
  });

  // Slash menu `/` and floating menu
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearch, setSlashSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Available block types filtered by contentType rule:
  // "En el Material de Estudio están disponibles absolutamente todas las opciones.
  // En Juegos Competitivos/Ráfaga no se usan las flashcards tradicionales como evaluación principal,
  // ambas tienen bloque Tarjeta de Contenido (Texto/Imagen)".
  const blockCatalog: { type: BlockType; name: string; desc: string; icon: string; forGame: boolean }[] = [
    { type: 'content_card', name: 'Tarjeta de Contenido (Texto/Imagen)', desc: 'Explicación teórica o recordatorio esencial', icon: '📝', forGame: true },
    { type: 'flashcard', name: 'Flashcard Activa 3D', desc: 'Tarjeta 3D que se voltea con auto-evaluación', icon: '📇', forGame: false },
    { type: 'connect', name: 'Conectar / Relacionar', desc: 'Dos columnas limpias A y B para emparejar términos', icon: '🔗', forGame: true },
    { type: 'sequence', name: 'Organización / Secuencia', desc: 'Ordenar pasos o cronologías lógicas', icon: '🔢', forGame: true },
    { type: 'fill_blank', name: 'Rellenar Espacios', desc: 'Opción múltiple o escritura libre case-insensitive', icon: '✍️', forGame: true },
    { type: 'swipe_classify', name: 'Clasificación Rápida (Swipe)', desc: '2 categorías o cajitas inferiores', icon: '↔️', forGame: true },
    { type: 'error_detect', name: 'Detección de Error', desc: 'CAPTCHA interactivo tocando la zona del error', icon: '🎯', forGame: true },
    { type: 'hotspot', name: 'Diagrama / Hotspot', desc: 'Puntos interactivos en orden estricto o libre', icon: '📍', forGame: true },
    { type: 'true_false_rush', name: 'Ráfaga Verdadero / Falso', desc: 'Carrusel con feedback verde/rojo en tiempo real', icon: '⚡', forGame: true },
    { type: 'slider_estimator', name: 'Slider Estimador', desc: 'Barra numérica deslizante con rango y tolerancia', icon: '🎚️', forGame: true },
  ];

  const allowedCatalog = blockCatalog.filter(b => contentType === 'material' || b.forGame);

  const filteredCatalog = allowedCatalog.filter(b => 
    b.name.toLowerCase().includes(slashSearch.toLowerCase()) || 
    b.desc.toLowerCase().includes(slashSearch.toLowerCase())
  );

  const handleAddBlock = (type: BlockType) => {
    let newBlock: InteractiveBlock;
    const id = `blk_${Date.now()}`;

    switch (type) {
      case 'content_card':
        newBlock = { id, type, title: 'Concepto Clave', body: 'Detalle de la nota o mnemotecnia importante.' };
        break;
      case 'flashcard':
        newBlock = { id, type, question: '¿Cuál es la pregunta clave?', answer: 'Respuesta detallada para memorizar.' };
        break;
      case 'connect':
        newBlock = { 
          id, 
          type, 
          prompt: 'Relaciona los conceptos de la columna A con sus definiciones:', 
          pairs: [
            { id: 'p1', left: 'Concepto 1', right: 'Definición 1' },
            { id: 'p2', left: 'Concepto 2', right: 'Definición 2' }
          ] 
        };
        break;
      case 'sequence':
        newBlock = {
          id,
          type,
          prompt: 'Ordena de forma correcta los siguientes pasos:',
          items: [
            { id: 's1', text: 'Paso Inicial', correctOrder: 1 },
            { id: 's2', text: 'Paso Intermedio', correctOrder: 2 },
            { id: 's3', text: 'Paso Final', correctOrder: 3 }
          ]
        };
        break;
      case 'fill_blank':
        newBlock = {
          id,
          type,
          sentence: 'El concepto principal de este tema es [Respuesta].',
          mode: 'free_text',
          options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correctAnswer: 'Respuesta',
          explanation: 'Explicación del porqué esta es la respuesta válida.'
        };
        break;
      case 'swipe_classify':
        newBlock = {
          id,
          type,
          prompt: 'Clasifica los siguientes elementos en la categoría correcta:',
          categories: ['Categoría Alfa', 'Categoría Beta'],
          items: [
            { id: 'i1', text: 'Elemento A', category: 'Categoría Alfa' },
            { id: 'i2', text: 'Elemento B', category: 'Categoría Beta' }
          ]
        };
        break;
      case 'error_detect':
        newBlock = {
          id,
          type,
          instruction: 'Toca exactamente sobre el error o punto clave en la imagen:',
          imageUrl: 'https://images.unsplash.com/photo-1516116211227-bbc13c74410c?auto=format&fit=crop&w=800&q=80',
          targetZone: { xPercent: 50, yPercent: 50, radiusPercent: 15 },
          explanation: 'Punto exacto donde se encuentra la anomalía.'
        };
        break;
      case 'hotspot':
        newBlock = {
          id,
          type,
          instruction: 'Identifica los puntos del diagrama:',
          isSequential: false,
          imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
          hotspots: [
            { id: 'h1', label: 'Estructura 1', xPercent: 35, yPercent: 40, stepOrder: 1, radiusPercent: 8 },
            { id: 'h2', label: 'Estructura 2', xPercent: 65, yPercent: 50, stepOrder: 2, radiusPercent: 8 }
          ]
        };
        break;
      case 'true_false_rush':
        newBlock = {
          id,
          type,
          statements: [
            { id: 'tf1', statement: 'Esta afirmación sobre el tema es correcta.', isTrue: true, explanation: 'Verdadero por la definición estándar.' },
            { id: 'tf2', statement: 'Esta otra afirmación contiene un error conceptual.', isTrue: false, explanation: 'Falso debido a la propiedad fundamental.' }
          ]
        };
        break;
      case 'slider_estimator':
        newBlock = {
          id,
          type,
          prompt: 'Aproxima el valor o porcentaje correspondiente:',
          min: 0,
          max: 100,
          unit: '%',
          correctValue: 75,
          tolerance: 5,
          explanation: 'El valor estándar verificado es 75%.'
        };
        break;
    }

    const gameUsesTime = contentType === 'game' && blocks.some(item => item.type !== 'content_card' && (item.estimatedTimeSeconds ?? 0) > 0);
    const blockToAdd = gameUsesTime && newBlock.type !== 'content_card'
      ? { ...newBlock, estimatedTimeSeconds: 30 }
      : newBlock;
    setBlocks([...blocks, blockToAdd]);
    setShowSlashMenu(false);
    setSlashSearch('');
  };

  const handleUpdateBlock = (index: number, updated: InteractiveBlock) => {
    const next = [...blocks];
    next[index] = updated;
    setBlocks(next);
  };

  const handleDeleteBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setBlocks(next);
  };

  const expectsTime = contentType === 'game' && blocks.some(block => block.type !== 'content_card' && (block.estimatedTimeSeconds ?? 0) > 0);

  const setExpectedTime = (enabled: boolean) => {
    setBlocks(current => applyExpectedTime(current, enabled));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    if (!title.trim()) {
      showToast('Por favor escribe un título para tu contenido.');
      setIsSaving(false);
      return;
    }
    const university = matchCatalogItem(universities, universityName);
    const subject = matchCatalogItem(catalogSubjects, subjectName);
    if (!university || !subject) {
      const missing = !university && !subject
        ? 'una universidad y una materia'
        : !university ? 'una universidad' : 'una materia';
      showToast(universities.length === 0
        ? 'El catálogo todavía está cargando. Espera un momento y guarda otra vez.'
        : `Elige ${missing} del catálogo.`);
      setIsSaving(false);
      return;
    }

    const timed = contentType === 'game' && blocks.some(block => block.type !== 'content_card' && (block.estimatedTimeSeconds ?? 0) > 0);
    const blocksToSave = contentType === 'game' ? applyExpectedTime(blocks, timed) : blocks;

    const cardPayload = {
      title: title.trim(),
      description: description.trim() || 'Sin descripción.',
      contentType,
      accessCode: accessCode.trim().toUpperCase() || 'NOTE-99',
      subjectName: subject.name,
      universityName: university.name,
      semester: editingCard?.semester || 0,
      coverType,
      coverValue,
      visibility,
      blocks: blocksToSave,
    };

    if (editingCardId) {
      await updateCard(editingCardId, cardPayload);
    } else {
      const savedCard = await addCard(cardPayload);
      if (!savedCard) {
        setIsSaving(false);
        return;
      }
    }

    setCurrentView('library');
    setIsSaving(false);
  };

  const acceptCover = (file?: File) => {
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
    setCoverFile(file);
  };

  const confirmCover = async (file: File) => {
    setCoverFile(null);
    if (!user.id || user.isGuest) {
      showToast('Entra con tu cuenta para subir la imagen.');
      return;
    }
    setCoverUploading(true);
    try {
      const storageRef = ref(storage, `content/${user.id}/${Date.now()}_portada.jpg`);
      const snapshot = await uploadBytes(storageRef, file, { contentType: 'image/jpeg' });
      setCoverType('image');
      setCoverValue(await getDownloadURL(snapshot.ref));
      setShowCoverPicker(false);
    } catch (error) {
      console.error(error);
      showToast('No se pudo subir la portada.');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentView('library')}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Biblioteca
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : `Guardar ${contentType === 'material' ? 'Cuaderno' : 'Juego'}`}
          </button>
        </div>
      </div>

      {isNoteaAdmin(user) && (
        <AdminScriptPanel
          contentType={contentType}
          title={title}
          description={description}
          university={universityName}
          subject={subjectName}
          blocks={blocks}
          onApply={draft => {
            if (draft.contentType) setContentType(draft.contentType);
            if (draft.title) setTitle(draft.title);
            if (draft.description) setDescription(draft.description);
            if (draft.university) {
              const match = matchCatalogItem(universities, draft.university);
              setUniversityName(match?.name || draft.university);
            }
            if (draft.subject) {
              const match = matchCatalogItem(catalogSubjects, draft.subject);
              setSubjectName(match?.name || draft.subject);
            }
            setBlocks(draft.blocks);
            showToast('Guion aplicado. Revísalo y guarda cuando quieras.');
          }}
        />
      )}

      {/* Google Classroom Style Customizable Header Banner */}
      <div 
        style={
          coverType === 'image'
            ? { backgroundImage: `url(${coverValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: coverValue }
        }
        className="relative h-44 sm:h-52 w-full rounded-3xl overflow-hidden p-6 flex flex-col justify-between shadow-2xl border border-zinc-800"
      >
        <div className="absolute inset-0 bg-black/40" />

        {/* Top Cover Actions */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-black/50 border border-white/20 text-white flex items-center gap-1.5">
              {contentType === 'material' ? <BookOpen className="w-3.5 h-3.5" /> : <Gamepad2 className="w-3.5 h-3.5" />}
              {contentType === 'material' ? 'Cuaderno de Estudio' : 'Juego Competitivo'}
            </span>

            {/* Content Type Toggle button */}
            <button
              type="button"
              onClick={() => setContentType(contentType === 'material' ? 'game' : 'material')}
              className="text-[11px] font-semibold text-zinc-200 underline hover:text-white backdrop-blur-md px-2 py-0.5 rounded bg-black/30"
            >
              Cambiar a {contentType === 'material' ? 'Juego' : 'Cuaderno'}
            </button>
          </div>

          {/* Customize Banner Button */}
          <button
            type="button"
            onClick={() => setShowCoverPicker(!showCoverPicker)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md bg-black/60 hover:bg-black/80 border border-white/20 text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <Palette className="w-3.5 h-3.5" />
            Personalizar Portada
          </button>
        </div>

        {/* Access code indicator */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-black/70 backdrop-blur-md border border-white/20 rounded-lg text-zinc-100">
              CÓDIGO: {accessCode}
            </span>
          </div>
          <span className="text-xs text-zinc-300 backdrop-blur-md bg-black/40 px-2 py-0.5 rounded">
            @{user.username} • {user.university.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Cover Picker Modal/Drawer */}
      {showCoverPicker && (
        <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Elige un color o sube una foto
            </h4>
            <button
              type="button"
              onClick={() => setShowCoverPicker(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>

          {/* Preset Visual Templates */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {VISUAL_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setCoverType(tmpl.type);
                  setCoverValue(tmpl.value);
                }}
                style={
                  tmpl.type === 'image'
                    ? { backgroundImage: `url(${tmpl.value})`, backgroundSize: 'cover' }
                    : { background: tmpl.value }
                }
                className={`h-16 rounded-xl border-2 transition-transform hover:scale-105 relative ${
                  coverValue === tmpl.value ? 'border-white ring-2 ring-indigo-500' : 'border-zinc-700'
                }`}
                title={tmpl.name}
              />
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center gap-4">
            <button
              type="button"
              disabled={coverUploading}
              onClick={() => setCoverPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {coverUploading ? 'Subiendo...' : coverType === 'image' ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            {coverType === 'image' && (
              <button
                type="button"
                onClick={() => {
                  setCoverType('gradient');
                  setCoverValue(VISUAL_TEMPLATES[0].value);
                }}
                className="text-xs text-zinc-400 hover:text-rose-300"
              >
                Quitar imagen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Meta Information Inputs */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título del Cuaderno o Juego..."
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-display text-zinc-100 placeholder-zinc-600 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Escribe una breve descripción del objetivo o contenido para tus compañeros..."
            className="w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none resize-none"
          />
        </div>

        {/* Academic Details row */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-3">
          <CatalogSearch
            placeholder="Buscar universidad"
            selected={universityName}
            items={universities}
            emptyLabel="No hay universidades con ese nombre."
            onSelect={setUniversityName}
            onClear={() => setUniversityName('')}
          />
          <CatalogSearch
            placeholder="Buscar materia"
            selected={subjectName}
            items={catalogSubjects}
            emptyLabel="No hay materias con ese nombre."
            onSelect={setSubjectName}
            onClear={() => setSubjectName('')}
          />
          <p className="text-xs text-zinc-500">
            Código {editingCardId ? accessCode : 'se genera al guardar'}
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${visibility === 'private' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}
            >
              Privado
            </button>
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${visibility === 'public' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}
            >
              Público
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {visibility === 'public'
              ? 'Sale en Explorar. Cualquiera puede abrirlo.'
              : 'Solo está en tu biblioteca y en los cursos donde lo publiques.'}
          </p>
        </div>
      </div>

      {/* NOTION-STYLE CANVAS OF BLOCKS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Bloques del Lienzo ({blocks.length})
          </h3>

          <button
              type="button"
              onClick={() => setShowSlashMenu(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + Agregar Bloque o escribe /
            </button>
        </div>
        {contentType === 'game' && (
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={expectsTime}
              onChange={event => setExpectedTime(event.target.checked)}
              className="accent-indigo-500"
            />
            Tiempos esperados
            <span className="text-xs font-normal text-zinc-500">
              {expectsTime ? 'Todos llevan tiempo, menos la tarjeta de contenido.' : 'Ningún bloque lleva tiempo.'}
            </span>
          </label>
        )}

        {/* Render Blocks */}
        {blocks.map((block, index) => (
          <div key={block.id} className="relative group">
            <InteractiveBlockEditor
                block={block}
                onChange={updated => handleUpdateBlock(index, updated)}
                onDelete={() => handleDeleteBlock(index)}
                onMove={direction => handleMoveBlock(index, direction)}
                isGameContent={contentType === 'game'}
                expectsTime={expectsTime}
              />
          </div>
        ))}

        {/* Empty Canvas Prompt */}
        {blocks.length === 0 && (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
            <p className="text-sm">El lienzo está vacío. Agrega tu primer bloque interactivo.</p>
          </div>
        )}
      </div>

      {/* SLASH COMMAND ( / ) FLOATING CATALOG MODAL */}
      {showSlashMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-bold font-display text-zinc-100 flex items-center gap-1.5">
                  <span className="font-mono text-indigo-400">/</span> Catálogo de Bloques Interactivos
                </h4>
                <p className="text-xs text-zinc-400">
                  {contentType === 'material' 
                    ? 'Disponibles todas las fichas de estudio y dinámicas interactivas.' 
                    : 'Fichas de evaluación y tarjetas informativas para juegos competitivos.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSlashMenu(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cerrar
              </button>
            </div>

            {/* Search filter for blocks */}
            <input
              type="text"
              value={slashSearch}
              onChange={e => setSlashSearch(e.target.value)}
              placeholder="Buscar bloque (ej. flashcard, conectar, slider, CAPTCHA)..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />

            {/* Catalog Grid */}
            <div className="space-y-2">
              {filteredCatalog.map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleAddBlock(item.type)}
                  className="w-full p-3 rounded-xl bg-zinc-950/40 hover:bg-zinc-800 border border-zinc-800/80 hover:border-indigo-500/50 flex items-start gap-3 transition-all text-left group"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {coverPickerOpen && (
        <ImagePickDialog
          title="Subir portada"
          onCancel={() => setCoverPickerOpen(false)}
          onFile={file => {
            setCoverPickerOpen(false);
            acceptCover(file);
          }}
        />
      )}
      {coverFile && (
        <ImageCropDialog
          file={coverFile}
          aspect={16 / 5}
          title="Ajusta la portada"
          onCancel={() => setCoverFile(null)}
          onConfirm={file => { void confirmCover(file); }}
        />
      )}
    </div>
  );
};
