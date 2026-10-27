import React from 'react';
import { StudyItemCard } from '../../types';
import { useApp } from '../../context/AppContext';
import { auth } from '../../lib/firebase';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { 
  Star, 
  Gamepad2, 
  BookOpen, 
  Copy, 
  Check
} from 'lucide-react';
import { cardHasRealRatings, getCardAverageRating } from '../../utils/ratings';

interface ClassroomCardProps {
  card: StudyItemCard;
  onSelect?: () => void;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({ card, onSelect }) => {
  const { 
    user, 
    toggleFavorite, 
    setCurrentView, 
    openUserProfile,
    openCreatorProfile,
    setActiveCardId, 
    showToast,
  } = useApp();
  
  const [copiedCode, setCopiedCode] = React.useState(false);

  const isAuthor = card.authorId === user.id || card.authorId === auth.currentUser?.uid || card.authorUsername === user.username;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.accessCode);
    setCopiedCode(true);
    showToast(`Código ${card.accessCode} copiado al portapapeles.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenStudy = () => {
    setActiveCardId(card.id);
    setCurrentView('content_preview');
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthor) {
      openUserProfile();
      return;
    }
    openCreatorProfile({ id: card.authorId, username: card.authorUsername });
  };

  const bannerStyle = card.coverType === 'image' 
    ? { backgroundImage: `url(${card.coverValue})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' }
    : { background: card.coverValue };

  return (
    <div 
      onClick={onSelect || handleOpenStudy}
      className="group relative flex flex-col bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-left"
    >
      <div 
        style={bannerStyle}
        className="relative h-32 w-full p-4 flex flex-col justify-between overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

        <div className="relative z-10 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
            card.contentType === 'game' 
              ? 'bg-purple-900/60 border-purple-400/40 text-purple-200' 
              : 'bg-emerald-900/60 border-emerald-400/40 text-emerald-200'
          }`}>
            {card.contentType === 'game' ? (
              <>
                <Gamepad2 className="w-3.5 h-3.5" />
                Juego Competitivo
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                Material de Estudio
              </>
            )}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (user.isGuest) return;
              toggleFavorite(card.id);
            }}
            className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
              card.isFavorite 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' 
                : 'bg-black/40 text-zinc-300 hover:text-amber-300 border border-white/10'
            } ${user.isGuest ? 'hidden' : ''}`}
            title={card.isFavorite ? 'En favoritos' : 'Marcar favorito'}
          >
            <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        <div className="relative z-10 flex items-end justify-between">
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-xs font-mono font-semibold text-zinc-200 border border-white/15 transition-all group/code"
            title="Copiar código de acceso rápido"
          >
            <span>{card.accessCode}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400 group-hover/code:text-zinc-200" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-zinc-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {card.title}
          </h3>
          {card.description && card.description !== 'Sin descripción.' && (
            <p className="text-sm text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
              {card.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium truncate max-w-[14rem] border border-zinc-700/60">
              {card.universityName || card.authorUniversity}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs border border-zinc-700/60">
              {card.subjectName}
            </span>
          </div>
        </div>

        <div className="pt-3.5 mt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <button 
            type="button"
            onClick={handleAuthorClick}
            className="flex items-center gap-2 min-w-0 group/author hover:opacity-85 transition-opacity text-left"
          >
            <WhatsAppAvatar url={card.authorAvatar} size="xs" />
            <span className="text-sm font-semibold text-zinc-200 group-hover/author:text-indigo-400 transition-colors truncate">
              @{card.authorUsername}
            </span>
          </button>
          <div
            className="flex items-center gap-0.5 shrink-0"
            title={cardHasRealRatings(card) ? `${getCardAverageRating(card).toFixed(1)} de 5` : 'Sin calificar'}
          >
            {[1, 2, 3, 4, 5].map(value => (
              <Star
                key={value}
                className={`w-3 h-3 ${
                  cardHasRealRatings(card) && value <= Math.round(getCardAverageRating(card))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-zinc-600'
                }`}
              />
            ))}
            {cardHasRealRatings(card) && (
              <span className="ml-1 text-[11px] font-semibold text-amber-300 tabular-nums">
                {getCardAverageRating(card).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
