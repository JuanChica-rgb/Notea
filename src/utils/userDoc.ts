import type { User } from '../types';

export function toFirestoreUser(user: User): Record<string, unknown> {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    bannerType: user.bannerType,
    bannerValue: user.bannerValue,
    university: user.university,
    career: user.career,
    currentSemester: user.currentSemester,
    enrolledSubjects: user.enrolledSubjects || [],
    isIncognito: Boolean(user.isIncognito),
    bio: user.bio || '',
    streakDays: user.streakDays || 0,
    lastAccessDate: user.lastAccessDate || '',
    role: user.role === 'admin' ? 'admin' : 'user',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || '',
    isGuest: false,
    mustVerifyEmail: Boolean(user.mustVerifyEmail),
    emailVerified: Boolean(user.emailVerified),
  };
}
