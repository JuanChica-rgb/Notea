import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PublicUser } from '../types';

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._]/g, '');
}

export function toPublicUser(id: string, data: Partial<PublicUser> & Record<string, unknown>): PublicUser {
  return {
    id,
    username: normalizeUsername(String(data.username || '')),
    fullName: String(data.fullName || ''),
    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : undefined,
    bio: typeof data.bio === 'string' ? data.bio : undefined,
    university: typeof data.university === 'string' ? data.university : undefined,
    career: typeof data.career === 'string' ? data.career : undefined,
    currentSemester: typeof data.currentSemester === 'number' ? data.currentSemester : undefined,
    streakDays: typeof data.streakDays === 'number' ? data.streakDays : undefined,
    bannerValue: typeof data.bannerValue === 'string' ? data.bannerValue : undefined,
    isIncognito: Boolean(data.isIncognito),
    role: data.role === 'admin' ? 'admin' : 'user',
    educatorKind: data.educatorKind === 'tutor' || data.educatorKind === 'professor' ? data.educatorKind : undefined,
    educatorUniversity: typeof data.educatorUniversity === 'string' ? data.educatorUniversity : undefined,
    educatorStatus: data.educatorStatus === 'pending' || data.educatorStatus === 'verified' ? data.educatorStatus : undefined,
  };
}

export async function isUsernameTaken(raw: string, excludeUserId?: string): Promise<boolean> {
  const username = normalizeUsername(raw);
  if (!username) return false;
  const snapshot = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
  return snapshot.docs.some(item => item.id !== excludeUserId);
}

export async function findPublicUsersByHandle(raw: string): Promise<PublicUser[]> {
  const username = normalizeUsername(raw);
  if (username.length < 2) return [];
  try {
    const exact = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
    if (!exact.empty) {
      return exact.docs.map(item => toPublicUser(item.id, item.data() as Partial<PublicUser> & Record<string, unknown>));
    }
  } catch (error) {
    console.warn('No se pudo buscar el @ en Firestore:', error);
  }
  return [];
}
