import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from '../common/WhatsAppAvatar';
import { bannerStyle } from '../../utils/banner';
import type { User } from '../../types';
import { careersForUniversity, sortedUniqueSubjects } from '../../utils/catalog';
import { isUsernameTaken, normalizeUsername } from '../../utils/username';
import { toFirestoreUser } from '../../utils/userDoc';
import { sortByMostLiked } from '../../utils/ratings';
import { CreatorCatalog } from './CreatorCatalog';
import { AccountCourses } from './AccountCourses';
import { accountUrl, copyAppLink, rememberPath } from '../../lib/links';
import { EducatorBadge, EducatorRequestSection } from './EducatorVerification';
import { 
  User as UserIcon, 
  Mail, 
  Building, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ArrowLeft, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  Palette, 
  AlertCircle,
  Eye,
  Settings
} from 'lucide-react';

const PRESET_BANNERS = [
  { id: 'indigo', name: 'Índigo Notea', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' },
  { id: 'emerald', name: 'Esmeralda', value: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)' },
  { id: 'purple', name: 'Amatista', value: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #9333ea 100%)' },
  { id: 'amber', name: 'Dorado Élite', value: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #d97706 100%)' },
  { id: 'slate', name: 'Grafito', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
  { id: 'rose', name: 'Rubí', value: 'linear-gradient(135deg, #4c0519 0%, #881337 50%, #e11d48 100%)' },
];

function colorBanner(value?: string) {
  if (!value || /^(https?:|data:|blob:)/.test(value)) return PRESET_BANNERS[0].value;
  return value;
}

const withTimeout = <T,>(promise: Promise<T>, milliseconds: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Firebase no respondió a tiempo.')), milliseconds);
    }),
  ]);
};

