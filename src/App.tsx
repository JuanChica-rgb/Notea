/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { SideNav } from './components/common/SideNav';
import { FloatingCreateButton } from './components/common/FloatingCreateButton';
import { AuthModal } from './components/onboarding/AuthModal';
import { MyLibraryView } from './components/library/MyLibraryView';
import { NotebookEditor } from './components/editor/NotebookEditor';
import { StudyView } from './components/study/StudyView';
import { SoloGameView } from './components/game/SoloGameView';
import { MultiplayerLobbyView } from './components/game/MultiplayerLobbyView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SubjectDetailView } from './components/subjects/SubjectDetailView';
import { CoursesView } from './components/courses/CoursesView';
import { UserProfileView } from './components/profile/UserProfileView';
import { ContentPreviewView } from './components/common/ContentPreviewView';
import { CreatorProfileView } from './components/profile/CreatorProfileView';
import { isNoteaAdmin } from './context/AppContext';
import { parseAppPath } from './lib/links';

const AppContent: React.FC = () => {
  const { currentView, toastMessage, user, setCurrentView, setActiveCardId, openCreatorProfile, openAuthModal, authReady } = useApp();
  const inbound = React.useRef(parseAppPath(window.location.pathname));
  const appliedLink = React.useRef(false);
  const isGuest = Boolean(user.isGuest);
  const isAdmin = isNoteaAdmin(user);
  const guestViews = new Set(['subject_detail', 'content_preview', 'study', 'solo_game', 'multiplayer_lobby', 'creator_profile']);
  const visibleView = !authReady
    ? currentView
    : isGuest
    ? (guestViews.has(currentView) ? currentView : 'subject_detail')
    : (currentView === 'admin' && !isAdmin ? 'library' : currentView);
  const [navOpen, setNavOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const guestBoot = React.useRef(true);

  useEffect(() => {
    if (!authReady) return;
    const link = inbound.current;
    if (!link) return;
    if (link.type === 'course' && isGuest) {
      openAuthModal('login');
      return;
    }
    inbound.current = null;
    appliedLink.current = true;
    if (link.type === 'material') {
      setActiveCardId(link.id);
      setCurrentView('content_preview');
      return;
    }
    if (link.type === 'course') {
      sessionStorage.setItem('notea_open_course', link.code);
      setCurrentView('courses');
      return;
    }
    openCreatorProfile({ username: link.username });
  }, [authReady, isGuest, openAuthModal, openCreatorProfile, setActiveCardId, setCurrentView]);

  useEffect(() => {
    if (!authReady) return;
    if (inbound.current || appliedLink.current) return;
    if (!isGuest) {
      guestBoot.current = true;
      if (currentView === 'admin' && !isAdmin) setCurrentView('library');
      return;
    }
    if (guestViews.has(currentView)) return;
    const boot = guestBoot.current;
    guestBoot.current = false;
    setCurrentView('subject_detail');
    if (!boot) openAuthModal('login');
  }, [authReady, currentView, isAdmin, isGuest, openAuthModal, setCurrentView]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Global Header */}
      <Header onToggleNav={() => setNavOpen(open => !open)} />
      <SideNav open={navOpen} onClose={() => setNavOpen(false)} />

      <main className={`flex-1 pb-24 min-w-0 transition-[margin] duration-200 ${navOpen ? 'md:ml-60' : ''}`}>
        {visibleView === 'library' && <MyLibraryView />}
        {visibleView === 'editor' && <NotebookEditor />}
        {visibleView === 'content_preview' && <ContentPreviewView />}
        {visibleView === 'study' && <StudyView />}
        {visibleView === 'solo_game' && <SoloGameView />}
        {visibleView === 'multiplayer_lobby' && <MultiplayerLobbyView />}
        {visibleView === 'admin' && <AdminDashboard />}
        {visibleView === 'subject_detail' && <SubjectDetailView />}
        {visibleView === 'courses' && <CoursesView />}
        {visibleView === 'profile' && <UserProfileView />}
        {visibleView === 'creator_profile' && <CreatorProfileView />}
      </main>

      {/* Global Floating Action Button for Quick Creation */}
      {visibleView !== 'editor' && <FloatingCreateButton />}

      {/* Onboarding / Switch User Auth Modal */}
      <AuthModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="px-4 py-3 rounded-2xl bg-zinc-900/95 border border-indigo-500/50 shadow-2xl text-xs font-semibold text-zinc-100 flex items-center gap-2.5 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
