/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { FloatingCreateButton } from './components/common/FloatingCreateButton';
import { AuthModal } from './components/onboarding/AuthModal';
import { MyLibraryView } from './components/library/MyLibraryView';
import { NotebookEditor } from './components/editor/NotebookEditor';
import { StudyView } from './components/study/StudyView';
import { SoloGameView } from './components/game/SoloGameView';
import { MultiplayerLobbyView } from './components/game/MultiplayerLobbyView';
import { RankingsView } from './components/rankings/RankingsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SubjectDetailView } from './components/subjects/SubjectDetailView';
import { TournamentsView } from './components/tournaments/TournamentsView';
import { UserProfileView } from './components/profile/UserProfileView';
import { Bell } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentView, toastMessage } = useApp();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Global Header */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 pb-24">
        {currentView === 'library' && <MyLibraryView />}
        {currentView === 'editor' && <NotebookEditor />}
        {currentView === 'study' && <StudyView />}
        {currentView === 'solo_game' && <SoloGameView />}
        {currentView === 'multiplayer_lobby' && <MultiplayerLobbyView />}
        {currentView === 'rankings' && <RankingsView />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'subject_detail' && <SubjectDetailView />}
        {currentView === 'tournaments' && <TournamentsView />}
        {currentView === 'profile' && <UserProfileView />}
      </main>

      {/* Global Floating Action Button for Quick Creation */}
      {currentView !== 'editor' && <FloatingCreateButton />}

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
