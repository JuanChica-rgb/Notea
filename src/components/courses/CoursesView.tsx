import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EducatorBadge } from '../profile/EducatorVerification';
import { CatalogSearch } from '../common/CatalogSearch';
import { ImageCropDialog } from '../common/ImageCropDialog';
import { ImagePickDialog } from '../common/ImagePickDialog';
import { normalizeRoomCode } from '../../utils/roomMatch';
import { copyAppLink, courseUrl, rememberPath } from '../../lib/links';
import { sortedUniqueSubjects } from '../../utils/catalog';
import {
  addCoursePost,
  deleteCoursePost,
  uploadCourseFile,
  approveRequest,
  createCourse,
  deleteCourse,
  enterCourse,
  forgetCourse,
  isCourseStaff,
  leaveCourse,
  LIVE_GAME_MINUTES,
  listenToCourse,
  listenToMyCourseCodes,
  listenToPosts,
  loadCourse,
  publishCourseGame,
  rejectRequest,
  setCourseAdmin,
  syncMembership,
  updateCourseCover,
  updateCourseDetails,
  uploadCourseCover,
  type Course,
  type CoursePost,
} from '../../lib/courses';
import { CourseReview } from './CoursePractice';
import { coursePracticePool } from '../../utils/review';

const OPEN_KEY = 'notea_open_course';
const CREATE_KEY = 'notea_course_create';
const inputClass = 'w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600';

