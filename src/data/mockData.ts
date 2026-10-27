import { User, VisualTemplate } from '../types';

export const GUEST_USER: User = {
  id: 'usr_desconocido',
  fullName: 'Estudiante Desconocido',
  username: 'desconocido',
  email: '',
  avatarUrl: '',
  bannerType: 'gradient',
  bannerValue: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
  university: '',
  career: '',
  currentSemester: 1,
  enrolledSubjects: [],
  isIncognito: false,
  bio: '',
  streakDays: 0,
  role: 'user',
  createdAt: '2026-03-01',
  isGuest: true,
};

export const INITIAL_USER: User = GUEST_USER;

export const VISUAL_TEMPLATES: VisualTemplate[] = [
  { id: 'vt1', name: 'Deep Indigo Nebula', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' },
  { id: 'vt2', name: 'Cyber Emerald', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #059669 100%)' },
  { id: 'vt3', name: 'Solar Amber Flare', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #d97706 100%)' },
  { id: 'vt4', name: 'Crimson Velocity', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #dc2626 100%)' },
  { id: 'vt5', name: 'Violet Quantum', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #9333ea 100%)' },
  { id: 'vt6', name: 'Midnight Slate', category: 'minimal', type: 'gradient', value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)' },
];
