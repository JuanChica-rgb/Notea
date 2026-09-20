import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WhatsAppAvatar } from '../common/WhatsAppAvatar';
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

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    setUser, 
    universities, 
    careers, 
    subjects, 
    submitPendingRequest, 
    showToast 
  } = useApp();

  // Step or mode
  const [mode, setMode] = useState<'register' | 'login'>('register');

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

  // Privacy setting
  const [isIncognito, setIsIncognito] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isAuthModalOpen) return null;

  // Filter careers based on chosen university
  const availableCareers = careers.filter(c => c.universityId === selectedUnivId);

  // Filter subjects based on chosen career & semester
  const availableSubjects = subjects.filter(
    s => s.careerId === selectedCareerId && s.semester === currentSemester
  );

  // Validations
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'register') {
      if (!fullName.trim()) newErrors.fullName = 'El nombre completo es obligatorio.';
      if (!username.trim()) {
        newErrors.username = 'El apodo/username es obligatorio.';
      } else if (username.length < 3) {
        newErrors.username = 'El username debe tener al menos 3 caracteres.';
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

  const handleSubjectToggle = (subjName: string) => {
    if (selectedSubjects.includes(subjName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subjName));
    } else {
      setSelectedSubjects([...selectedSubjects, subjName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (mode === 'register') {
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

      // Critical Rule: Dispatches to Admin Pending Requests Queue WITHOUT blocking user registration
      if (isOtherUniv && customUniv.trim()) {
        submitPendingRequest('university', customUniv.trim());
      }
      if (isOtherCareer && customCareer.trim()) {
        submitPendingRequest('career', customCareer.trim(), finalUniversity);
      }
      if (isOtherSubject && customSubject.trim()) {
        submitPendingRequest('subject', customSubject.trim(), `${finalCareer} (Semestre ${currentSemester})`);
      }

      // Automatic WhatsApp-style generic silhouette avatar (silueta de perfil gris)
      setUser({
        id: `usr_${Date.now()}`,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        email: email.trim().toLowerCase(),
        avatarUrl: '', // Default WhatsApp silhouette assigned automatically
        bannerType: 'gradient',
        bannerValue: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        university: finalUniversity,
        career: finalCareer,
        currentSemester,
        enrolledSubjects: enrolled.length > 0 ? enrolled : ['Materia General'],
        isIncognito,
        bio: '¡Hola! Soy estudiante en Notea aprendiendo con microaprendizaje gamificado.',
        rpPoints: 100, // Initial welcome bonus
        streakDays: 1,
        role: 'user',
        createdAt: new Date().toISOString().split('T')[0]
      });

      showToast(`¡Bienvenido a Notea, @${username}! Registro completado exitosamente.`);
      setIsAuthModalOpen(false);
    } else {
      // Login simulation
      showToast('Sesión iniciada con éxito en Notea.');
      setIsAuthModalOpen(false);
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
            {mode === 'register' ? 'Registro y Onboarding Académico' : 'Iniciar Sesión en Notea'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {mode === 'register' 
              ? 'Únete a la comunidad de microaprendizaje, compite en salas y domina tus materias.' 
              : 'Accede a tus cuadernos, juegos y progreso académico.'}
          </p>

          {/* Toggle between Register and Login */}
          <div className="flex p-1 bg-zinc-800/80 rounded-xl border border-zinc-700/60 max-w-xs mx-auto mt-4">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Crear Cuenta
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <>
              {/* WhatsApp Avatar notice */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/40 border border-zinc-800">
                <WhatsAppAvatar size="lg" />
                <div className="text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Avatar Genérico Automático</span>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Se asigna por defecto una silueta gris estilo WhatsApp. Podrás personalizarla o subir tu propia foto más adelante desde la vista de Perfil.
                  </p>
                </div>
              </div>

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
                    className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-zinc-400">Visible en salas multijugador y rankings públicos</span>
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
                        onChange={e => {
                          setSelectedCareerId(e.target.value);
                          setSelectedSubjects([]);
                        }}
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
                      onChange={e => {
                        setCurrentSemester(Number(e.target.value));
                        setSelectedSubjects([]);
                      }}
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
                      Materias del Semestre (Selecciona las que cursas) *
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
                        No hay materias pre-registradas para este semestre. Usa el botón "+ Agregar Materia (Opción Otra)" abajo.
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

              {/* Ajustes de Cuenta: Modo Privado / Incógnito Toggle */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between p-3.5 bg-zinc-800/50 border border-zinc-700/60 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Modo Privado / Incógnito
                    </span>
                    <p className="text-[11px] text-zinc-400 max-w-sm">
                      Oculta tu apodo y tus puntuaciones de todos los rankings públicos de la plataforma.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isIncognito}
                    onClick={() => setIsIncognito(!isIncognito)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      isIncognito ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isIncognito ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
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
              </div>
              <p className="text-xs text-zinc-400 text-center">
                ¿Olvidaste tu contraseña? Modo de demostración activo, puedes ingresar con tus credenciales habituales.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {mode === 'register' ? 'Completar Registro en Notea' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
