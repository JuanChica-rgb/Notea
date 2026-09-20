import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  StudyItemCard, 
  Folder, 
  University, 
  Career, 
  Subject, 
  PendingRequest, 
  Tournament, 
  ContentType,
  SoloGameSession,
  MultiplayerRoom
} from '../types';
import { 
  INITIAL_USER, 
  INITIAL_CARDS, 
  INITIAL_FOLDERS, 
  INITIAL_UNIVERSITIES, 
  INITIAL_CAREERS, 
  INITIAL_SUBJECTS, 
  INITIAL_PENDING_REQUESTS, 
  INITIAL_TOURNAMENTS,
  COMMUNITY_MEMBERS,
  CommunityMember
} from '../data/mockData';

export type AppView = 
  | 'library' 
  | 'study' 
  | 'solo_game' 
  | 'multiplayer_lobby' 
  | 'multiplayer_room' 
  | 'editor' 
  | 'rankings' 
  | 'admin' 
  | 'profile' 
  | 'community_profile'
  | 'subject_detail'
  | 'tournaments';

interface AppContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  updateUserProfile: (updates: Partial<User>) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Navigation & Views
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  activeSubjectName: string | null;
  setActiveSubjectName: (subject: string | null) => void;
  selectedCommunityMember: CommunityMember | null;
  setSelectedCommunityMember: (member: CommunityMember | null) => void;
  editorContentType: ContentType;
  setEditorContentType: (type: ContentType) => void;
  editingCardId: string | null;
  setEditingCardId: (id: string | null) => void;

  // Cards / Study Materials & Games
  cards: StudyItemCard[];
  addCard: (card: Omit<StudyItemCard, 'id' | 'createdAt' | 'authorId' | 'authorUsername' | 'authorUniversity' | 'ratingsCount' | 'rating' | 'activePlayers' | 'isFavorite'>) => StudyItemCard;
  updateCard: (id: string, updates: Partial<StudyItemCard>) => void;
  deleteCard: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Folders
  folders: Folder[];
  addFolder: (name: string, color?: string) => void;

  // Academic Catalogs
  universities: University[];
  careers: Career[];
  subjects: Subject[];
  addUniversity: (name: string, acronym?: string, country?: string) => void;
  updateUniversity: (id: string, name: string, acronym: string) => void;
  deleteUniversity: (id: string) => void;
  addCareer: (name: string, universityId?: string) => void;
  updateCareer: (id: string, name: string) => void;
  deleteCareer: (id: string) => void;
  addSubject: (name: string, careerId: string, semester: number) => void;
  updateSubject: (id: string, name: string, semester: number) => void;
  deleteSubject: (id: string) => void;

  // Gamification & Privacy
  updateUserRP: (delta: number) => void;
  toggleIncognito: () => void;

  // Admin Pending Requests ("Opción Otra")
  pendingRequests: PendingRequest[];
  submitPendingRequest: (type: 'university' | 'career' | 'subject', customValue: string, relatedEntityName?: string) => void;
  approvePendingRequest: (id: string) => void;
  rejectPendingRequest: (id: string) => void;
  mergePendingRequest: (id: string, targetName: string) => void;

  // Tournaments
  tournaments: Tournament[];
  addTournament: (tournament: Omit<Tournament, 'id' | 'participantsCount' | 'bracket'>) => void;

  // Solo History & Multiplayer Room
  soloHistory: SoloGameSession[];
  saveSoloSession: (session: SoloGameSession) => void;
  activeRoom: MultiplayerRoom | null;
  setActiveRoom: React.Dispatch<React.SetStateAction<MultiplayerRoom | null>>;
  
  // Auth Modal trigger
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state: Dark Mode by default
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('notea_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('notea_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // User State
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('notea_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  useEffect(() => {
    localStorage.setItem('notea_user', JSON.stringify(user));
  }, [user]);

  const updateUserProfile = (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  // Cards state
  const [cards, setCards] = useState<StudyItemCard[]>(() => {
    const saved = localStorage.getItem('notea_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  useEffect(() => {
    localStorage.setItem('notea_cards', JSON.stringify(cards));
  }, [cards]);

  // Folders state
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('notea_folders');
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  useEffect(() => {
    localStorage.setItem('notea_folders', JSON.stringify(folders));
  }, [folders]);

  // Academic catalogs state
  const [universities, setUniversities] = useState<University[]>(() => {
    const saved = localStorage.getItem('notea_universities');
    return saved ? JSON.parse(saved) : INITIAL_UNIVERSITIES;
  });

  const [careers, setCareers] = useState<Career[]>(() => {
    const saved = localStorage.getItem('notea_careers');
    return saved ? JSON.parse(saved) : INITIAL_CAREERS;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('notea_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(() => {
    const saved = localStorage.getItem('notea_pending_reqs');
    return saved ? JSON.parse(saved) : INITIAL_PENDING_REQUESTS;
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('notea_tournaments');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });

  const [soloHistory, setSoloHistory] = useState<SoloGameSession[]>(() => {
    const saved = localStorage.getItem('notea_solo_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation & Selection States
  const [currentView, setCurrentView] = useState<AppView>('library');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeSubjectName, setActiveSubjectName] = useState<string | null>(null);
  const [selectedCommunityMember, setSelectedCommunityMember] = useState<CommunityMember | null>(null);
  const [editorContentType, setEditorContentType] = useState<ContentType>('material');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Card actions
  const addCard = (cardData: Omit<StudyItemCard, 'id' | 'createdAt' | 'authorId' | 'authorUsername' | 'authorUniversity' | 'ratingsCount' | 'rating' | 'activePlayers' | 'isFavorite'>): StudyItemCard => {
    const newCard: StudyItemCard = {
      ...cardData,
      id: `card_${Date.now()}`,
      authorId: user.id,
      authorUsername: user.username,
      authorUniversity: user.university.split(' ').map(w => w[0]).join('').slice(0, 5).toUpperCase() || 'UNIV',
      authorAvatar: user.avatarUrl,
      rating: 5.0,
      ratingsCount: 1,
      activePlayers: 1,
      isFavorite: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCards(prev => [newCard, ...prev]);
    showToast(`¡"${newCard.title}" creado con éxito!`);
    return newCard;
  };

  const updateCard = (id: string, updates: Partial<StudyItemCard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    showToast('Cambios guardados con éxito.');
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    showToast('Elemento eliminado de la biblioteca.');
  };

  const toggleFavorite = (id: string) => {
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        const nextFav = !c.isFavorite;
        showToast(nextFav ? 'Guardado en Favoritos ⭐' : 'Removido de Favoritos');
        return { ...c, isFavorite: nextFav };
      }
      return c;
    }));
  };

  // Folder actions
  const addFolder = (name: string, color: string = '#6366f1') => {
    if (!name.trim()) return;
    const newF: Folder = {
      id: `f_${Date.now()}`,
      name: name.trim(),
      color
    };
    setFolders(prev => [...prev, newF]);
    showToast(`Carpeta "${name}" creada`);
  };

  // Academic catalog CRUD
  const addUniversity = (name: string, acronym?: string, country?: string) => {
    const acr = acronym || name.slice(0, 4).toUpperCase();
    const ctry = country || 'General';
    const newU: University = { id: `u_${Date.now()}`, name, acronym: acr, country: ctry };
    setUniversities(prev => [...prev, newU]);
    showToast(`Universidad "${name}" agregada.`);
  };

  const updateUniversity = (id: string, name: string, acronym: string) => {
    setUniversities(prev => prev.map(u => u.id === id ? { ...u, name, acronym } : u));
    showToast('Universidad actualizada.');
  };

  const deleteUniversity = (id: string) => {
    setUniversities(prev => prev.filter(u => u.id !== id));
    showToast('Universidad eliminada.');
  };

  const addCareer = (name: string, universityId?: string) => {
    const uId = universityId || universities[0]?.id || 'u1';
    const newC: Career = { id: `c_${Date.now()}`, name, universityId: uId };
    setCareers(prev => [...prev, newC]);
    showToast(`Carrera "${name}" agregada.`);
  };

  const updateCareer = (id: string, name: string) => {
    setCareers(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    showToast('Carrera actualizada.');
  };

  const deleteCareer = (id: string) => {
    setCareers(prev => prev.filter(c => c.id !== id));
    showToast('Carrera eliminada.');
  };

  const updateUserRP = (delta: number) => {
    setUser(prev => ({
      ...prev,
      rpPoints: Math.max(0, prev.rpPoints + delta)
    }));
  };

  const toggleIncognito = () => {
    setUser(prev => {
      const next = !prev.isIncognito;
      showToast(next ? 'Modo Incógnito activado: Nombre protegido' : 'Modo Incógnito desactivado: Nombre público');
      return { ...prev, isIncognito: next };
    });
  };

  const addSubject = (name: string, careerId: string, semester: number) => {
    const newS: Subject = { id: `s_${Date.now()}`, name, careerId, semester };
    setSubjects(prev => [...prev, newS]);
    showToast(`Materia "${name}" agregada.`);
  };

  const updateSubject = (id: string, name: string, semester: number) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name, semester } : s));
    showToast('Materia actualizada.');
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    showToast('Materia eliminada.');
  };

  // Pending requests mechanism ("Opción Otra")
  const submitPendingRequest = (type: 'university' | 'career' | 'subject', customValue: string, relatedEntityName?: string) => {
    const newReq: PendingRequest = {
      id: `req_${Date.now()}`,
      type,
      customValue,
      relatedEntityName,
      submittedByUsername: user.username,
      submittedAt: new Date().toLocaleString(),
      status: 'pending',
      adminNotes: 'Ingresado por usuario mediante "Opción Otra"'
    };
    setPendingRequests(prev => [newReq, ...prev]);
  };

  const approvePendingRequest = (id: string) => {
    const req = pendingRequests.find(r => r.id === id);
    if (!req) return;

    if (req.type === 'university') {
      addUniversity(req.customValue, req.customValue.slice(0, 5).toUpperCase(), 'General');
    } else if (req.type === 'career') {
      const u = universities[0]?.id || 'u1';
      addCareer(req.customValue, u);
    } else if (req.type === 'subject') {
      const c = careers[0]?.id || 'c1';
      addSubject(req.customValue, c, 1);
    }

    setPendingRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    showToast(`Solicitud para "${req.customValue}" aprobada e incorporada al catálogo oficial.`);
  };

  const rejectPendingRequest = (id: string) => {
    setPendingRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    showToast('Solicitud rechazada.');
  };

  const mergePendingRequest = (id: string, targetName: string) => {
    setPendingRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'merged', adminNotes: `Fusionada con: ${targetName}` } : r));
    showToast(`Solicitud fusionada con "${targetName}".`);
  };

  // Tournaments
  const addTournament = (data: Omit<Tournament, 'id' | 'participantsCount' | 'bracket'>) => {
    const newT: Tournament = {
      ...data,
      id: `trn_${Date.now()}`,
      participantsCount: 8,
      bracket: [
        {
          id: `m_${Date.now()}_1`,
          roundName: 'Semifinal A',
          player1: { id: user.id, username: user.username },
          player2: { id: 'usr_2', username: 'sofia_code' },
          status: 'pending'
        },
        {
          id: `m_${Date.now()}_2`,
          roundName: 'Semifinal B',
          player1: { id: 'usr_3', username: 'carlos_math' },
          player2: { id: 'usr_6', username: 'diego_dev' },
          status: 'pending'
        },
        {
          id: `m_${Date.now()}_3`,
          roundName: 'Gran Final',
          player1: { id: 'tbd', username: 'Ganador Semifinal A' },
          player2: { id: 'tbd', username: 'Ganador Semifinal B' },
          status: 'pending'
        }
      ]
    };
    setTournaments(prev => [newT, ...prev]);
    showToast(`Torneo "${newT.title}" creado con éxito.`);
  };

  // Solo history
  const saveSoloSession = (session: SoloGameSession) => {
    setSoloHistory(prev => [session, ...prev]);
    // Award RP Points and streak
    setUser(prev => ({
      ...prev,
      rpPoints: prev.rpPoints + Math.round(session.score / 2),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        updateUserProfile,
        isDarkMode,
        toggleDarkMode,
        currentView,
        setCurrentView,
        activeCardId,
        setActiveCardId,
        activeSubjectName,
        setActiveSubjectName,
        selectedCommunityMember,
        setSelectedCommunityMember,
        editorContentType,
        setEditorContentType,
        editingCardId,
        setEditingCardId,
        cards,
        addCard,
        updateCard,
        deleteCard,
        toggleFavorite,
        folders,
        addFolder,
        universities,
        careers,
        subjects,
        addUniversity,
        updateUniversity,
        deleteUniversity,
        addCareer,
        updateCareer,
        deleteCareer,
        addSubject,
        updateSubject,
        deleteSubject,
        updateUserRP,
        toggleIncognito,
        pendingRequests,
        submitPendingRequest,
        approvePendingRequest,
        rejectPendingRequest,
        mergePendingRequest,
        tournaments,
        addTournament,
        soloHistory,
        saveSoloSession,
        activeRoom,
        setActiveRoom,
        isAuthModalOpen,
        setIsAuthModalOpen,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
