import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  accuracyPercent,
  memoryKey,
  nextDueAt,
  type BlockMemory,
} from '../utils/review';

export interface CourseStanding {
  userId: string;
  username: string;
  fullName: string;
  isIncognito: boolean;
  attempts: number;
  correct: number;
  accuracyPercent: number;
  updatedAt: string;
}

const cardCourseCache = new Map<string, Promise<string[]>>();

function requireAccountId() {
  const current = auth.currentUser;
  if (!current || current.isAnonymous) return null;
  return current.uid;
}

export function listenToReviewBlocks(uid: string, onChange: (items: BlockMemory[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users', uid, 'reviewBlocks'), snapshot => {
    onChange(snapshot.docs.map(item => {
      const data = item.data();
      return {
        cardId: String(data.cardId || ''),
        blockId: String(data.blockId || ''),
        wrongCount: Number(data.wrongCount || 0),
        correctCount: Number(data.correctCount || 0),
        lastCorrect: Boolean(data.lastCorrect),
        dueAt: String(data.dueAt || ''),
      };
    }));
  }, () => onChange([]));
}

export function listenToCourseStandings(code: string, onChange: (rows: CourseStanding[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'courses', code, 'standings'), snapshot => {
    const rows = snapshot.docs.map(item => {
      const data = item.data();
      return {
        userId: String(data.userId || item.id),
        username: String(data.username || ''),
        fullName: String(data.fullName || ''),
        isIncognito: Boolean(data.isIncognito),
        attempts: Number(data.attempts || 0),
        correct: Number(data.correct || 0),
        accuracyPercent: Number(data.accuracyPercent || 0),
        updatedAt: String(data.updatedAt || ''),
      };
    });
    rows.sort((a, b) => b.accuracyPercent - a.accuracyPercent || b.attempts - a.attempts);
    onChange(rows);
  }, () => onChange([]));
}

async function loadCoursesContainingCard(uid: string, cardId: string) {
  const memberships = await getDocs(collection(db, 'userCourses', uid, 'items'));
  const codes = await Promise.all(memberships.docs.map(async membership => {
    if (membership.data().role === 'pending') return '';
    const posts = await getDocs(query(
      collection(db, 'courses', membership.id, 'posts'),
      where('cardId', '==', cardId),
      limit(1),
    ));
    return posts.empty ? '' : membership.id;
  }));
  return codes.filter(Boolean);
}

function coursesContainingCard(uid: string, cardId: string) {
  const key = `${uid}:${cardId}`;
  let pending = cardCourseCache.get(key);
  if (!pending) {
    pending = loadCoursesContainingCard(uid, cardId).catch(error => {
      cardCourseCache.delete(key);
      throw error;
    });
    cardCourseCache.set(key, pending);
  }
  return pending;
}

export async function rememberPractice(params: {
  cardId: string;
  blockId: string;
  subjectName: string;
  correct: boolean;
  username: string;
  fullName: string;
  isIncognito: boolean;
}) {
  const uid = requireAccountId();
  if (!uid || !params.cardId || !params.blockId) return;

  const now = new Date();
  const memoryRef = doc(db, 'users', uid, 'reviewBlocks', memoryKey(params.cardId, params.blockId));
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(memoryRef);
    const previous = snapshot.exists() ? snapshot.data() : {};
    const wrongCount = Number(previous.wrongCount || 0) + (params.correct ? 0 : 1);
    const correctCount = Number(previous.correctCount || 0) + (params.correct ? 1 : 0);
    const next: Record<string, string | number | boolean> = {
      cardId: params.cardId,
      blockId: params.blockId,
      subjectName: params.subjectName.slice(0, 120),
      wrongCount,
      correctCount,
      lastCorrect: params.correct,
      dueAt: nextDueAt(params.correct, now),
      updatedAt: now.toISOString(),
    };
    transaction.set(memoryRef, next);
  });

  const codes = await coursesContainingCard(uid, params.cardId);
  await Promise.all(codes.map(code => runTransaction(db, async transaction => {
    const standingRef = doc(db, 'courses', code, 'standings', uid);
    const snapshot = await transaction.get(standingRef);
    const previous = snapshot.exists() ? snapshot.data() : {};
    const attempts = Number(previous.attempts || 0) + 1;
    const correct = Number(previous.correct || 0) + (params.correct ? 1 : 0);
    transaction.set(standingRef, {
      userId: uid,
      username: params.username.slice(0, 40),
      fullName: params.fullName.slice(0, 80),
      isIncognito: params.isIncognito,
      attempts,
      correct,
      accuracyPercent: accuracyPercent(correct, attempts),
      updatedAt: now.toISOString(),
    });
  })));
}
