import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, Building, GraduationCap } from 'lucide-react';
import { isNoteaAdmin, useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from '../common/WhatsAppAvatar';
import { sortByMostLiked } from '../../utils/ratings';
import { bannerStyle } from '../../utils/banner';
import { normalizeUsername } from '../../utils/username';
import type { PublicUser } from '../../types';
import { CreatorCatalog } from './CreatorCatalog';
import { AccountCourses } from './AccountCourses';
import { AdminEducatorControls, EducatorBadge } from './EducatorVerification';
import { accountUrl, copyAppLink, rememberPath } from '../../lib/links';

export const CreatorProfileView: React.FC = () => {
  const {
    cards,
    directoryUsers,
    selectedCreatorId,
    selectedCreatorUsername,
    previousView,
    setCurrentView,
    user,
    showToast,
  } = useApp();

  const creator = useMemo<PublicUser | null>(() => {
    const handle = normalizeUsername(selectedCreatorUsername || '');
    const fromDirectory = directoryUsers.find(person =>
      (selectedCreatorId && person.id === selectedCreatorId)
      || (handle && person.username === handle)
    );
    if (fromDirectory) return fromDirectory;

    const authored = cards.find(card =>
      (selectedCreatorId && card.authorId === selectedCreatorId)
      || (handle && normalizeUsername(card.authorUsername) === handle)
    );
    if (!authored) return null;
    return {
      id: authored.authorId,
      username: normalizeUsername(authored.authorUsername),
      fullName: authored.authorUsername,
      avatarUrl: authored.authorAvatar,
      university: authored.universityName,
      bio: '',
    };
  }, [cards, directoryUsers, selectedCreatorId, selectedCreatorUsername]);

  const creatorCards = useMemo(() => {
    if (!creator) return [];
    const handle = normalizeUsername(creator.username);
    const authored = cards.filter(card =>
      (creator.id && card.authorId === creator.id)
      || (handle && normalizeUsername(card.authorUsername) === handle)
    );
    return sortByMostLiked(authored);
  }, [cards, creator]);

  const goBack = () => setCurrentView(previousView || 'library');

  useEffect(() => {
    if (!creator?.username) return;
    const path = `/u/${encodeURIComponent(creator.username)}`;
    rememberPath(path);
    return () => {
      if (window.location.pathname === path) rememberPath('/');
    };
  }, [creator?.username]);

  if (!creator) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-zinc-400">No se encontró el perfil de este creador.</p>
        <button type="button" onClick={goBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <section
        className="overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl"
      >
        <div
          className="h-28 sm:h-36"
          style={bannerStyle(creator.bannerValue)}
        />
        <div className="px-6 pb-6 -mt-10 space-y-4">
          <WhatsAppAvatar url={creator.avatarUrl} size="xl" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{creator.fullName || creator.username}</h1>
            <p className="text-sm font-mono text-indigo-400">@{creator.username}</p>
            <button type="button" onClick={() => void copyAppLink(accountUrl(creator.username), showToast)} className="mt-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100">
              Copiar enlace
            </button>
            <div className="mt-2">
              <EducatorBadge kind={creator.educatorKind} university={creator.educatorUniversity} status={creator.educatorStatus} />
            </div>
            {creator.bio && <p className="text-sm text-zinc-400 mt-2 max-w-2xl">{creator.bio}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {creator.university && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300">
                <Building className="w-3 h-3" /> {creator.university}
              </span>
            )}
            {creator.career && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300">
                <GraduationCap className="w-3 h-3" /> {creator.career}
              </span>
            )}
            {typeof creator.currentSemester === 'number' && creator.currentSemester > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300">
                {creator.currentSemester}.° semestre
              </span>
            )}
          </div>
          <div className="max-w-xs">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Creados</p>
              <p className="text-lg font-bold text-zinc-100 mt-1">{creatorCards.length}</p>
            </div>
          </div>
        </div>
      </section>

      {isNoteaAdmin(user) && <AdminEducatorControls person={creator} />}

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Cursos</h2>
        <AccountCourses personId={creator.id} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Materiales y juegos</h2>
        <CreatorCatalog cards={creatorCards} />
      </section>
    </div>
  );
};
