import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
// Agrega esto arriba en tus imports
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';

import { db } from '../lib/firebase';

import { collection, addDoc, deleteDoc, deleteField, doc, getDoc, getDocs, onSnapshot, query, runTransaction, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

import { 
  User, 
  PublicUser,
  StudyItemCard, 
  Folder, 
  University, 
  Career, 
  Subject, 
  PendingRequest, 
  ContentType,
  MultiplayerRoom,
  EducatorKind
} from '../types';
import { INITIAL_USER } from '../data/mockData';
import { toPublicUser } from '../utils/username';
import {
  joinLiveRoom,
  leaveLiveRoom,
  listenToRoom,
  startLiveRoom,
  updateLiveRoomProgress,
} from '../lib/multiplayer';

export const ADMIN_EMAIL = 'juanmiguel71293@gmail.com';

export function isNoteaAdmin(person: { email?: string; role?: string } | null | undefined) {
  if (!person) return false;
  return person.role === 'admin' || (person.email || '').toLowerCase() === ADMIN_EMAIL;
}

const createCodeSuffix = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    .slice(-4)
    .toUpperCase();
};

export type AppView = 
  | 'library' 
  | 'study' 
  | 'solo_game' 
  | 'multiplayer_lobby' 
  | 'editor' 
  | 'content_preview'
  | 'admin' 
  | 'profile' 
  | 'creator_profile'
  | 'subject_detail'
  | 'courses';