export const UserProfileView: React.FC = () => {
  const { 
    user, 
    updateUserProfile, 
    setCurrentView, 
    universities,
    careers,
    subjects,
    submitPendingRequest,
    showToast,
    cards,
  } = useApp();

  const publicCatalog = useMemo(() => {
    const handle = normalizeUsername(user.username);
    return sortByMostLiked(cards.filter(card =>
      card.authorId === user.id
      || card.authorId === auth.currentUser?.uid
      || normalizeUsername(card.authorUsername) === handle
    ));
  }, [cards, user.id, user.username]);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [bannerValue, setBannerValue] = useState(colorBanner(user?.bannerValue));
  
  // Academic state
  const isPresetUniversity = universities.some(u => u.name === user?.university);
  const [selectedUnivId, setSelectedUnivId] = useState<string>(
    isPresetUniversity ? (universities.find(u => u.name === user?.university)?.id || 'other') : 'other'
  );
  const [customUniv, setCustomUniv] = useState(isPresetUniversity ? '' : (user?.university || ''));

  const isPresetCareer = careers.some(c => c.name === user?.career);
  const [selectedCareerId, setSelectedCareerId] = useState<string>(
    isPresetCareer ? (careers.find(c => c.name === user?.career)?.id || 'other') : 'other'
  );
  const [customCareer, setCustomCareer] = useState(isPresetCareer ? '' : (user?.career || ''));

  const [currentSemester, setCurrentSemester] = useState<number>(user?.currentSemester || 1);
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>(user?.enrolledSubjects ? [...user.enrolledSubjects] : []);

  // New subject inputs
  const [newSubjectText, setNewSubjectText] = useState('');
  const [suggestedSubjectId, setSuggestedSubjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Estado de carga y archivo para Firebase
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.username || user.isGuest) return;
    const path = `/u/${encodeURIComponent(user.username)}`;
    rememberPath(path);
    return () => {
      if (window.location.pathname === path) rememberPath('/');
    };
  }, [user?.username, user?.isGuest]);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setUsername(user.username);
    setBio(user.bio || '');
    setBannerValue(colorBanner(user.bannerValue));
    
    const matchedUniv = universities.find(u => u.name === user.university);
    if (matchedUniv) {
      setSelectedUnivId(matchedUniv.id);
      setCustomUniv('');
    } else {
      setSelectedUnivId('other');
      setCustomUniv(user.university);
    }

    const matchedCareer = careers.find(c => c.name === user.career);
    if (matchedCareer) {
      setSelectedCareerId(matchedCareer.id);
      setCustomCareer('');
    } else {
      setSelectedCareerId('other');
      setCustomCareer(user.career);
    }

    setCurrentSemester(user.currentSemester || 1);
    setEnrolledSubjects([...user.enrolledSubjects]);
  }, [user, universities, careers]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-400 text-xs">
        Cargando perfil...
      </div>
    );
  }

  const handleAddCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSubjectText.trim();
    if (!trimmed) return;
    if (enrolledSubjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Esta materia ya está en tu lista.');
      return;
    }
    setEnrolledSubjects(prev => [...prev, trimmed]);
    setNewSubjectText('');
  };

  const handleAddSuggestedSubject = () => {
    if (!suggestedSubjectId) return;
    const subj = subjects.find(s => s.id === suggestedSubjectId);
    if (!subj) return;
    if (enrolledSubjects.some(s => s.toLowerCase() === subj.name.toLowerCase())) {
      showToast('Esta materia ya está en tu lista.');
      return;
    }
    setEnrolledSubjects(prev => [...prev, subj.name]);
    setSuggestedSubjectId('');
  };

  const handleRemoveSubject = (subjName: string) => {
    if (enrolledSubjects.length <= 1) {
      showToast('Debes conservar al menos una materia cursada.');
      return;
    }
    setEnrolledSubjects(prev => prev.filter(s => s !== subjName));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    let pendingProfile: Partial<User> | null = null;

    console.log("--- INICIANDO GUARDADO ---");
    console.log("Usuario actual:", user);
    console.log("ID del usuario:", user?.id);

    try {
      if (!fullName.trim()) {
        setFormError('El nombre completo es obligatorio.');
        setLoading(false);
        return;
      }
      if (!username.trim()) {
        setFormError('El apodo/username es obligatorio.');
        setLoading(false);
        return;
      }

      const uniqueUsername = normalizeUsername(username);
      if (uniqueUsername.length < 3) {
        setFormError('El username debe tener al menos 3 caracteres.');
        setLoading(false);
        return;
      }
      try {
        if (await isUsernameTaken(uniqueUsername, user.id)) {
          setFormError('Ese @ ya está en uso por otra cuenta.');
          setLoading(false);
          return;
        }
      } catch (usernameError) {
        console.warn('No se pudo verificar el @:', usernameError);
      }

      const finalUniversity = selectedUnivId === 'other'
        ? (customUniv.trim() || 'Universidad Personalizada')
        : (universities.find(u => u.id === selectedUnivId)?.name || user.university);

      const finalCareer = selectedCareerId === 'other'
        ? (customCareer.trim() || 'Carrera Personalizada')
        : (careers.find(c => c.id === selectedCareerId)?.name || user.career);

      if (enrolledSubjects.length === 0) {
        setFormError('Debes registrar al menos una materia cursada activa.');
        setLoading(false);
        return;
      }

      const authenticatedUser = auth.currentUser;
      if (!authenticatedUser) {
        setFormError('Tu sesión expiró. Inicia sesión nuevamente antes de guardar.');
        setLoading(false);
        return;
      }
      const userId = authenticatedUser.uid;

      const finalBannerValue = colorBanner(bannerValue);

      const updatedData: Partial<User> = {
        fullName: fullName.trim(),
        username: uniqueUsername,
        email: authenticatedUser.email || user.email,
        bio: bio.trim(),
        avatarUrl: '',
        bannerType: 'gradient',
        bannerValue: finalBannerValue,
        university: finalUniversity,
        career: finalCareer,
        currentSemester,
        enrolledSubjects,
        isIncognito: false,
        updatedAt: new Date().toISOString()
      };

      const savedProfile: User = {
        ...user,
        ...updatedData,
        id: userId,
        email: authenticatedUser.email || user.email,
        isGuest: false,
      } as User;
      pendingProfile = savedProfile;

      console.log("Guardando datos en Firestore para el ID:", userId);
      const userRef = doc(db, 'users', userId);
      const payload = toFirestoreUser(savedProfile);
      delete payload.role;
      await withTimeout(setDoc(userRef, payload, { merge: true }), 12000);
      console.log("¡Datos guardados en Firestore correctamente!");

      updateUserProfile(savedProfile);

      if (selectedUnivId === 'other' && customUniv.trim() && customUniv.trim() !== user.university) {
        submitPendingRequest('university', customUniv.trim());
      }
      if (selectedCareerId === 'other' && customCareer.trim() && customCareer.trim() !== user.career) {
        submitPendingRequest('career', customCareer.trim(), finalUniversity);
      }

      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3500);
      showToast('¡Perfil guardado con éxito!');
    } catch (error: any) {
      console.error("Error capturado en el catch:", error);
      if (pendingProfile && error?.message === 'Firebase no respondió a tiempo.') {
        updateUserProfile(pendingProfile);
        setIsSavedRecently(true);
        setTimeout(() => setIsSavedRecently(false), 3500);
        showToast('Cambios guardados en este dispositivo. Firebase no está respondiendo.');
        return;
      }
      const message = error?.code === 'permission-denied'
        ? 'Firestore rechazó el guardado. Revisa las reglas de acceso.'
        : `Error al guardar: ${error?.message || 'Revisa tu conexión.'}`;
      setFormError(message);
      showToast(message);
    } finally {
      setLoading(false);
      console.log("--- FIN DEL PROCESO DE GUARDADO ---");
    }
  };

  const availableCareerSubjects = sortedUniqueSubjects(subjects).filter(s => !enrolledSubjects.includes(s.name));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCurrentView('library')}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Biblioteca
        </button>

        <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar / Editar Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'preview'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Ver Perfil Público
          </button>
        </div>
      </div>

      {isSavedRecently && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>¡Todos los cambios de tu perfil e información académica han sido guardados con éxito!</span>
          </div>
          <button 
            type="button"
            onClick={() => setActiveTab('preview')}
            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
          >
            Ver cómo quedó
          </button>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-2.5 text-rose-300 text-xs font-semibold shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {activeTab === 'edit' ? (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div 
              className="h-32 sm:h-44 w-full relative p-4 flex flex-col justify-between"
              style={bannerStyle(bannerValue)}
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  Banner de Portada
                </span>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {PRESET_BANNERS.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBannerValue(b.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold text-white border transition-all whitespace-nowrap ${
                      bannerValue === b.value 
                        ? 'border-white ring-2 ring-white/30 bg-black/60' 
                        : 'border-white/20 hover:border-white/40 bg-black/40'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Datos personales
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Ej. Sofía Valenzuela"
                      required
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Apodo / Nombre de Usuario (@) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono font-bold">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="sofia_val"
                        required
                        className="w-full pl-8 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    disabled
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 cursor-not-allowed select-none font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-300">
                      Descripción Personal / Frase de Estudio
                    </label>
                    <span className="text-[10px] text-zinc-500">{bio.length}/180</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={180}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Cuéntale a tu facultad sobre ti..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Información académica
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300">Universidad Actual *</label>
                    <select
                      value={selectedUnivId}
                      onChange={e => setSelectedUnivId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    >
                      {universities.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                      <option value="other">✍️ Otra Universidad</option>
                    </select>

                    {selectedUnivId === 'other' && (
                      <input
                        type="text"
                        value={customUniv}
                        onChange={e => setCustomUniv(e.target.value)}
                        placeholder="Nombre de tu universidad..."
                        className="w-full px-3 py-2 bg-zinc-900 border border-indigo-500/50 rounded-xl text-xs text-zinc-100 mt-2"
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300">Carrera / Licenciatura *</label>
                    <select
                      value={selectedCareerId}
                      onChange={e => setSelectedCareerId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    >
                      {careersForUniversity(careers, selectedUnivId === 'other' ? undefined : selectedUnivId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                      <option value="other">✍️ Otra Carrera</option>
                    </select>

                    {selectedCareerId === 'other' && (
                      <input
                        type="text"
                        value={customCareer}
                        onChange={e => setCustomCareer(e.target.value)}
                        placeholder="Nombre de tu carrera..."
                        className="w-full px-3 py-2 bg-zinc-900 border border-indigo-500/50 rounded-xl text-xs text-zinc-100 mt-2"
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300">Semestre en Curso *</label>
                    <select
                      value={currentSemester}
                      onChange={e => setCurrentSemester(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                        <option key={s} value={s}>{s}.° Semestre</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800/80 space-y-3">
                  <span className="text-xs font-bold text-zinc-200 block">
                    Materias Cursadas Activas ({enrolledSubjects.length})
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {enrolledSubjects.map(subj => (
                      <span
                        key={subj}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs font-bold text-indigo-200"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        {subj}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(subj)}
                          className="p-1 hover:bg-rose-900/60 hover:text-rose-300 rounded-full text-zinc-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-zinc-800">
                    <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                      <label className="text-[11px] font-bold text-zinc-300">Opción 1: Seleccionar del catálogo oficial</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={suggestedSubjectId}
                          onChange={e => setSuggestedSubjectId(e.target.value)}
                          className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                        >
                          <option value="">-- Elegir materia --</option>
                          {availableCareerSubjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddSuggestedSubject}
                          disabled={!suggestedSubjectId}
                          className="px-4 py-2 bg-indigo-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                      <label className="text-[11px] font-bold text-zinc-300">Opción 2: Escribir materia personalizada</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newSubjectText}
                          onChange={e => setNewSubjectText(e.target.value)}
                          placeholder="Nombre de la materia..."
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomSubject();
                            }
                          }}
                          className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSubject()}
                          disabled={!newSubjectText.trim()}
                          className="px-4 py-2 bg-zinc-800 disabled:opacity-40 text-zinc-200 rounded-xl text-xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <EducatorRequestSection />

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2.5 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
          <div 
            className="h-36 sm:h-48 w-full relative"
            style={bannerStyle(user.bannerValue)}
          >
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="px-3.5 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                Editar Perfil
              </button>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-8 pt-0 relative space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="relative group inline-block">
                <div className="ring-4 ring-zinc-900 rounded-full bg-zinc-900 overflow-hidden shadow-2xl">
                  <WhatsAppAvatar url={user.avatarUrl} size="2xl" />
                </div>
              </div>

            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">{user.fullName}</h1>
              <p className="text-sm font-mono text-indigo-400 mt-0.5">@{user.username}</p>
              <button type="button" onClick={() => void copyAppLink(accountUrl(user.username), showToast)} className="mt-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100">
                Copiar enlace
              </button>
              <div className="mt-2">
                <EducatorBadge kind={user.educatorKind} university={user.educatorUniversity} status={user.educatorStatus} />
              </div>
              {user.bio && (
                <p className="text-xs sm:text-sm text-zinc-300 mt-3 max-w-2xl bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
                  "{user.bio}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Universidad</span>
                <p className="text-xs font-bold text-zinc-100 mt-1">{user.university}</p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Carrera</span>
                <p className="text-xs font-bold text-zinc-100 mt-1">{user.career}</p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Semestre</span>
                <p className="text-xs font-bold text-zinc-100 mt-1">{user.currentSemester}.° Semestre</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Materias Activas</h3>
              <div className="flex flex-wrap gap-2">
                {user.enrolledSubjects?.map((sub, i) => (
                  <span key={i} className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cursos</h3>
              <AccountCourses personId={user.id} mine />
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Materiales y juegos</h3>
              <CreatorCatalog cards={publicCatalog} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};