import React from 'react';
import { StudyItemCard } from '../../types';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { 
  Star, 
  Gamepad2, 
  BookOpen, 
  Play, 
  Users, 
  Copy, 
  Check, 
  Trophy, 
  MoreVertical,
  Trash2,
  Edit3
} from 'lucide-react';

interface ClassroomCardProps {
  card: StudyItemCard;
  onSelect?: () => void;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({ card, onSelect }) => {
  const { 
    user, 
    toggleFavorite, 
    setCurrentView, 
    setActiveCardId, 
    setEditingCardId, 
    deleteCard, 
    showToast,
    setSelectedCommunityMember 
  } = useApp();
  
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const isAuthor = card.authorId === user.id;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.accessCode);
    setCopiedCode(true);
    showToast(`Código ${card.accessCode} copiado al portapapeles.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardId(card.id);
    if (card.contentType === 'material') {
      setCurrentView('study');
    } else {
      setCurrentView('solo_game');
    }
  };

  const handleOpenMultiplayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardId(card.id);
    setCurrentView('multiplayer_lobby');
  };

  const handleOpenGameRanking = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardId(card.id);
    setCurrentView('rankings');
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthor) {
      setCurrentView('profile');
    } else {
      setSelectedCommunityMember({
        id: card.authorId,
        fullName: card.authorUsername,
        username: card.authorUsername,
        avatarUrl: card.authorAvatar,
        bannerType: 'gradient',
        bannerValue: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        university: card.universityName,
        career: card.subjectName,
        semester: card.semester,
        bio: `Creador de "${card.title}" en Notea.`,
        rpPoints: 1850,
        streakDays: 14,
        isIncognito: false,
      });
      setCurrentView('community_profile');
    }
  };

  // Determine banner style: gradient or image
  const bannerStyle = card.coverType === 'image' 
    ? { backgroundImage: `url(${card.coverValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: card.coverValue };

  return (
    <div 
      onClick={onSelect || handleOpenStudy}
      className="group relative flex flex-col bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-left"
    >
      {/* Visual Header (Google Classroom Style Banner) */}
      <div 
        style={bannerStyle}
        className="relative h-32 w-full p-4 flex flex-col justify-between overflow-hidden"
      >
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

        {/* Top bar over banner */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Badge: Material or Game */}
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

          {/* Quick Action: Star Favorite & Options */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(card.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                card.isFavorite 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' 
                  : 'bg-black/40 text-zinc-300 hover:text-amber-300 border border-white/10'
              }`}
              title={card.isFavorite ? 'En favoritos' : 'Marcar favorito'}
            >
              <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Author Menu */}
            {isAuthor && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="p-1.5 rounded-full bg-black/40 text-zinc-300 hover:text-white border border-white/10 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showDropdown && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 w-36 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-30"
                  >
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setEditingCardId(card.id);
                        setCurrentView('editor');
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        deleteCard(card.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unique Access Code (6 alphanumeric chars e.g. CALC-92) */}
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

          {/* Star Rating */}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/15 text-xs text-amber-300 font-semibold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{card.rating.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-400">({card.ratingsCount})</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-display font-bold text-base text-zinc-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {card.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {card.description}
          </p>

          {/* Subject & University Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-medium truncate max-w-[170px] border border-zinc-700/60">
              {card.subjectName}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[11px] border border-zinc-700/60">
              {card.authorUniversity}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[11px]">
              {card.semester}.° sem
            </span>
          </div>
        </div>

        {/* Footer: Author Info & Realtime Active Players (🎮) */}
        <div className="pt-3.5 mt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
          {/* Author avatar and username */}
          <button 
            type="button"
            onClick={handleAuthorClick}
            className="flex items-center gap-2 group/author hover:opacity-85 transition-opacity text-left"
          >
            <WhatsAppAvatar url={card.authorAvatar} size="xs" />
            <div className="text-left">
              <span className="text-xs font-semibold text-zinc-200 group-hover/author:text-indigo-400 transition-colors">
                @{card.authorUsername}
              </span>
            </div>
          </button>

          {/* Real-time active players / games count (🎮) */}
          <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium" title="Usuarios jugándolo activamente">
            <span className="text-base">🎮</span>
            <span className="text-zinc-200 font-bold">{card.activePlayers}</span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">en sala</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
          {card.contentType === 'game' ? (
            <>
              <button
                type="button"
                onClick={handleOpenStudy}
                className="py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-purple-300" />
                Solitario
              </button>
              <button
                type="button"
                onClick={handleOpenMultiplayer}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                Sala 1v1 / Plato
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleOpenStudy}
                className="col-span-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Repasar Cuaderno
              </button>
            </>
          )}
        </div>

        {/* Link to specific leaderboard if game */}
        {card.contentType === 'game' && (
          <button
            type="button"
            onClick={handleOpenGameRanking}
            className="w-full mt-2 text-[11px] text-zinc-400 hover:text-amber-400 flex items-center justify-center gap-1 transition-colors"
          >
            <Trophy className="w-3 h-3 text-amber-400" />
            Ver Ranking de este Juego
          </button>
        )}
      </div>
    </div>
  );
};
