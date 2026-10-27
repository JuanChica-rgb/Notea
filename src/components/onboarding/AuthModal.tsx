import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { User } from '../../types';
import { 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  School, 
  GraduationCap, 
  BookOpen, 
  Lock, 
  User as UserIcon, 
  Mail, 
  PlusCircle,
  X
} from 'lucide-react';

import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { collection, doc, getDocs, getDoc, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { INITIAL_USER } from '../../data/mockData';
import { careersForUniversity, sortedUniqueSubjects } from '../../utils/catalog';
import { isUsernameTaken, normalizeUsername } from '../../utils/username';
import { toFirestoreUser } from '../../utils/userDoc';

const withTimeout = <T,>(promise: Promise<T>, milliseconds: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject({ code: 'auth/timeout' }), milliseconds);
    }),
  ]);
};

const describeAuthError = (error: unknown, fallback: string) => {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  if (code === 'auth/email-already-in-use') return 'Este correo ya está registrado. Inicia sesión o confirma el correo si aún no lo has hecho.';
  if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
    return 'Correo o contraseña incorrectos.';
  }
  if (code === 'auth/timeout') return 'Firebase no respondió a tiempo. Revisa tu conexión y vuelve a intentarlo.';
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
  if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
    return 'No se pudo enviar el correo de confirmación por la URL de retorno. Tu cuenta sí se creó.';
  }
  if (code === 'permission-denied' || code === 'auth/insufficient-permission') {
    return 'No hay permiso para completar el registro. Si el correo ya quedó creado, inicia sesión.';
  }
  if (code === 'auth/network-request-failed') return 'Sin conexión con Firebase. Revisa internet o el bloqueo de red.';
  if (code) return `${fallback} (${code})`;
  if (err?.message) return `${fallback} (${err.message})`;
  return fallback;
};

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode,
    setUser, 
    universities, 
    careers, 
    subjects, 
    submitPendingRequest, 
    showToast 
  } = useApp();

  // Step or mode
  const [mode, setMode] = useState<'register' | 'login' | 'verify'>('login');
  const [sessionOpen, setSessionOpen] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Academic location
  const [selectedUnivId, setSelectedUnivId] = useState<string>('');
  const [isOtherUniv, setIsOtherUniv] = useState(false);
  const [customUniv, setCustomUniv] = useState('');

  const [selectedCareerId, setSelectedCareerId] = useState<string>('');
  const [isOtherCareer, setIsOtherCareer] = useState(false);
  const [customCareer, setCustomCareer] = useState('');

  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isOtherSubject, setIsOtherSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);

  if (isAuthModalOpen && !sessionOpen) {
    setSessionOpen(true);
    setMode(authModalMode);
    setAuthError(null);
  } else if (!isAuthModalOpen && sessionOpen) {
    setSessionOpen(false);
  }

  useEffect(() => {
    if (!isAuthModalOpen || mode !== 'register') {
      setUsernameTaken(false);
      return;
    }
    const handle = normalizeUsername(username);
    if (handle.length < 3) {
      setUsernameTaken(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const taken = await isUsernameTaken(handle);
        if (!cancelled) setUsernameTaken(taken);
      } catch {
        if (!cancelled) setUsernameTaken(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, isAuthModalOpen, mode]);

  if (!isAuthModalOpen) return null;

  const availableCareers = careersForUniversity(careers, selectedUnivId);
  const availableSubjects = sortedUniqueSubjects(subjects);

  // Validations
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'verify') {
      return true;
    }

    if (mode === 'register') {
      if (!fullName.trim()) newErrors.fullName = 'El nombre completo es obligatorio.';
      if (!username.trim()) {
        newErrors.username = 'El apodo/username es obligatorio.';
      } else if (username.length < 3) {
        newErrors.username = 'El username debe tener al menos 3 caracteres.';
      } else if (usernameTaken) {
        newErrors.username = 'Ese @ ya está en uso. Elige otro.';
      }

      // Strict email format validation (standard with @ and valid domain with dot)
      const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email.trim()) {
        newErrors.email = 'El correo electrónico es obligatorio.';
      } else if (!strictEmailRegex.test(email)) {
        newErrors.email = 'Formato de correo no válido (ejemplo: usuario@universidad.edu.pe o correo@dominio.com).';
      }

      // Password: minimum 6 characters combining letters AND numbers
      const hasLetters = /[a-zA-Z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      if (!password) {
        newErrors.password = 'La contraseña es obligatoria.';
      } else if (password.length < 6) {
        newErrors.password = 'Mínimo 6 caracteres.';
      } else if (!hasLetters || !hasNumbers) {
        newErrors.password = 'La contraseña debe combinar obligatoriamente letras y números.';
      }

      // University check
      if (!isOtherUniv && !selectedUnivId) {
        newErrors.university = 'Selecciona una universidad o activa "Opción Otra".';
      }
      if (isOtherUniv && !customUniv.trim()) {
        newErrors.customUniv = 'Escribe el nombre de tu universidad.';
      }

      // Career check
      if (!isOtherCareer && !selectedCareerId) {
        newErrors.career = 'Selecciona tu carrera o activa "Opción Otra".';
      }
      if (isOtherCareer && !customCareer.trim()) {
        newErrors.customCareer = 'Escribe el nombre de tu carrera.';
      }

      // Subjects check
      if (!isOtherSubject && selectedSubjects.length === 0) {
        newErrors.subjects = 'Selecciona al menos una materia de tu semestre o agrega una nueva.';
      }
      if (isOtherSubject && !customSubject.trim() && selectedSubjects.length === 0) {
        newErrors.customSubject = 'Escribe el nombre de tu materia.';
      }
    } else {
      // Login validation
      if (!email.trim()) newErrors.email = 'Ingresa tu correo.';
      if (!password) newErrors.password = 'Ingresa tu contraseña.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResendVerification = async () => {
    setAuthError(null);
    if (!email.trim() || !password) {
      setAuthError('Vuelve a iniciar sesión para reenviar el correo.');
      setMode('login');
      return;
    }
    setIsSubmitting(true);
    try {
      const loginValue = email.trim().toLowerCase();
      const userCredential = await withTimeout(
        signInWithEmailAndPassword(auth, loginValue, password),
        12000
      );
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      showToast('Te enviamos un nuevo correo de verificación. Revisa tu bandeja de entrada y el correo no deseado.');
    } catch (error: any) {
      const mensaje = describeAuthError(error, 'No se pudo reenviar el correo.');
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setMode('login');
      }
      setAuthError(mensaje);
      showToast(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectToggle = (subjName: string) => {
    if (selectedSubjects.includes(subjName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subjName));
    } else {
      setSelectedSubjects([...selectedSubjects, subjName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!validateForm()) {
      setAuthError('Completa los campos obligatorios para continuar.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (mode === 'verify') {
        return;
      }
      if (mode === 'register') {
        const uniqueUsername = normalizeUsername(username);
        try {
          if (await isUsernameTaken(uniqueUsername)) {
            setErrors(prev => ({ ...prev, username: 'Ese @ ya está en uso. Elige otro.' }));
            setAuthError('Ese apodo ya pertenece a otra cuenta.');
            setIsSubmitting(false);
            return;
          }
        } catch (usernameError) {
          console.warn('No se pudo validar el @ en Firestore:', usernameError);
        }

        if (auth.currentUser) {
          await signOut(auth);
          setUser(INITIAL_USER);
        }

        // 1. Crear el usuario real en Firebase Authentication
        const userCredential = await withTimeout(
          createUserWithEmailAndPassword(auth, email.trim(), password),
          12000
        );
        const firebaseUser = userCredential.user;

        const finalUniversity = isOtherUniv
          ? customUniv.trim()
          : (universities.find(u => u.id === selectedUnivId)?.name || 'Universidad');

        const finalCareer = isOtherCareer
          ? customCareer.trim()
          : (careers.find(c => c.id === selectedCareerId)?.name || 'Carrera');

        const enrolled = [...selectedSubjects];
        if (isOtherSubject && customSubject.trim()) {
          enrolled.push(customSubject.trim());
        }

        // Enviar solicitudes pendientes si aplica
        if (isOtherUniv && customUniv.trim()) {
          submitPendingRequest('university', customUniv.trim());
        }
        if (isOtherCareer && customCareer.trim()) {
          submitPendingRequest('career', customCareer.trim(), finalUniversity);
        }
        if (isOtherSubject && customSubject.trim()) {
          submitPendingRequest('subject', customSubject.trim());
        }

        const newUserProfile: User = {
          id: firebaseUser.uid,
          fullName: fullName.trim(),
          username: uniqueUsername,
          email: email.trim().toLowerCase(),
          avatarUrl: '',
          bannerType: 'gradient',
          bannerValue: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          university: finalUniversity,
          career: finalCareer,
          currentSemester,
          enrolledSubjects: enrolled.length > 0 ? enrolled : ['Materia General'],
          isIncognito: false,
          bio: '¡Hola! Soy estudiante en Notea aprendiendo con microaprendizaje gamificado.',
          streakDays: 1,
          role: 'user',
          createdAt: new Date().toISOString().split('T')[0],
          mustVerifyEmail: true,
          emailVerified: false,
        };

        // 2. Guardar el perfil detallado del usuario en Firestore (en la colección 'users')
        await withTimeout(setDoc(doc(db, 'users', firebaseUser.uid), toFirestoreUser(newUserProfile)), 12000);

        try {
          await updateProfile(firebaseUser, { displayName: fullName.trim() });
          await sendEmailVerification(firebaseUser);
        } catch (verifyError) {
          console.error('Error al enviar correo de confirmación:', verifyError);
          setAuthError(describeAuthError(verifyError, 'La cuenta se creó, pero no se pudo enviar el correo. Usa Reenviar.'));
        }

        await signOut(auth);
        setUser(INITIAL_USER);
        setMode('verify');
        showToast('Te enviamos un correo de verificación. Confirma tu dirección para activar la cuenta.');

      } else {
        // 1. Iniciar sesión real con Firebase Auth
        const loginValue = email.trim().toLowerCase();
        let loginEmail = loginValue;

        if (!loginValue.includes('@')) {
          const usernameSnapshot = await withTimeout(
            getDocs(query(collection(db, 'users'), where('username', '==', loginValue.replace(/^@+/, '')))),
            12000
          );

          if (usernameSnapshot.empty) {
            throw { code: 'auth/user-not-found' };
          }

          loginEmail = usernameSnapshot.docs[0].data().email;
        }

        const userCredential = await withTimeout(
          signInWithEmailAndPassword(auth, loginEmail, password),
          12000
        );
        await userCredential.user.reload();
        let storedProfile: Partial<User> = {};

        try {
          const profileSnapshot = await withTimeout(
            getDoc(doc(db, 'users', userCredential.user.uid)),
            12000
          );
          if (profileSnapshot.exists()) {
            storedProfile = profileSnapshot.data() as User;
          }
        } catch (profileError) {
          console.warn('No se pudo cargar el perfil; se usará un perfil base:', profileError);
        }

        if (storedProfile.mustVerifyEmail && !userCredential.user.emailVerified) {
          await signOut(auth);
          setUser(INITIAL_USER);
          setEmail(loginEmail);
          setMode('verify');
          setAuthError('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y el correo no deseado.');
          showToast('Tu cuenta todavía no está verificada.');
          return;
        }

        if (userCredential.user.emailVerified && storedProfile.mustVerifyEmail) {
          await updateDoc(doc(db, 'users', userCredential.user.uid), {
            mustVerifyEmail: false,
            emailVerified: true,
          });
          storedProfile = { ...storedProfile, mustVerifyEmail: false, emailVerified: true };
        }

        setUser({
          ...INITIAL_USER,
          ...storedProfile,
          id: userCredential.user.uid,
          email: userCredential.user.email || storedProfile.email || '',
          fullName: storedProfile.fullName || userCredential.user.displayName || 'Completa tu perfil',
          username: storedProfile.username || userCredential.user.email?.split('@')[0] || 'usuario',
          isGuest: false,
        });
        showToast('Sesión iniciada con éxito en Notea.');
        setIsAuthModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error en autenticación:", error);
      const mensaje = describeAuthError(error, 'Ocurrió un error al autenticar.');
      setAuthError(mensaje);
      showToast(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            Plataforma Notea
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-zinc-100">
            {mode === 'verify'
              ? 'Confirma tu correo electrónico'
              : mode === 'register'
                ? 'Registro y Onboarding Académico'
                : 'Iniciar Sesión en Notea'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {mode === 'verify'
              ? 'Te enviamos un mensaje de verificación. Debes confirmar tu dirección antes de acceder a la plataforma.'
              : mode === 'register'
                ? 'Únete a la comunidad de microaprendizaje, compite en salas y domina tus materias.'
                : 'Accede a tus cuadernos, juegos y progreso académico.'}
          </p>

          {/* Toggle between Register and Login */}
          {mode !== 'verify' && (
          <div className="flex p-1 bg-zinc-800/80 rounded-xl border border-zinc-700/60 max-w-xs mx-auto mt-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Crear cuenta
            </button>
          </div>
          )}
        </div>

        {mode === 'verify' && (
          <div className="space-y-5">
            {authError && (
              <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/50 text-rose-300 text-xs font-semibold">
                {authError}
              </div>
            )}
            <div className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700">
              <div className="w-12 h-12 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                <Mail className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm text-zinc-200">
                Enviamos un enlace de confirmación a <span className="font-semibold text-white">{email || 'tu correo'}</span>.
                Ábrelo, confirma tu dirección y después inicia sesión.
              </p>
              <p className="text-xs text-zinc-400">
                Si no lo encuentras, revisa correo no deseado o promociones. El enlace tiene vigencia limitada; puedes solicitar uno nuevo si expiró.
              </p>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResendVerification}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl"
            >
              {isSubmitting ? 'Reenviando...' : 'Reenviar correo de verificación'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setMode('login');
              }}
              className="w-full py-2.5 text-sm text-zinc-300 hover:text-white"
            >
              Ya confirmé, iniciar sesión
            </button>
          </div>
        )}

        {mode !== 'verify' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {authError && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/50 text-rose-300 text-xs font-semibold">
              {authError}
            </div>
          )}
          {mode === 'register' && (
            <>
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ej. Mateo Valenzuela"
                    className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {errors.fullName && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-mono text-sm">@</span>
                    Apodo / Username único *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Ej. mateo_val"
                    className={`w-full px-3.5 py-2.5 bg-zinc-800 border rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                      usernameTaken
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                  <span className="text-[11px] text-zinc-400">Visible en salas y en el ranking de tus cursos. Debe ser único.</span>
                  {usernameTaken && !errors.username && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Ese @ ya está registrado.</p>
                  )}
                  {errors.username && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.username}</p>}
                </div>
              </div>

              {/* Email and Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    Correo Electrónico (Validación estricta) *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@universidad.edu.pe"
                    className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {errors.email && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    Contraseña (&gt;= 6 caracteres letras+números) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3.5 py-2.5 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.password}</p>}
                </div>
              </div>

              {/* SECTION: Ubicación Académica Obligatoria */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <School className="w-4 h-4 text-indigo-400" />
                    Ubicación Académica Obligatoria
                  </h3>
                  <span className="text-xs text-zinc-400">Menús conectados</span>
                </div>

                {/* Universidad */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">Universidad *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtherUniv(!isOtherUniv);
                        if (!isOtherUniv) setSelectedUnivId('');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      {isOtherUniv ? '← Elegir de la lista oficial' : '¿No está en la lista? (Opción Otra)'}
                    </button>
                  </div>

                  {!isOtherUniv ? (
                    <select
                      value={selectedUnivId}
                      onChange={e => {
                        setSelectedUnivId(e.target.value);
                        setSelectedCareerId('');
                        setSelectedSubjects([]);
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Selecciona tu Universidad --</option>
                      {universities.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.acronym}) - {u.country}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={customUniv}
                        onChange={e => setCustomUniv(e.target.value)}
                        placeholder="Escribe el nombre de tu Universidad..."
                        className="w-full px-3.5 py-2.5 bg-zinc-800 border border-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[11px] text-amber-400/90 flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" />
                        Se enviará automáticamente a la bandeja de solicitudes del administrador sin bloquear tu registro.
                      </p>
                    </div>
                  )}
                  {errors.university && <p className="text-xs text-rose-400">{errors.university}</p>}
                  {errors.customUniv && <p className="text-xs text-rose-400">{errors.customUniv}</p>}
                </div>

                {/* Carrera y Semestre */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {/* Carrera */}
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                        Carrera *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtherCareer(!isOtherCareer);
                          if (!isOtherCareer) setSelectedCareerId('');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                      >
                        {isOtherCareer ? '← Lista oficial' : 'Opción Otra'}
                      </button>
                    </div>

                    {!isOtherCareer ? (
                      <select
                        value={selectedCareerId}
                        onChange={e => setSelectedCareerId(e.target.value)}
                        disabled={!selectedUnivId && !isOtherUniv}
                        className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 disabled:opacity-50 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Selecciona tu Carrera --</option>
                        {availableCareers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={customCareer}
                        onChange={e => setCustomCareer(e.target.value)}
                        placeholder="Escribe el nombre de tu Carrera..."
                        className="w-full px-3.5 py-2.5 bg-zinc-800 border border-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    )}
                    {errors.career && <p className="text-xs text-rose-400">{errors.career}</p>}
                    {errors.customCareer && <p className="text-xs text-rose-400">{errors.customCareer}</p>}
                  </div>

                  {/* Semestre Actual (1.° a 10.°) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Semestre Actual *</label>
                    <select
                      value={currentSemester}
                      onChange={e => setCurrentSemester(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                        <option key={sem} value={sem}>
                          {sem}.° Semestre
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Materias del Semestre (Checklist) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      Materias (elige cualquiera del catálogo) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsOtherSubject(!isOtherSubject)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      {isOtherSubject ? 'Cerrar Otra' : '+ Agregar Materia (Opción Otra)'}
                    </button>
                  </div>

                  <div className="p-3 bg-zinc-800/60 border border-zinc-700/80 rounded-xl max-h-36 overflow-y-auto space-y-2">
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map(sub => {
                        const isChecked = selectedSubjects.includes(sub.name);
                        return (
                          <label
                            key={sub.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200' : 'hover:bg-zinc-700/50 text-zinc-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSubjectToggle(sub.name)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-600 bg-zinc-700"
                            />
                            <span className="text-xs font-medium">{sub.name}</span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-xs text-zinc-400 italic p-1">
                        No hay materias oficiales todavía. Usa "+ Agregar Materia (Opción Otra)".
                      </p>
                    )}

                    {isOtherSubject && (
                      <div className="pt-2 border-t border-zinc-700/60 mt-2">
                        <input
                          type="text"
                          value={customSubject}
                          onChange={e => setCustomSubject(e.target.value)}
                          placeholder="Nombre de la materia no listada..."
                          className="w-full px-3 py-2 bg-zinc-900 border border-amber-500/50 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                        />
                        <p className="text-[10px] text-amber-400/90 mt-1">
                          Se sumará a tus materias y se notificará al administrador.
                        </p>
                      </div>
                    )}
                  </div>
                  {errors.subjects && <p className="text-xs text-rose-400">{errors.subjects}</p>}
                  {errors.customSubject && <p className="text-xs text-rose-400">{errors.customSubject}</p>}
                </div>
              </div>

            </>
          )}

          {mode === 'login' && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@universidad.edu.pe"
                  className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
              </div>
              <p className="text-xs text-zinc-400 text-center">
                ¿Olvidaste tu contraseña? Modo de demostración activo, puedes ingresar con tus credenciales habituales.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Verificando...' : mode === 'register' ? 'Completar Registro en Notea' : 'Iniciar Sesión'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};