interface AppContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  updateUserProfile: (updates: Partial<User>) => void;
  isDarkMode: boolean;
  
  // Navigation & Views
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  selectedCreatorId: string | null;
  selectedCreatorUsername: string | null;
  openCreatorProfile: (creator: { id?: string; username?: string }) => void;
  editorContentType: ContentType;
  setEditorContentType: (type: ContentType) => void;
  editingCardId: string | null;
  setEditingCardId: (id: string | null) => void;

  // Cards / Study Materials & Games
  cards: StudyItemCard[];
  addCard: (card: Omit<StudyItemCard, 'id' | 'createdAt' | 'authorId' | 'authorUsername' | 'authorUniversity' | 'ratingsCount' | 'rating' | 'ratingSum' | 'isFavorite'>) => Promise<StudyItemCard | undefined>;
  updateCard: (id: string, updates: Partial<StudyItemCard>) => void;
  rateCard: (id: string, rating: number) => Promise<void>;
  deleteCard: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Folders
  folders: Folder[];
  addFolder: (name: string, color?: string) => void;
  updateFolder: (id: string, name: string, color: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  assignCardToFolder: (cardId: string, folderId: string | null) => Promise<void>;

  // Academic Catalogs
  universities: University[];
  careers: Career[];
  subjects: Subject[];
  addUniversity: (name: string, acronym?: string, country?: string) => void;
  updateUniversity: (id: string, name: string, acronym: string) => void;
  deleteUniversity: (id: string) => void;
  addCareer: (name: string, universityIds?: string[]) => void;
  updateCareer: (id: string, name: string, universityIds?: string[]) => void;
  deleteCareer: (id: string) => void;
  addSubject: (name: string) => void;
  updateSubject: (id: string, name: string) => void;
  deleteSubject: (id: string) => void;
  addCatalogBatch: (kind: 'university' | 'career' | 'subject', names: string[]) => Promise<{ added: number; skipped: string[] }>;

  // Admin Pending Requests ("Opción Otra")
  pendingRequests: PendingRequest[];
  submitPendingRequest: (type: 'university' | 'career' | 'subject', customValue: string, relatedEntityName?: string) => void;
  approvePendingRequest: (id: string) => void;
  rejectPendingRequest: (id: string) => void;
  mergePendingRequest: (id: string, targetName: string) => void;
  requestEducatorVerification: (kind: EducatorKind, university: string) => Promise<void>;
  reviewEducatorRequest: (userId: string, decision: 'verified' | 'rejected') => Promise<void>;
  assignEducatorVerification: (userId: string, kind: EducatorKind, university: string) => Promise<void>;
  clearEducatorVerification: (userId: string) => Promise<void>;
  setUserAdminRole: (userId: string, makeAdmin: boolean) => Promise<void>;

  activeRoom: MultiplayerRoom | null;
  setActiveRoom: React.Dispatch<React.SetStateAction<MultiplayerRoom | null>>;
  joinRoom: (code: string, guestName?: string) => Promise<MultiplayerRoom | null>;
  startRoom: () => Promise<boolean>;
  updateRoomProgress: (score: number, currentBlockIndex: number, finished: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  
  // Auth Modal trigger
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'register' | 'login';
  openAuthModal: (mode?: 'register' | 'login') => void;
  authReady: boolean;
  signOutUser: () => Promise<void>;
  openUserProfile: () => void;
  previousView: AppView;

  directoryUsers: PublicUser[];

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light-mode');
    localStorage.setItem('notea_theme', 'dark');
  }, []);

  // User State con Firebase Auth real
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('login');

  const openAuthModal = (mode: 'register' | 'login' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(INITIAL_USER);
    setCurrentView('subject_detail');
    showToast('Sesión cerrada correctamente.');
  };

  useEffect(() => {
    // Escucha en tiempo real si hay un usuario logueado en Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.isAnonymous) {
        const savedName = sessionStorage.getItem('notea_guest_name')?.trim() || '';
        setUser({
          ...INITIAL_USER,
          id: firebaseUser.uid,
          username: savedName || 'invitado',
          fullName: savedName || 'Invitado',
          university: '',
          career: '',
          isIncognito: false,
          isGuest: true,
        });
        setAuthReady(true);
        return;
      }

      if (firebaseUser) {
        let localProfile: Partial<User> = {};
        try {
          const storedUser = localStorage.getItem('notea_user');
          const parsedUser = storedUser ? JSON.parse(storedUser) as User : null;
          if (parsedUser?.id === firebaseUser.uid) {
            localProfile = parsedUser;
          }
        } catch (error) {
          console.warn('No se pudo leer el perfil local:', error);
        }

        try {
          const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (profileSnapshot.exists()) {
            const storedProfile = profileSnapshot.data() as User;
            if ('rpPoints' in profileSnapshot.data()) {
              await updateDoc(doc(db, 'users', firebaseUser.uid), { rpPoints: deleteField() }).catch(() => undefined);
            }
            if (storedProfile.mustVerifyEmail && !firebaseUser.emailVerified) {
              setUser(INITIAL_USER);
              setAuthReady(true);
              return;
            }

            if (firebaseUser.emailVerified && storedProfile.mustVerifyEmail) {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                mustVerifyEmail: false,
                emailVerified: true,
              });
              storedProfile.mustVerifyEmail = false;
              storedProfile.emailVerified = true;
            }

            setUser({
              ...INITIAL_USER,
              ...storedProfile,
              id: firebaseUser.uid,
              email: firebaseUser.email || storedProfile.email || '',
              isGuest: false,
            });
            setAuthReady(true);
            return;
          }

          if (!firebaseUser.emailVerified) {
            setUser(INITIAL_USER);
            setAuthReady(true);
            return;
          }

          setUser({
            ...INITIAL_USER,
            ...localProfile,
            id: firebaseUser.uid,
            email: firebaseUser.email || localProfile.email || '',
            isGuest: false,
          });
          setAuthReady(true);
          return;
        } catch (error) {
          console.error('Error al cargar el perfil desde Firestore:', error);
        }

        setUser({
          ...INITIAL_USER,
          ...localProfile,
          id: firebaseUser.uid,
          email: firebaseUser.email || localProfile.email || '',
          fullName: localProfile.fullName || firebaseUser.displayName || 'Completa tu perfil',
          username: localProfile.username || firebaseUser.email?.split('@')[0] || 'usuario',
          isGuest: false,
        });
        setAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('No se pudo abrir la sesión de invitado:', error);
          setUser(INITIAL_USER);
          setAuthReady(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('notea_user', JSON.stringify(user));
  }, [user]);

  const updateUserProfile = (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  // Cards state
  // Cards state sincronizadas en tiempo real con Firestore
  const [cards, setCards] = useState<StudyItemCard[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const libraryCards = useMemo(
    () => cards.map(card => ({ ...card, isFavorite: favoriteIds.includes(card.id) })),
    [cards, favoriteIds],
  );

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || user.isGuest) {
      setFavoriteIds([]);
      return;
    }
    return onSnapshot(collection(db, 'users', uid, 'favorites'), snapshot => {
      setFavoriteIds(snapshot.docs.map(item => item.id));
    }, () => setFavoriteIds([]));
  }, [user.id, user.isGuest]);

  useEffect(() => {
    // Creamos la consulta a la colección 'cards'
    const q = query(collection(db, 'cards'));
    
    // onSnapshot escucha en tiempo real cualquier cambio o inserción
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cardsList: StudyItemCard[] = [];
      querySnapshot.forEach((doc) => {
        cardsList.push({ id: doc.id, ...doc.data() } as StudyItemCard);
      });
      setCards(cardsList);
    }, (error) => {
      console.error("Error al cargar las tarjetas desde Firestore:", error);
      showToast("Error al sincronizar la biblioteca.");
    });

    return () => unsubscribe();
  }, []);

  // Folders state
  const [folders, setFolders] = useState<Folder[]>([]);

  // Academic catalogs state
  const [universities, setUniversities] = useState<University[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<PublicUser[]>([]);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, 'folders'), snapshot => {
        setFolders(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Folder[]);
      }, error => console.error('Error al cargar carpetas:', error)),
      onSnapshot(collection(db, 'universities'), snapshot => {
        setUniversities(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as University[]);
      }, error => console.error('Error al cargar universidades:', error)),
      onSnapshot(collection(db, 'careers'), snapshot => {
        setCareers(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Career[]);
      }, error => console.error('Error al cargar carreras:', error)),
      onSnapshot(collection(db, 'subjects'), snapshot => {
        setSubjects(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Subject[]);
      }, error => console.error('Error al cargar materias:', error)),
      onSnapshot(collection(db, 'pendingRequests'), snapshot => {
        setPendingRequests(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as PendingRequest[]);
      }, error => console.error('Error al cargar solicitudes:', error)),
      onSnapshot(collection(db, 'users'), snapshot => {
        const people = snapshot.docs
          .map(item => toPublicUser(item.id, item.data() as Partial<PublicUser> & Record<string, unknown>));
        setDirectoryUsers(people.filter(item => item.username && item.username !== 'desconocido'));
        const selfId = auth.currentUser?.uid;
        const self = selfId ? people.find(item => item.id === selfId) : undefined;
        if (!self) return;
        setUser(prev => {
          if (prev.isGuest || prev.id !== self.id) return prev;
          const same = prev.role === (self.role || 'user')
            && prev.educatorKind === self.educatorKind
            && prev.educatorUniversity === self.educatorUniversity
            && prev.educatorStatus === self.educatorStatus;
          if (same) return prev;
          return {
            ...prev,
            role: self.role === 'admin' ? 'admin' : 'user',
            educatorKind: self.educatorKind,
            educatorUniversity: self.educatorUniversity,
            educatorStatus: self.educatorStatus,
          };
        });
      }, error => console.error('Error al cargar directorio de usuarios:', error)),
    ];

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);

  // Navigation & Selection States
  const [currentView, setCurrentView] = useState<AppView>('library');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [selectedCreatorUsername, setSelectedCreatorUsername] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<AppView>('library');
  const [editorContentType, setEditorContentType] = useState<ContentType>('material');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openUserProfile = () => {
    if (user.isGuest) {
      openAuthModal('login');
      return;
    }
    setCurrentView('profile');
  };

  const openCreatorProfile = (creator: { id?: string; username?: string }) => {
    const handle = (creator.username || '').replace(/^@+/, '').toLowerCase();
    const isSelf = (creator.id && (creator.id === user.id || creator.id === auth.currentUser?.uid))
      || (handle && handle === user.username.toLowerCase());
    if (isSelf) {
      openUserProfile();
      return;
    }
    if (currentView !== 'creator_profile') setPreviousView(currentView);
    setSelectedCreatorId(creator.id || null);
    setSelectedCreatorUsername(handle || null);
    setCurrentView('creator_profile');
  };

  const isAdmin = isNoteaAdmin(user);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const requestEducatorVerification = async (kind: EducatorKind, university: string) => {
    if (user.isGuest || !auth.currentUser) {
      openAuthModal('login');
      showToast('Inicia sesión para enviar la solicitud.');
      return;
    }
    const trimmed = university.trim();
    if (!trimmed) {
      showToast('Indica la universidad.');
      return;
    }
    if (user.educatorStatus === 'verified') {
      showToast('Tu verificación ya está activa.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        educatorKind: kind,
        educatorUniversity: trimmed,
        educatorStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });
      setUser(current => ({
        ...current,
        educatorKind: kind,
        educatorUniversity: trimmed,
        educatorStatus: 'pending',
      }));
      showToast('Solicitud enviada. Un admin la revisará.');
    } catch (error) {
      console.error('No se pudo enviar la verificación:', error);
      showToast('No se pudo enviar la solicitud. Revisa las reglas de acceso.');
    }
  };

  const reviewEducatorRequest = async (userId: string, decision: 'verified' | 'rejected') => {
    if (!isAdmin) return;
    try {
      if (decision === 'verified') {
        await updateDoc(doc(db, 'users', userId), {
          educatorStatus: 'verified',
          updatedAt: new Date().toISOString(),
        });
        showToast('Verificación aprobada.');
      } else {
        await updateDoc(doc(db, 'users', userId), {
          educatorStatus: deleteField(),
          educatorKind: deleteField(),
          educatorUniversity: deleteField(),
          updatedAt: new Date().toISOString(),
        });
        showToast('Solicitud rechazada.');
      }
    } catch (error) {
      console.error('No se pudo revisar la verificación:', error);
      showToast('Firestore rechazó la revisión.');
    }
  };

  const assignEducatorVerification = async (userId: string, kind: EducatorKind, university: string) => {
    if (!isAdmin) return;
    const trimmed = university.trim();
    if (!trimmed) {
      showToast('Indica la universidad.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        educatorKind: kind,
        educatorUniversity: trimmed,
        educatorStatus: 'verified',
        updatedAt: new Date().toISOString(),
      });
      showToast(kind === 'professor' ? 'Profesor verificado.' : 'Tutor verificado.');
    } catch (error) {
      console.error('No se pudo asignar la verificación:', error);
      showToast('Firestore rechazó la verificación.');
    }
  };

  const clearEducatorVerification = async (userId: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        educatorStatus: deleteField(),
        educatorKind: deleteField(),
        educatorUniversity: deleteField(),
        updatedAt: new Date().toISOString(),
      });
      showToast('Se quitó la verificación.');
    } catch (error) {
      console.error('No se pudo quitar la verificación:', error);
      showToast('Firestore rechazó el cambio.');
    }
  };

  const setUserAdminRole = async (userId: string, makeAdmin: boolean) => {
    if (!isAdmin) return;
    try {
      const snapshot = await getDoc(doc(db, 'users', userId));
      if (!snapshot.exists()) {
        showToast('No encontré esa cuenta.');
        return;
      }
      const email = String(snapshot.data().email || '').toLowerCase();
      if (!makeAdmin && email === ADMIN_EMAIL) {
        showToast('La cuenta principal no se puede quitar.');
        return;
      }
      await updateDoc(doc(db, 'users', userId), {
        role: makeAdmin ? 'admin' : 'user',
        updatedAt: new Date().toISOString(),
      });
      showToast(makeAdmin ? 'Ahora es admin.' : 'Se quitó el admin.');
    } catch (error) {
      console.error('No se pudo cambiar el rol:', error);
      showToast('Firestore rechazó el cambio de admin.');
    }
  };

  // Card actions
  // Card actions conectadas a Firestore
  const addCard = async (cardData: Omit<StudyItemCard, 'id' | 'createdAt' | 'authorId' | 'authorUsername' | 'authorUniversity' | 'ratingsCount' | 'rating' | 'ratingSum' | 'isFavorite'>) => {
    try {
      const authenticatedUser = auth.currentUser;
      if (!authenticatedUser) {
        showToast('Debes iniciar sesión para guardar este contenido.');
        return;
      }

      const authorCards = await getDocs(query(collection(db, 'cards'), where('authorId', '==', authenticatedUser.uid)));
      const existing = authorCards.docs.find(item => {
        const data = item.data() as StudyItemCard;
        return data.title?.trim() === cardData.title.trim() && data.contentType === cardData.contentType;
      });
      if (existing) {
        showToast('Este contenido ya existe en tu biblioteca.');
        return { id: existing.id, ...existing.data() } as StudyItemCard;
      }

      let accessCode = '';
      do {
        const prefix = cardData.subjectName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'NOTE';
        const suffix = createCodeSuffix();
        accessCode = `${prefix}-${suffix}`;
        const existingCode = await getDocs(query(collection(db, 'cards'), where('accessCode', '==', accessCode)));
        if (existingCode.empty) break;
      } while (true);

      const newCardData = {
        ...cardData,
        accessCode,
        authorId: authenticatedUser.uid,
        authorUsername: user.username,
        authorUniversity: user.university.split(' ').map((w: string) => w[0]).join('').slice(0, 5).toUpperCase() || 'UNIV',
        rating: 0,
        ratingsCount: 0,
        ratingSum: 0,
        ratingsByUser: {},
        createdAt: new Date().toISOString().split('T')[0],
        ...(user.avatarUrl ? { authorAvatar: user.avatarUrl } : {}),
      };

      // Guardar en la base de datos real de Firestore
      const stableId = `${authenticatedUser.uid}_${cardData.contentType}_${cardData.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}`;
      const docRef = doc(db, 'cards', stableId);
      const existingById = await getDoc(docRef);
      if (existingById.exists()) {
        showToast('Este contenido ya existe en tu biblioteca.');
        return { id: docRef.id, ...existingById.data() } as StudyItemCard;
      }
      await setDoc(docRef, newCardData);
      
      const newCard: StudyItemCard = {
        ...newCardData,
        id: docRef.id,
        isFavorite: false,
      };

      setCards(prev => [newCard, ...prev]);
      showToast(`¡"${newCard.title}" guardado en la nube con el código ${accessCode}!`);
      return newCard;
    } catch (error) {
      console.error("Error al guardar la tarjeta en Firestore:", error);
      const code = (error as { code?: string })?.code;
      showToast(code === 'permission-denied'
        ? 'Firestore rechazó el guardado. Revisa las reglas de cards.'
        : `Error al guardar: ${(error as Error)?.message || 'revisa tu conexión.'}`);
    }
  };

  const updateCard = async (id: string, updates: Partial<StudyItemCard>) => {
    try {
      await updateDoc(doc(db, 'cards', id), updates);
      showToast('Cambios guardados con éxito.');
    } catch (error) {
      console.error('Error al actualizar el contenido:', error);
      showToast('No se pudieron guardar los cambios.');
    }
  };

  const rateCard = async (id: string, rating: number) => {
    if (user.isGuest) {
      openAuthModal('login');
      return;
    }
    const nextRating = Math.min(5, Math.max(1, Math.round(rating)));
    const voterId = auth.currentUser?.uid;
    if (!voterId) {
      showToast('Debes iniciar sesión para calificar.');
      return;
    }
    try {
      await runTransaction(db, async transaction => {
        const cardRef = doc(db, 'cards', id);
        const snapshot = await transaction.get(cardRef);
        if (!snapshot.exists()) throw new Error('Contenido no encontrado.');
        const data = snapshot.data() as StudyItemCard;
        const ratingsByUser = { ...(data.ratingsByUser || {}) };
        ratingsByUser[voterId] = nextRating;
        const nextCount = Object.keys(ratingsByUser).length;
        const nextSum = Object.values(ratingsByUser).reduce((total, value) => total + value, 0);
        transaction.update(cardRef, {
          ratingSum: nextSum,
          ratingsCount: nextCount,
          rating: Number((nextSum / nextCount).toFixed(2)),
          ratingsByUser,
        });
      });
      showToast('Calificación guardada.');
    } catch (error) {
      console.error('Error al calificar contenido:', error);
      showToast('No se pudo guardar la calificación.');
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const directRef = doc(db, 'cards', id);
      const directSnapshot = await getDoc(directRef);
      if (directSnapshot.exists()) {
        await deleteDoc(directRef);
      } else {
        const matches = await getDocs(query(collection(db, 'cards'), where('id', '==', id)));
        await Promise.all(matches.docs.map(item => deleteDoc(item.ref)));
      }
      showToast('Elemento eliminado de la biblioteca.');
    } catch (error) {
      console.error('Error al eliminar el contenido:', error);
      showToast('No se pudo eliminar el contenido.');
    }
  };

  const toggleFavorite = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (user.isGuest || !uid) {
      openAuthModal('login');
      return;
    }
    const nextFavorite = !favoriteIds.includes(id);
    try {
      const favoriteRef = doc(db, 'users', uid, 'favorites', id);
      if (nextFavorite) await setDoc(favoriteRef, { createdAt: new Date().toISOString() });
      else await deleteDoc(favoriteRef);
      showToast(nextFavorite ? 'Guardado en tus favoritos.' : 'Lo quitaste de tus favoritos.');
    } catch (error) {
      console.error('Error al actualizar favorito:', error);
      showToast('No se pudo actualizar Favoritos.');
    }
  };

  // Folder actions
  const addFolder = async (name: string, color: string = '#6366f1') => {
    if (user.isGuest || !auth.currentUser) {
      openAuthModal('login');
      return;
    }
    if (!name.trim()) return;
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) {
      showToast('Debes iniciar sesión para crear carpetas.');
      return;
    }
    const newFolder = {
      name: name.trim(),
      color,
      ownerId,
    };
    try {
      await addDoc(collection(db, 'folders'), newFolder);
      showToast(`Carpeta "${name}" creada`);
    } catch (error) {
      console.error('Error al crear carpeta:', error);
      showToast('No se pudo crear la carpeta.');
    }
  };

  const updateFolder = async (id: string, name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateDoc(doc(db, 'folders', id), { name: trimmed, color });
    } catch (error) {
      console.error('Error al actualizar carpeta:', error);
      showToast('No se pudo actualizar la carpeta.');
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'folders', id));
      const linked = cards.filter(card => card.folderId === id);
      await Promise.all(linked.map(card => updateDoc(doc(db, 'cards', card.id), { folderId: deleteField() })));
      showToast('Carpeta eliminada.');
    } catch (error) {
      console.error('Error al eliminar carpeta:', error);
      showToast('No se pudo eliminar la carpeta.');
    }
  };

  const assignCardToFolder = async (cardId: string, folderId: string | null) => {
    const card = cards.find(item => item.id === cardId);
    if (!card) return;
    try {
      await updateDoc(doc(db, 'cards', cardId), folderId ? { folderId } : { folderId: deleteField() });
      showToast(folderId ? 'Agregado a la carpeta.' : 'Quitado de la carpeta.');
    } catch (error) {
      console.error('Error al asignar carpeta:', error);
      showToast('No se pudo actualizar la carpeta.');
    }
  };

  // Academic catalog CRUD
  const addUniversity = async (name: string, acronym?: string, country?: string) => {
    const acr = acronym || name.slice(0, 4).toUpperCase();
    const ctry = country || 'General';
    const order = universities.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1;
    try {
      await addDoc(collection(db, 'universities'), { name, acronym: acr, country: ctry, order });
      showToast(`Universidad "${name}" agregada.`);
    } catch (error) {
      console.error('Error al crear universidad:', error);
      showToast('No se pudo crear la universidad.');
    }
  };

  const updateUniversity = async (id: string, name: string, acronym: string) => {
    await updateDoc(doc(db, 'universities', id), { name, acronym });
    showToast('Universidad actualizada.');
  };

  const deleteUniversity = async (id: string) => {
    try {
      const directRef = doc(db, 'universities', id);
      const directSnapshot = await getDoc(directRef);
      if (directSnapshot.exists()) {
        await deleteDoc(directRef);
      } else {
        const matches = await getDocs(query(collection(db, 'universities'), where('id', '==', id)));
        await Promise.all(matches.docs.map(item => deleteDoc(item.ref)));
      }
      showToast('Universidad eliminada.');
    } catch (error) {
      console.error('Error al eliminar universidad:', error);
      showToast('No se pudo eliminar la universidad.');
    }
  };

  const addCareer = async (name: string, universityIds?: string[]) => {
    const order = careers.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1;
    const linked = universityIds ?? universities.map(item => item.id);
    try {
      await addDoc(collection(db, 'careers'), { name, universityIds: linked, order });
      showToast(`Carrera "${name}" agregada.`);
    } catch (error) {
      console.error('Error al crear carrera:', error);
      showToast('No se pudo crear la carrera.');
    }
  };

  const updateCareer = async (id: string, name: string, universityIds?: string[]) => {
    const payload: Record<string, unknown> = { name };
    if (universityIds) payload.universityIds = universityIds;
    await updateDoc(doc(db, 'careers', id), payload);
    showToast('Carrera actualizada.');
  };

  const deleteCareer = async (id: string) => {
    try {
      const directRef = doc(db, 'careers', id);
      const directSnapshot = await getDoc(directRef);
      if (directSnapshot.exists()) {
        await deleteDoc(directRef);
      } else {
        const matches = await getDocs(query(collection(db, 'careers'), where('id', '==', id)));
        await Promise.all(matches.docs.map(item => deleteDoc(item.ref)));
      }
      showToast('Carrera eliminada.');
    } catch (error) {
      console.error('Error al eliminar carrera:', error);
      showToast('No se pudo eliminar la carrera.');
    }
  };

  const addSubject = async (name: string) => {
    const order = subjects.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1;
    try {
      await addDoc(collection(db, 'subjects'), { name, order });
      showToast(`Materia "${name}" agregada.`);
    } catch (error) {
      console.error('Error al crear materia:', error);
      showToast('No se pudo crear la materia.');
    }
  };

  const updateSubject = async (id: string, name: string) => {
    await updateDoc(doc(db, 'subjects', id), { name });
    showToast('Materia actualizada.');
  };

  const addCatalogBatch = async (kind: 'university' | 'career' | 'subject', names: string[]) => {
    let order = (kind === 'university' ? universities : kind === 'career' ? careers : subjects)
      .reduce((max, item) => Math.max(max, item.order ?? 0), 0);
    const linked = universities.map(item => item.id);
    const collectionName = kind === 'university' ? 'universities' : kind === 'career' ? 'careers' : 'subjects';
    for (let start = 0; start < names.length; start += 400) {
      const batch = writeBatch(db);
      names.slice(start, start + 400).forEach(name => {
        order += 1;
        const ref = doc(collection(db, collectionName));
        if (kind === 'university') {
          batch.set(ref, { name, acronym: name.slice(0, 4).toUpperCase(), country: 'General', order });
        } else if (kind === 'career') {
          batch.set(ref, { name, universityIds: linked, order });
        } else {
          batch.set(ref, { name, order });
        }
      });
      await batch.commit();
    }
    return { added: names.length, skipped: [] as string[] };
  };

  const deleteSubject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', id));
      showToast('Materia eliminada.');
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      showToast('No se pudo eliminar la materia.');
    }
  };

  // Pending requests mechanism ("Opción Otra")
  const submitPendingRequest = async (type: 'university' | 'career' | 'subject', customValue: string, relatedEntityName?: string) => {
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
    try {
      await setDoc(doc(db, 'pendingRequests', newReq.id), newReq);
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      showToast('No se pudo enviar la solicitud.');
    }
  };

  const approvePendingRequest = async (id: string) => {
    const req = pendingRequests.find(r => r.id === id);
    if (!req) return;

    if (req.type === 'university') {
      addUniversity(req.customValue, req.customValue.slice(0, 5).toUpperCase(), 'General');
    } else if (req.type === 'career') {
      addCareer(req.customValue);
    } else if (req.type === 'subject') {
      addSubject(req.customValue);
    }

    await updateDoc(doc(db, 'pendingRequests', id), { status: 'approved' });
    showToast(`Solicitud para "${req.customValue}" aprobada e incorporada al catálogo oficial.`);
  };

  const rejectPendingRequest = async (id: string) => {
    await updateDoc(doc(db, 'pendingRequests', id), { status: 'rejected' });
    showToast('Solicitud rechazada.');
  };

  const mergePendingRequest = async (id: string, targetName: string) => {
    await updateDoc(doc(db, 'pendingRequests', id), {
      status: 'merged',
      adminNotes: `Fusionada con: ${targetName}`
    });
    showToast(`Solicitud fusionada con "${targetName}".`);
  };

  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoom(null);
      return;
    }
    const unsubscribe = listenToRoom(activeRoomId, room => {
      if (!room) {
        setActiveRoom(null);
        setActiveRoomId(null);
        return;
      }
      setActiveRoom(room);
    });
    return () => unsubscribe();
  }, [activeRoomId]);

  const joinRoom = async (code: string, guestName?: string) => {
    if (!auth.currentUser) {
      openAuthModal('login');
      return null;
    }
    let player = user;
    if (user.isGuest) {
      const name = (guestName || sessionStorage.getItem('notea_guest_name') || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      if (name.length < 2) {
        showToast('Elige un nombre para entrar a la partida.');
        return null;
      }
      sessionStorage.setItem('notea_guest_name', name);
      player = {
        ...user,
        id: auth.currentUser.uid,
        username: name,
        fullName: name,
        isIncognito: false,
        isGuest: true,
      };
      setUser(player);
    }
    try {
      const room = await joinLiveRoom(code, player);
      setActiveRoomId(room.roomCode);
      setActiveRoom(room);
      if (room.gameId) setActiveCardId(room.gameId);
      showToast(`Entraste a la sala ${room.roomCode}.`);
      return room;
    } catch (error) {
      console.error('Error al unirse a la sala:', error);
      showToast((error as Error).message || 'No se pudo entrar a la sala.');
      return null;
    }
  };

  const startRoom = async () => {
    if (!activeRoom) return false;
    try {
      await startLiveRoom(activeRoom, auth.currentUser?.uid || user.id);
      showToast('¡La partida comenzó!');
      return true;
    } catch (error) {
      showToast((error as Error).message || 'No se pudo iniciar la partida.');
      return false;
    }
  };

  const updateRoomProgress = async (score: number, currentBlockIndex: number, finished: boolean) => {
    if (!activeRoom) return;
    const userId = auth.currentUser?.uid || user.id;
    setActiveRoom(prev => {
      if (!prev?.players[userId]) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [userId]: {
            ...prev.players[userId],
            score,
            currentBlockIndex,
            finished,
            ...(finished ? { finishedAt: Date.now() } : {}),
          },
        },
        ...(finished && Object.values({ ...prev.players, [userId]: { ...prev.players[userId], finished: true } }).every(player => player.finished)
          ? { state: 'finished' as const }
          : {}),
      };
    });
    try {
      await updateLiveRoomProgress({
        roomCode: activeRoom.roomCode,
        userId,
        score,
        currentBlockIndex,
        finished,
      });
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      showToast((error as Error).message || 'No se pudo pasar al siguiente bloque.');
    }
  };

  const leaveRoom = async () => {
    if (!activeRoom) {
      setActiveRoomId(null);
      return;
    }
    try {
      await leaveLiveRoom(activeRoom, auth.currentUser?.uid || user.id);
    } catch (error) {
      console.error('Error al salir de la sala:', error);
    } finally {
      setActiveRoom(null);
      setActiveRoomId(null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        updateUserProfile,
        isDarkMode: true,
        currentView,
        setCurrentView,
        activeCardId,
        setActiveCardId,
        selectedCreatorId,
        selectedCreatorUsername,
        openCreatorProfile,
        editorContentType,
        setEditorContentType,
        editingCardId,
        setEditingCardId,
        cards: libraryCards,
          addCard,
        updateCard,
        rateCard,
        deleteCard,
        toggleFavorite,
        folders,
        addFolder,
        updateFolder,
        deleteFolder,
        assignCardToFolder,
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
        addCatalogBatch,
        pendingRequests,
        submitPendingRequest,
        approvePendingRequest,
        rejectPendingRequest,
        mergePendingRequest,
        requestEducatorVerification,
        reviewEducatorRequest,
        assignEducatorVerification,
        clearEducatorVerification,
        setUserAdminRole,
        activeRoom,
        setActiveRoom,
        joinRoom,
        startRoom,
        updateRoomProgress,
        leaveRoom,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        openAuthModal,
        authReady,
        signOutUser,
        openUserProfile,
        previousView,
        directoryUsers,
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
