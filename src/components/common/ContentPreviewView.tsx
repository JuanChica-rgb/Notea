import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Edit3, FolderPlus, Gamepad2, Play, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isNoteaAdmin } from '../../context/AppContext';
import { auth } from '../../lib/firebase';
import { cardHasRealRatings, getCardAverageRating, getRatingVoteCount } from '../../utils/ratings';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { SaveToFolderModal } from './SaveToFolderModal';
import { copyAppLink, materialUrl, rememberPath } from '../../lib/links';

function readExploreCourses() {
  if (sessionStorage.getItem('notea_from') !== 'explore') return [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem('notea_card_courses') || '[]') as { code?: string; name?: string }[];
    return parsed.filter(item => item.code && item.name) as { code: string; name: string }[];
  } catch {
    return [];
  }
}

export const ContentPreviewView: React.FC = () => {
  const {
    activeCardId,
    cards,
    setCurrentView,
    setActiveCardId,
    setEditingCardId,
    deleteCard,
    rateCard,
    user,
    openUserProfile,
    openCreatorProfile,
    showToast,
  } = useApp();

  const card = cards.find(item => item.id === activeCardId);
  const voterId = auth.currentUser?.uid || user.id;
  const existingVote = card?.ratingsByUser?.[voterId];
  const [selectedStars, setSelectedStars] = useState(existingVote || 0);
  const [showFolderModal, setShowFolderModal] = useState(false);

  React.useEffect(() => {
    setSelectedStars(existingVote || 0);
  }, [card?.id, existingVote]);

  React.useEffect(() => {
    if (!card) return;
    const path = `/m/${encodeURIComponent(card.id)}`;
    rememberPath(path);
    return () => {
      if (window.location.pathname === path) rememberPath('/');
    };
  }, [card?.id]);

  if (!card) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-zinc-400">No se encontró el contenido seleccionado.</p>
        <button type="button" onClick={() => setCurrentView(user.isGuest ? 'subject_detail' : 'library')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          {user.isGuest ? 'Volver a Explorar' : 'Volver a la Biblioteca'}
        </button>
      </div>
    );
  }

  const startContent = () => {
    setCurrentView(card.contentType === 'game' ? 'solo_game' : 'study');
  };

  const canManage = Boolean(card && (
    card.authorId === user.id
    || card.authorId === auth.currentUser?.uid
    || card.authorUsername === user.username
    || isNoteaAdmin(user)
  ));

  const editContent = () => {
    setEditingCardId(card.id);
    setCurrentView('editor');
  };

  const removeContent = () => {
    if (!window.confirm(`¿Eliminar "${card.title}"?`)) return;
    void deleteCard(card.id);
    setActiveCardId(null);
    setCurrentView(sessionStorage.getItem('notea_open_course') ? 'courses' : 'library');
  };

  const chooseStars = (value: number) => {
    setSelectedStars(value);
    void rateCard(card.id, value);
  };

  const openAuthor = () => {
    if (card.authorId === user.id || card.authorId === auth.currentUser?.uid || card.authorUsername === user.username) {
      openUserProfile();
      return;
    }
    openCreatorProfile({ id: card.authorId, username: card.authorUsername });
  };

  const exploreCourses = readExploreCourses();

  const openListedCourse = (code: string) => {
    sessionStorage.setItem('notea_open_course', code);
    sessionStorage.removeItem('notea_from');
    sessionStorage.removeItem('notea_card_courses');
    setActiveCardId(null);
    setCurrentView('courses');
  };

  const hasRatings = cardHasRealRatings(card);
  const average = getCardAverageRating(card);
  const coverStyle: React.CSSProperties = card.coverType === 'image'
    ? {
        backgroundImage: `url(${card.coverValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        background: card.coverValue || 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
      };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button type="button" onClick={() => {
        const fromExplore = sessionStorage.getItem('notea_from') === 'explore';
        const backToCourse = sessionStorage.getItem('notea_open_course');
        if (fromExplore) {
          sessionStorage.removeItem('notea_from');
          sessionStorage.removeItem('notea_card_courses');
        }
        setActiveCardId(null);
        setCurrentView(fromExplore || user.isGuest ? 'subject_detail' : backToCourse ? 'courses' : 'library');
      }} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <section className="overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <div className="relative h-44 sm:h-56 p-6 flex flex-col justify-between" style={coverStyle}>
          <div className="absolute inset-0 bg-black/25" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/55 text-white text-xs font-bold backdrop-blur-md">
              {card.contentType === 'game' ? <Gamepad2 className="w-4 h-4 text-purple-300" /> : <BookOpen className="w-4 h-4 text-emerald-300" />}
              {card.contentType === 'game' ? 'Juego competitivo' : 'Material de estudio'}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-black/55 text-white text-xs font-mono backdrop-blur-md">{card.accessCode}</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold text-white/80">{card.universityName || card.authorUniversity} · {card.subjectName}</p>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1 drop-shadow">{card.title}</h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {card.description && card.description !== 'Sin descripción.' && (
                <p className="text-sm leading-relaxed text-zinc-300">{card.description}</p>
              )}
              <button
                type="button"
                onClick={openAuthor}
                className={`${card.description && card.description !== 'Sin descripción.' ? 'mt-3' : ''} inline-flex items-center gap-2 text-left hover:opacity-80`}
              >
                <WhatsAppAvatar url={card.authorAvatar} size="sm" />
                <span className="text-sm font-semibold text-indigo-300">@{card.authorUsername}</span>
              </button>
              {exploreCourses.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {exploreCourses.map(course => (
                    <button
                      key={course.code}
                      type="button"
                      onClick={() => openListedCourse(course.code)}
                      className="text-xs font-semibold text-zinc-300 hover:text-zinc-100"
                    >
                      Curso: {course.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-0.5">
                {[1, 2, 3, 4, 5].map(value => {
                  const filled = user.isGuest
                    ? hasRatings && value <= Math.round(average)
                    : value <= selectedStars;
                  const star = <Star className={`w-4 h-4 ${filled ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />;
                  if (user.isGuest) return <span key={value}>{star}</span>;
                  return (
                    <button key={value} type="button" onClick={() => chooseStars(value)} className="p-0.5" title={`${value} estrellas`}>
                      {star}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                {hasRatings
                  ? `${average.toFixed(1)} · ${getRatingVoteCount(card)} voto${getRatingVoteCount(card) === 1 ? '' : 's'}`
                  : 'Sin votos'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={startContent} aria-label="Jugar" title="Jugar" className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 fill-white" />
              </button>
              <button type="button" onClick={() => void copyAppLink(materialUrl(card.id), showToast)} className="px-4 py-3 text-sm font-semibold text-zinc-300 hover:text-zinc-100">
                Copiar enlace
              </button>
            </div>
            {(!user.isGuest || card.contentType === 'game' || canManage) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {!user.isGuest && (
                <button type="button" onClick={() => setShowFolderModal(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-100">
                  <FolderPlus className="w-3.5 h-3.5" /> Carpeta
                </button>
              )}
              {canManage && (
                <>
                  <button type="button" onClick={editContent} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-100">
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button type="button" onClick={removeContent} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </>
              )}
            </div>
            )}
          </div>
        </div>
      </section>
      {showFolderModal && (
        <SaveToFolderModal cardId={card.id} onClose={() => setShowFolderModal(false)} />
      )}
    </div>
  );
};