function LibraryPicker({
  cards,
  folders,
  userId,
  selectedId,
  onSelect,
  onClose,
}: {
  cards: { id: string; title: string; subjectName: string; contentType: string; authorId: string; folderId?: string; isFavorite?: boolean; coverType?: string; coverValue?: string }[];
  folders: { id: string; name: string; color: string; ownerId?: string }[];
  userId: string;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<'mine' | 'favorites' | string>('mine');
  const mineFolders = folders.filter(folder => !folder.ownerId || folder.ownerId === userId);
  const visible = cards.filter(card => {
    if (filter === 'mine') return card.authorId === userId;
    if (filter === 'favorites') return Boolean(card.isFavorite);
    return card.folderId === filter;
  });
  const empty = filter === 'favorites'
    ? 'No tienes favoritos.'
    : filter === 'mine'
      ? 'No tienes cuadernos ni juegos.'
      : 'Esta carpeta está vacía.';
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <p className="text-sm font-semibold text-zinc-100">Tu biblioteca</p>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-zinc-400 hover:text-zinc-100">Cerrar</button>
        </div>
        <div className="flex flex-wrap gap-1 px-4 py-3 border-b border-zinc-800">
          <button type="button" onClick={() => setFilter('mine')} className={chip(filter === 'mine')}>Míos</button>
          <button type="button" onClick={() => setFilter('favorites')} className={chip(filter === 'favorites')}>Favoritos</button>
          {mineFolders.map(folder => (
            <button key={folder.id} type="button" onClick={() => setFilter(folder.id)} className={chip(filter === folder.id)}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: folder.color || '#6366f1' }} />
              {folder.name}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">{empty}</p>
        ) : (
          <div className="overflow-y-auto p-3 space-y-2">
            {visible.map(card => {
              const cover = card.coverType === 'image' && card.coverValue
                ? { backgroundImage: `url(${card.coverValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: card.coverValue || '#27272a' };
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelect(card.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left ${
                    selectedId === card.id ? 'border-zinc-400 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className="w-16 h-12 rounded-lg shrink-0" style={cover} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-zinc-100 truncate">{card.title}</span>
                    <span className="block text-xs text-zinc-500 truncate">
                      {card.contentType === 'game' ? 'Juego' : 'Cuaderno'}
                      {card.subjectName ? ` · ${card.subjectName}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveEntry({ post, onEnter }: { post: CoursePost; onEnter: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!post.roomCode || !post.closesAt) return null;
  const left = post.closesAt - now;
  const open = left > 0;
  const minutes = Math.floor(Math.max(0, left) / 60000);
  const seconds = Math.floor((Math.max(0, left) % 60000) / 1000);
  const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
  return (
    <div className="flex flex-wrap items-center gap-3 px-1">
      <span className={`text-xs font-semibold ${open ? 'text-zinc-200' : 'text-zinc-500'}`}>
        {open ? `Pueden entrar durante ${clock}` : 'Cerrado'}
      </span>
      {open ? (
        <button type="button" onClick={onEnter} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">
          Entrar al juego
        </button>
      ) : (
        <span className="text-xs text-zinc-500">Ya no se puede entrar.</span>
      )}
    </div>
  );
}

function CourseMaterials({
  posts,
  cards,
  isStaff,
  busy,
  onOpenCard,
  onAddFile,
  inputRef,
}: {
  posts: CoursePost[];
  cards: { id: string; title: string; contentType: string; coverType?: string; coverValue?: string }[];
  isStaff: boolean;
  busy: boolean;
  onOpenCard: (id: string) => void;
  onAddFile: (file?: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const seen = new Set<string>();
  const shelf = posts.flatMap(post => {
    if (!post.cardId || seen.has(post.cardId)) return [];
    seen.add(post.cardId);
    const attached = cards.find(card => card.id === post.cardId);
    return [{
      id: post.cardId,
      title: attached?.title || post.cardTitle || 'Material',
      kind: (attached?.contentType || post.cardContentType) === 'game' ? 'Juego' : 'Cuaderno',
    }];
  });
  const files = posts.filter(post => post.fileUrl);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">Los cuadernos y juegos que el profesor publica en el curso quedan aquí.</p>
      {isStaff && (
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="text-sm font-semibold text-zinc-100 disabled:opacity-50"
          >
            Agregar PDF o archivo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={event => {
              onAddFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </div>
      )}
      {shelf.length === 0 && files.length === 0 ? (
        <p className="text-sm text-zinc-500">Todavía no hay materiales de estudio.</p>
      ) : (
        <div className="grid gap-3">
          {shelf.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenCard(item.id)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left"
            >
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">{item.kind}</span>
              <span className="block text-base font-semibold text-zinc-100 mt-1">{item.title}</span>
            </button>
          ))}
          {files.map(post => (
            <a
              key={post.id}
              href={post.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
            >
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {post.fileContentType === 'application/pdf' ? 'PDF' : 'Archivo'}
              </span>
              <span className="block text-base font-semibold text-zinc-100 mt-1">{post.fileName || post.text || 'Archivo'}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseRoom({ code, onBack }: { code: string; onBack: () => void }) {
  const { user, cards, folders, directoryUsers, setActiveCardId, setCurrentView, joinRoom, showToast } = useApp();
  useEffect(() => {
    const path = `/c/${encodeURIComponent(code)}`;
    rememberPath(path);
    return () => {
      if (window.location.pathname === path) rememberPath('/');
    };
  }, [code]);
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [posts, setPosts] = useState<CoursePost[]>([]);
  const [tab, setTab] = useState<'wall' | 'materials' | 'people'>('wall');
  const [sharing, setSharing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [composing, setComposing] = useState<'notice' | 'live' | null>(null);
  const [text, setText] = useState('');
  const [cardId, setCardId] = useState('');
  const [minutes, setMinutes] = useState<(typeof LIVE_GAME_MINUTES)[number]>(10);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [pickingCard, setPickingCard] = useState(false);
  const [fileDrag, setFileDrag] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shelfInputRef = useRef<HTMLInputElement>(null);
  const synced = useRef(false);

  useEffect(() => listenToCourse(code, setCourse), [code]);

  const isMember = Boolean(course && course.memberIds.includes(user.id));
  useEffect(() => {
    if (!isMember) {
      setPosts([]);
      return;
    }
    return listenToPosts(code, setPosts);
  }, [code, isMember]);

  useEffect(() => {
    if (!course || !isMember || synced.current) return;
    synced.current = true;
    void syncMembership(course).catch(() => undefined);
  }, [course, isMember]);

  const owner = directoryUsers.find(person => person.id === course?.ownerId)
    || (user.id === course?.ownerId ? user : undefined);
  const attachable = useMemo(
    () => cards.filter(card => card.authorId === user.id),
    [cards, user.id],
  );

  const chooseFile = (next?: File) => {
    if (!next) return;
    const type = next.type === 'image/jpg' ? 'image/jpeg' : next.type;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(type)) {
      showToast('El archivo debe ser PDF, JPG, PNG, WEBP o GIF.');
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      showToast('El archivo debe pesar menos de 10 MB.');
      return;
    }
    setFile(next);
  };

  const clearComposer = () => {
    setText('');
    setCardId('');
    setFile(null);
    setComposing(null);
    setPickingCard(false);
    setFileDrag(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveDetails = async () => {
    setBusy(true);
    try {
      await updateCourseDetails(code, { name: draftName, description: draftDescription });
      setEditingDetails(false);
    } catch (error) {
      showToast((error as Error).message || 'No se pudo guardar el curso.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    const card = attachable.find(item => item.id === cardId);
    setBusy(true);
    try {
      const uploaded = file ? await uploadCourseFile(code, file) : undefined;
      await addCoursePost(code, {
        username: user.username,
        text,
        cardId: card?.id,
        cardTitle: card?.title,
        cardContentType: card?.contentType,
        ...uploaded,
      });
      clearComposer();
    } catch (error) {
      showToast((error as Error).message || 'No se pudo publicar.');
    } finally {
      setBusy(false);
    }
  };

  const publishLive = async (event: React.FormEvent) => {
    event.preventDefault();
    const card = attachable.find(item => item.id === cardId && item.contentType === 'game');
    if (!card) {
      showToast('Elige un juego tuyo.');
      return;
    }
    setBusy(true);
    try {
      const room = await publishCourseGame({
        code,
        username: user.username,
        text,
        minutes,
        card,
        user,
      });
      clearComposer();
      sessionStorage.setItem(OPEN_KEY, code);
      const joined = await joinRoom(room.roomCode);
      if (joined) setCurrentView('multiplayer_lobby');
    } catch (error) {
      showToast((error as Error).message || 'No se pudo abrir el juego.');
    } finally {
      setBusy(false);
    }
  };

  const enterLive = async (post: CoursePost) => {
    if (!post.roomCode || !post.closesAt || post.closesAt <= Date.now()) {
      showToast('El tiempo para entrar ya terminó.');
      return;
    }
    sessionStorage.setItem(OPEN_KEY, code);
    const room = await joinRoom(post.roomCode);
    if (room) setCurrentView('multiplayer_lobby');
  };

  const addShelfFile = async (next?: File) => {
    if (!next) return;
    const type = next.type === 'image/jpg' ? 'image/jpeg' : next.type;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(type)) {
      showToast('El archivo debe ser PDF, JPG, PNG, WEBP o GIF.');
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      showToast('El archivo debe pesar menos de 10 MB.');
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadCourseFile(code, next);
      await addCoursePost(code, {
        username: user.username,
        text: uploaded.fileName,
        ...uploaded,
      });
    } catch (error) {
      showToast((error as Error).message || 'No se pudo agregar el archivo.');
    } finally {
      setBusy(false);
    }
  };

  const openCard = (id: string) => {
    sessionStorage.setItem(OPEN_KEY, code);
    setActiveCardId(id);
    setCurrentView('content_preview');
  };

  if (course === undefined) {
    return <p className="text-sm text-zinc-500">Cargando el curso…</p>;
  }

  if (!course) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={onBack} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200">Volver</button>
        <p className="text-sm text-zinc-500">No se encontró el curso.</p>
      </div>
    );
  }

  const practiceCount = coursePracticePool(
    cards,
    posts.map(post => post.cardId).filter((id): id is string => Boolean(id)),
  ).length;
  const people = Object.values(course.members);
  const requests = Object.values(course.pending);
  const waiting = !isMember && course.pendingIds.includes(user.id);
  const outsider = !isMember && !waiting;
  const isOwner = course.ownerId === user.id;
  const isStaff = isCourseStaff(course, user.id);
  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`;
  const meta = [course.subjectName, course.university].filter(Boolean).join(' · ');

  const exit = () => {
    void leaveCourse(code).then(onBack).catch(error => showToast((error as Error).message));
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

  return (
    <div className="space-y-6">
      {sharing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5 space-y-4">
            <h2 className="text-xl font-bold text-zinc-100">Compartir curso</h2>
            <p className="text-sm text-zinc-400">Quien abra este enlace llega directo al curso.</p>
            <input readOnly value={courseUrl(code)} className={inputClass} onFocus={event => event.currentTarget.select()} />
            <p className="text-sm text-zinc-300">Código <span className="font-mono text-zinc-100">{course.code}</span></p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setSharing(false)} className="text-sm text-zinc-400">Cerrar</button>
              <button type="button" onClick={() => void copyAppLink(courseUrl(code), showToast)} className="text-sm font-semibold text-zinc-100">
                Copiar enlace
              </button>
            </div>
          </div>
        </div>
      )}
      <button type="button" onClick={onBack} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200">
        Volver
      </button>
      <div className={`relative overflow-hidden rounded-2xl border border-zinc-800 ${course.coverUrl ? 'min-h-40' : ''}`}>
        {course.coverUrl && (
          <img src={course.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className={`relative space-y-1 p-5 ${course.coverUrl ? 'bg-black/50 min-h-40' : ''}`}>
        {editingDetails ? (
          <form
            onSubmit={event => {
              event.preventDefault();
              void saveDetails();
            }}
            className="space-y-2"
          >
            <input value={draftName} onChange={event => setDraftName(event.target.value)} placeholder="Nombre" className={inputClass} />
            <textarea value={draftDescription} onChange={event => setDraftDescription(event.target.value)} placeholder="Descripción" rows={3} className={inputClass} />
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingDetails(false)} className="text-xs text-zinc-400">Cancelar</button>
              <button type="submit" disabled={busy} className="text-xs font-semibold text-zinc-100 disabled:opacity-50">Guardar</button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-zinc-100">{course.name}</h1>
            <p className="text-base text-zinc-300">
              {meta}{meta ? ' · ' : ''}<span className="font-mono text-zinc-100">{course.code}</span>
              {' · '}{course.visibility === 'private' ? 'Privado' : 'Público'}
            </p>
            {course.description && <p className="text-base text-zinc-200 pt-1">{course.description}</p>}
          </>
        )}
        <div className="pt-1">
          <EducatorBadge kind={owner?.educatorKind} university={owner?.educatorUniversity} status={owner?.educatorStatus} />
        </div>
        {isOwner && !editingDetails && (
          <div className="pt-2">
            <button type="button" onClick={() => setSharing(true)} className="text-sm font-semibold text-zinc-100">
              Compartir
            </button>
          </div>
        )}
        {isStaff && !editingDetails && (
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setDraftName(course.name);
                setDraftDescription(course.description);
                setEditingDetails(true);
              }}
              className="text-xs text-zinc-200 hover:text-white"
            >
              Editar
            </button>
            <button type="button" onClick={() => setCoverPickerOpen(true)} className="text-xs text-zinc-200 hover:text-white">
              {course.coverUrl ? 'Cambiar portada' : 'Subir portada'}
            </button>
            {course.coverUrl && (
              <button
                type="button"
                onClick={() => void updateCourseCover(code, null).catch(error => showToast((error as Error).message))}
                className="text-xs text-zinc-400 hover:text-rose-300"
              >
                Quitar portada
              </button>
            )}
          </div>
        )}
        </div>
      </div>
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
          onConfirm={file => {
            setCoverFile(null);
            void uploadCourseCover(code, file)
              .then(url => updateCourseCover(code, url))
              .catch(error => showToast((error as Error).message || 'No se pudo subir la portada.'));
          }}
        />
      )}
      <div className="space-y-1">
        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(`¿Eliminar "${course.name}"?`)) return;
              void deleteCourse(code).then(onBack).catch(error => showToast((error as Error).message));
            }}
            className="text-xs text-zinc-500 hover:text-rose-300"
          >
            Eliminar curso
          </button>
        ) : isMember || waiting ? (
          <button type="button" onClick={exit} className="text-xs text-zinc-500 hover:text-rose-300">
            {waiting ? 'Cancelar solicitud' : 'Salir del curso'}
          </button>
        ) : null}
      </div>

      {outsider ? (
        course.visibility === 'public' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void enterCourse(code, user.username, user.fullName)
                .catch(error => showToast((error as Error).message))
                .finally(() => setBusy(false));
            }}
            className="text-sm font-semibold text-zinc-100 disabled:opacity-50"
          >
            Unirse
          </button>
        ) : (
          <p className="text-sm text-zinc-500">Este curso es privado. Pide entrar con el código.</p>
        )
      ) : waiting ? (
        <p className="text-sm text-zinc-500">Esperando autorización del creador.</p>
      ) : reviewing ? (
        <CourseReview
          course={course}
          posts={posts}
          onClose={() => {
            setReviewing(false);
            setTab('wall');
          }}
        />
      ) : (
        <>
          {practiceCount > 0 && (
            <button type="button" onClick={() => setReviewing(true)} className="text-sm font-semibold text-zinc-100">
              Repaso de 5 minutos
            </button>
          )}
          <div className="flex gap-1">
            <button type="button" onClick={() => setTab('wall')} className={tabClass(tab === 'wall')}>Muro</button>
            <button type="button" onClick={() => setTab('materials')} className={tabClass(tab === 'materials')}>Materiales de estudio</button>
            <button type="button" onClick={() => setTab('people')} className={tabClass(tab === 'people')}>Personas</button>
          </div>

          {tab === 'wall' && (
            <div className="space-y-6">
              {isStaff && composing === 'notice' && (
                <form
                  onSubmit={event => void publish(event)}
                  className="space-y-3"
                >
                  <textarea value={text} onChange={event => setText(event.target.value)} placeholder="Escribe un aviso" rows={3} className={inputClass} />
                  <div className="rounded-2xl border border-zinc-500 p-4 space-y-2">
                    <button type="button" onClick={() => setPickingCard(true)} className="text-sm font-semibold text-zinc-100">
                      {cardId ? 'Cambiar' : 'Adjuntar cuaderno o juego'}
                    </button>
                    {cardId && (
                      <p className="text-xs text-zinc-400">
                        {cards.find(card => card.id === cardId)?.title || 'Material'}
                        <button type="button" onClick={() => setCardId('')} className="ml-3 text-zinc-500 hover:text-zinc-200">Quitar</button>
                      </p>
                    )}
                    {pickingCard && (
                      <LibraryPicker
                        cards={cards}
                        folders={folders}
                        userId={user.id}
                        selectedId={cardId}
                        onSelect={id => {
                          setCardId(id);
                          setPickingCard(false);
                        }}
                        onClose={() => setPickingCard(false)}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={event => {
                      event.preventDefault();
                      setFileDrag(true);
                    }}
                    onDragLeave={() => setFileDrag(false)}
                    onDrop={event => {
                      event.preventDefault();
                      setFileDrag(false);
                      chooseFile(event.dataTransfer.files?.[0]);
                    }}
                    className={`w-full min-h-36 rounded-2xl border border-dashed px-4 py-8 text-sm text-zinc-400 ${
                      fileDrag ? 'border-zinc-400 bg-zinc-900 text-zinc-200' : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {file ? file.name : 'Arrastra un archivo aquí o haz clic para elegirlo'}
                  </button>
                  {file && (
                    <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-zinc-500">
                      Quitar archivo
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={event => {
                      chooseFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  <div className="flex gap-3">
                    <button type="button" onClick={clearComposer} className="text-xs text-zinc-500">Cancelar</button>
                    <button type="submit" disabled={busy} className="text-xs font-semibold text-zinc-200 disabled:opacity-50">{busy ? 'Publicando…' : 'Publicar'}</button>
                  </div>
                </form>
              )}
              {isStaff && composing === 'live' && (
                <form onSubmit={event => void publishLive(event)} className="space-y-3">
                  <p className="text-sm text-zinc-300">Abre un juego para que el curso entre ahora. Cuando se acabe el tiempo, ya no se puede entrar.</p>
                  <select value={cardId} onChange={event => setCardId(event.target.value)} className={inputClass}>
                    <option value="">Elige un juego tuyo</option>
                    {attachable.filter(card => card.contentType === 'game').map(card => (
                      <option key={card.id} value={card.id}>{card.title}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {LIVE_GAME_MINUTES.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMinutes(option)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${minutes === option ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}
                      >
                        {option} min
                      </button>
                    ))}
                  </div>
                  <textarea value={text} onChange={event => setText(event.target.value)} placeholder="Aviso opcional. Ej. Entren ya." rows={2} className={inputClass} />
                  <div className="flex gap-3">
                    <button type="button" onClick={clearComposer} className="text-xs text-zinc-500">Cancelar</button>
                    <button type="submit" disabled={busy} className="text-xs font-semibold text-zinc-100 disabled:opacity-50">{busy ? 'Abriendo…' : 'Abrir juego'}</button>
                  </div>
                </form>
              )}
              {isStaff && !composing && (
                <div className="flex gap-4">
                  <button type="button" onClick={() => setComposing('notice')} className="text-sm font-semibold text-zinc-300 hover:text-zinc-100">Aviso</button>
                  <button type="button" onClick={() => { setCardId(''); setComposing('live'); }} className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">Juego en clase</button>
                </div>
              )}
              {posts.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no hay avisos.</p>
              ) : (
                <div className="space-y-3">
                  {posts.map(post => {
                    const attached = post.cardId ? cards.find(card => card.id === post.cardId) : undefined;
                    const isGame = Boolean(post.roomCode) || (attached?.contentType || post.cardContentType) === 'game';
                    const cover = attached?.coverType === 'image' && attached.coverValue
                      ? { backgroundImage: `url(${attached.coverValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: attached?.coverValue || (isGame ? '#3b0764' : '#27272a') };
                    return (
                      <article key={post.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-zinc-500">@{post.authorUsername}</p>
                          {isStaff && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm('¿Eliminar este aviso?')) return;
                                void deleteCoursePost(code, post.id).catch(error => showToast((error as Error).message));
                              }}
                              className="text-xs text-zinc-500 hover:text-rose-300"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                        {post.text && <p className="text-base text-zinc-100 whitespace-pre-wrap">{post.text}</p>}
                        {post.fileUrl && (
                          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                            {post.fileContentType?.startsWith('image/') ? (
                              <a href={post.fileUrl} target="_blank" rel="noreferrer" className="block">
                                <img src={post.fileUrl} alt={post.fileName || 'Imagen del aviso'} className="max-h-56 w-full object-contain bg-zinc-950" />
                              </a>
                            ) : (
                              <a href={post.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-200 hover:text-zinc-50">
                                <span className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
                                  {post.fileContentType === 'application/pdf' ? 'PDF' : 'Archivo'}
                                </span>
                                <span className="truncate">{post.fileName || 'Archivo'}</span>
                              </a>
                            )}
                          </div>
                        )}
                        {(post.cardId || post.roomCode) && (
                          <div className="overflow-hidden rounded-xl border border-zinc-800">
                            <button
                              type="button"
                              onClick={() => post.cardId && openCard(post.cardId)}
                              className="relative h-28 w-full text-left"
                            >
                              <span className="absolute inset-0" style={cover} />
                              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
                              <span className="relative flex h-full flex-col justify-between p-3">
                                <span className="self-start px-2 py-0.5 rounded-md bg-black/50 text-[10px] font-bold uppercase text-zinc-100">
                                  {isGame ? 'Juego' : 'Cuaderno'}
                                </span>
                                <span className="text-sm font-semibold text-white truncate">{attached?.title || post.cardTitle || 'Material'}</span>
                              </span>
                            </button>
                            {post.roomCode && post.closesAt && (
                              <div className="bg-zinc-900 px-3 py-2">
                                <LiveEntry post={post} onEnter={() => void enterLive(post)} />
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'materials' && (
            <CourseMaterials
              posts={posts}
              cards={cards}
              isStaff={isStaff}
              busy={busy}
              onOpenCard={openCard}
              onAddFile={file => void addShelfFile(file)}
              inputRef={shelfInputRef}
            />
          )}

          {tab === 'people' && (
            <div className="space-y-6">
              {isStaff && requests.length > 0 && (
                <div className="divide-y divide-zinc-800">
                  {requests.map(person => (
                    <div key={person.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-zinc-100">@{person.username}</p>
                        <p className="text-xs text-zinc-500">Quiere entrar</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => void approveRequest(code, person).catch(error => showToast((error as Error).message))}
                          className="text-xs font-semibold text-zinc-200"
                        >
                          Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => void rejectRequest(code, person.id).catch(error => showToast((error as Error).message))}
                          className="text-xs text-zinc-500 hover:text-rose-300"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="divide-y divide-zinc-800">
                {people.map(person => {
                  const roleLabel = person.id === course.ownerId || person.role === 'owner'
                    ? 'Crea el curso'
                    : person.role === 'admin' || course.adminIds.includes(person.id)
                      ? 'Admin'
                      : 'Estudiante';
                  const canPromote = isOwner && person.id !== course.ownerId;
                  const isAdmin = person.role === 'admin' || course.adminIds.includes(person.id);
                  return (
                    <div key={person.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-zinc-100">@{person.username}</p>
                        <p className="text-xs text-zinc-500">{roleLabel}</p>
                      </div>
                      {canPromote && (
                        <button
                          type="button"
                          onClick={() => void setCourseAdmin(code, person.id, !isAdmin).catch(error => showToast((error as Error).message))}
                          className="text-xs font-semibold text-zinc-300 hover:text-zinc-100"
                        >
                          {isAdmin ? 'Quitar admin' : 'Hacer admin'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function readCreateIntent() {
  if (sessionStorage.getItem(CREATE_KEY) !== '1') return false;
  sessionStorage.removeItem(CREATE_KEY);
  return true;
}

export const CoursesView: React.FC = () => {
  const { user, directoryUsers, universities, subjects, showToast } = useApp();
  const [codes, setCodes] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [openCode, setOpenCode] = useState<string | null>(() => sessionStorage.getItem(OPEN_KEY));
  const [panel, setPanel] = useState<'join' | 'create' | null>(() => (readCreateIntent() ? 'create' : null));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [university, setUniversity] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const openCreate = () => {
      sessionStorage.removeItem(CREATE_KEY);
      sessionStorage.removeItem(OPEN_KEY);
      setOpenCode(null);
      setPanel('create');
    };
    window.addEventListener('notea-course-create', openCreate);
    return () => window.removeEventListener('notea-course-create', openCreate);
  }, []);

  useEffect(() => {
    if (!user.id || user.isGuest) return;
    return listenToMyCourseCodes(user.id, setCodes);
  }, [user.id, user.isGuest]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(codes.map(async code => {
      const course = await loadCourse(code);
      const mine = Boolean(course && (course.memberIds.includes(user.id) || course.pendingIds.includes(user.id)));
      if (!course || !mine) await forgetCourse(code).catch(() => undefined);
      return mine ? course : null;
    })).then(loaded => {
      if (!cancelled) setCourses(loaded.filter((course): course is Course => Boolean(course)));
    });
    return () => { cancelled = true; };
  }, [codes, user.id]);

  const open = (code: string) => {
    sessionStorage.setItem(OPEN_KEY, code);
    setPanel(null);
    setOpenCode(code);
  };

  const close = () => {
    sessionStorage.removeItem(OPEN_KEY);
    setOpenCode(null);
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const catalogSubjects = sortedUniqueSubjects(subjects);
    if (!universities.some(item => item.name === university) || !catalogSubjects.some(item => item.name === subjectName)) {
      showToast('Elige una universidad y una materia del catálogo.');
      return;
    }
    setBusy(true);
    try {
      const course = await createCourse({
        name,
        description,
        subjectName,
        university,
        visibility,
        username: user.username,
        fullName: user.fullName,
      });
      setName('');
      setDescription('');
      setSubjectName('');
      setUniversity('');
      setVisibility('public');
      open(course.code);
    } catch (error) {
      showToast((error as Error).message || 'No se pudo crear el curso.');
    } finally {
      setBusy(false);
    }
  };

  const join = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = normalizeRoomCode(joinCode);
    if (code.length !== 4) {
      showToast('El código del curso tiene 4 caracteres.');
      return;
    }
    setBusy(true);
    try {
      const result = await enterCourse(code, user.username, user.fullName);
      setJoinCode('');
      if (result.status === 'pending') showToast('Solicitud enviada. El creador debe aceptarte.');
      open(result.course.code);
    } catch (error) {
      showToast((error as Error).message || 'No se pudo entrar al curso.');
    } finally {
      setBusy(false);
    }
  };

  if (openCode && panel !== 'create') {
    return <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8"><CourseRoom code={openCode} onBack={close} /></div>;
  }

  if (panel === 'join') {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 space-y-4">
        <button type="button" onClick={() => setPanel(null)} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200">Volver</button>
        <form onSubmit={event => void join(event)} className="space-y-3">
          <input
            value={joinCode}
            onChange={event => setJoinCode(normalizeRoomCode(event.target.value))}
            maxLength={4}
            placeholder="Código del curso"
            className={`${inputClass} text-center font-mono tracking-widest`}
          />
          <button type="submit" disabled={busy} className="text-sm font-semibold text-zinc-100 disabled:opacity-50">Unirse</button>
        </form>
      </div>
    );
  }

  if (panel === 'create') {
    const choice = (active: boolean) =>
      `px-3 py-1.5 rounded-lg text-sm font-semibold ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`;
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 space-y-4">
        <button type="button" onClick={() => setPanel(null)} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200">Volver</button>
        <form onSubmit={event => void create(event)} className="space-y-3">
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Nombre" className={inputClass} />
          <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Descripción" rows={3} className={inputClass} />
          <CatalogSearch
            placeholder="Buscar universidad"
            selected={university}
            items={universities}
            emptyLabel="No hay universidades con ese nombre."
            onSelect={setUniversity}
            onClear={() => setUniversity('')}
          />
          <CatalogSearch
            placeholder="Buscar materia"
            selected={subjectName}
            items={sortedUniqueSubjects(subjects)}
            emptyLabel="No hay materias con ese nombre."
            onSelect={setSubjectName}
            onClear={() => setSubjectName('')}
          />
          <div className="flex gap-1">
            <button type="button" onClick={() => setVisibility('public')} className={choice(visibility === 'public')}>Público</button>
            <button type="button" onClick={() => setVisibility('private')} className={choice(visibility === 'private')}>Privado</button>
          </div>
          <p className="text-xs text-zinc-500">
            {visibility === 'private'
              ? 'El creador acepta a cada persona.'
              : 'Con el código entra cualquiera.'}
          </p>
          <button type="submit" disabled={busy} className="text-sm font-semibold text-zinc-100 disabled:opacity-50">Crear</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button type="button" onClick={() => setPanel('join')} className="text-sm font-semibold text-zinc-300 hover:text-zinc-100">
        Unirse
      </button>
      {courses.length === 0 ? (
        <p className="text-sm text-zinc-500">Todavía no estás en ningún curso.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map(course => {
            const owner = directoryUsers.find(person => person.id === course.ownerId)
              || (user.id === course.ownerId ? user : undefined);
            const waiting = !course.memberIds.includes(user.id) && course.pendingIds.includes(user.id);
            const meta = [course.subjectName, course.university, course.code].filter(Boolean).join(' · ');
            return (
              <button
                key={course.code}
                type="button"
                onClick={() => open(course.code)}
                className="relative h-36 w-full overflow-hidden rounded-2xl border border-zinc-800 text-left"
              >
                <span
                  className="absolute inset-0"
                  style={course.coverUrl
                    ? { backgroundImage: `url(${course.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: 'linear-gradient(135deg, #312e81 0%, #27272a 58%, #18181b 100%)' }}
                />
                <span className={`absolute inset-0 ${course.coverUrl ? 'bg-gradient-to-t from-black/80 via-black/35 to-black/10' : 'bg-gradient-to-t from-black/55 via-black/15 to-transparent'}`} />
                <span className="absolute inset-0 flex flex-col justify-end p-4">
                  <span className="mb-2">
                    <EducatorBadge kind={owner?.educatorKind} university={owner?.educatorUniversity} status={owner?.educatorStatus} />
                  </span>
                  <span>
                    <span className="block text-lg font-bold text-white truncate">{course.name}</span>
                    <span className="block text-sm text-zinc-200 truncate">
                      {meta}
                      {waiting ? ' · Esperando autorización' : course.visibility === 'private' ? ' · Privado' : ''}
                    </span>
                    {course.description && (
                      <span className="block text-sm text-zinc-300 truncate">{course.description}</span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
