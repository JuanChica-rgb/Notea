import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { createLiveRoom, leaveLiveRoom } from './multiplayer';
import { COURSE_ROOM_MAX, generateRoomCode } from '../utils/roomMatch';
import type { ContentType, StudyItemCard, User } from '../types';

export interface CourseMember {
  id: string;
  username: string;
  fullName: string;
  role: 'owner' | 'admin' | 'student';
  joinedAt: string;
}

export interface CourseRequest {
  id: string;
  username: string;
  fullName: string;
  requestedAt: string;
}

export interface Course {
  code: string;
  name: string;
  description: string;
  subjectName: string;
  university: string;
  visibility: 'public' | 'private';
  ownerId: string;
  createdAt: string;
  memberIds: string[];
  members: Record<string, CourseMember>;
  pendingIds: string[];
  pending: Record<string, CourseRequest>;
  adminIds: string[];
  coverUrl?: string;
}

export interface CoursePost {
  id: string;
  authorId: string;
  authorUsername: string;
  text: string;
  createdAt: string;
  cardId?: string;
  cardTitle?: string;
  cardContentType?: ContentType;
  fileUrl?: string;
  fileName?: string;
  fileContentType?: string;
  roomCode?: string;
  closesAt?: number;
}

export const LIVE_GAME_MINUTES = [5, 10, 15, 30] as const;

const coursesCollection = 'courses';

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Inicia sesión para usar los cursos.');
  return uid;
}

function parseCourse(code: string, data: Record<string, unknown>): Course {
  const members = (data.members && typeof data.members === 'object' ? data.members : {}) as Record<string, CourseMember>;
  const pending = (data.pending && typeof data.pending === 'object' ? data.pending : {}) as Record<string, CourseRequest>;
  return {
    code,
    name: String(data.name || ''),
    description: String(data.description || ''),
    subjectName: String(data.subjectName || ''),
    university: String(data.university || ''),
    visibility: data.visibility === 'private' ? 'private' : 'public',
    ownerId: String(data.ownerId || ''),
    createdAt: String(data.createdAt || ''),
    memberIds: Array.isArray(data.memberIds) ? data.memberIds.map(String) : [],
    members,
    pendingIds: Array.isArray(data.pendingIds) ? data.pendingIds.map(String) : [],
    pending,
    adminIds: Array.isArray(data.adminIds) ? data.adminIds.map(String) : [],
    coverUrl: data.coverUrl ? String(data.coverUrl) : undefined,
  };
}

export function listenToMyCourseCodes(uid: string, onChange: (codes: string[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'userCourses', uid, 'items'), snapshot => {
    onChange(snapshot.docs.map(item => item.id));
  }, () => onChange([]));
}

export async function loadCourse(code: string): Promise<Course | null> {
  const snapshot = await getDoc(doc(db, coursesCollection, code));
  if (!snapshot.exists()) return null;
  return parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export function listenToMemberCourses(uid: string, onChange: (courses: Course[]) => void): Unsubscribe {
  const listed = query(collection(db, coursesCollection), where('memberIds', 'array-contains', uid));
  return onSnapshot(listed, snapshot => {
    const courses = snapshot.docs.map(item => parseCourse(item.id, item.data() as Record<string, unknown>));
    courses.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    onChange(courses);
  }, () => onChange([]));
}

export function listenToPublicCourses(onChange: (courses: Course[]) => void): Unsubscribe {
  const listed = query(collection(db, coursesCollection), where('visibility', '==', 'public'));
  return onSnapshot(listed, snapshot => {
    const courses = snapshot.docs.map(item => parseCourse(item.id, item.data() as Record<string, unknown>));
    courses.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    onChange(courses);
  }, () => onChange([]));
}

export function listenToCourse(code: string, onChange: (course: Course | null) => void): Unsubscribe {
  return onSnapshot(doc(db, coursesCollection, code), snapshot => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }
    onChange(parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>));
  }, () => onChange(null));
}

export function listenToPosts(code: string, onChange: (posts: CoursePost[]) => void): Unsubscribe {
  return onSnapshot(collection(db, coursesCollection, code, 'posts'), snapshot => {
    const posts: CoursePost[] = snapshot.docs.map(item => {
      const data = item.data() as Record<string, unknown>;
      const cardContentType: ContentType | undefined = data.cardContentType === 'game' || data.cardContentType === 'material'
        ? data.cardContentType
        : undefined;
      return {
        id: item.id,
        authorId: String(data.authorId || ''),
        authorUsername: String(data.authorUsername || ''),
        text: String(data.text || ''),
        createdAt: String(data.createdAt || ''),
        cardId: data.cardId ? String(data.cardId) : undefined,
        cardTitle: data.cardTitle ? String(data.cardTitle) : undefined,
        cardContentType,
        fileUrl: data.fileUrl ? String(data.fileUrl) : undefined,
        fileName: data.fileName ? String(data.fileName) : undefined,
        fileContentType: data.fileContentType ? String(data.fileContentType) : undefined,
        roomCode: data.roomCode ? String(data.roomCode) : undefined,
        closesAt: typeof data.closesAt === 'number' ? data.closesAt : undefined,
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onChange(posts);
  }, () => onChange([]));
}

function publishedCourseEntry(course: Course) {
  return { code: course.code, name: course.name, visibility: course.visibility };
}

async function rememberCardOnCourse(cardId: string, course: Course) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const cardRef = doc(db, 'cards', cardId);
  const snapshot = await getDoc(cardRef);
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if (data.authorId !== uid) return;
  const current = Array.isArray(data.publishedCourses) ? data.publishedCourses : [];
  const entry = publishedCourseEntry(course);
  const already = current.some(item =>
    item && item.code === entry.code && item.name === entry.name && item.visibility === entry.visibility
  );
  if (already) return;
  const next = [...current.filter(item => item?.code !== course.code), entry];
  await updateDoc(cardRef, { publishedCourses: next });
}

async function forgetCardOnCourse(cardId: string, code: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const cardRef = doc(db, 'cards', cardId);
  const snapshot = await getDoc(cardRef);
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if (data.authorId !== uid) return;
  const current = Array.isArray(data.publishedCourses) ? data.publishedCourses : [];
  const next = current.filter(item => item?.code !== code);
  if (next.length === current.length) return;
  await updateDoc(cardRef, { publishedCourses: next });
}

export async function syncCourseMaterials(course: Course, posts: CoursePost[]) {
  const uid = auth.currentUser?.uid;
  if (!uid || !isCourseStaff(course, uid)) return;
  const cardIds = [...new Set(posts.map(post => post.cardId).filter((id): id is string => Boolean(id)))];
  await Promise.all(cardIds.map(cardId => rememberCardOnCourse(cardId, course).catch(() => undefined)));
}

export function isCourseStaff(course: Course, uid: string) {
  if (!uid || !course.memberIds.includes(uid)) return false;
  if (course.ownerId === uid) return true;
  return course.members[uid]?.role === 'admin' || course.adminIds.includes(uid);
}

function membershipRole(course: Course, uid: string): 'owner' | 'admin' | 'student' {
  if (course.ownerId === uid) return 'owner';
  return course.members[uid]?.role === 'admin' ? 'admin' : 'student';
}

async function rememberMembership(uid: string, course: Course, role: 'owner' | 'admin' | 'student' | 'pending') {
  await setDoc(doc(db, 'userCourses', uid, 'items', course.code), {
    code: course.code,
    name: course.name,
    subjectName: course.subjectName,
    ownerId: course.ownerId,
    role,
  });
}

export async function createCourse(params: {
  name: string;
  description: string;
  subjectName: string;
  university: string;
  visibility: 'public' | 'private';
  username: string;
  fullName: string;
}): Promise<Course> {
  const uid = requireUid();
  const name = params.name.trim();
  const description = params.description.trim();
  const subjectName = params.subjectName.trim();
  const university = params.university.trim();
  if (name.length < 2 || name.length > 120) throw new Error('Ponle un nombre al curso.');
  if (description.length > 500) throw new Error('La descripción es muy larga.');
  if (!subjectName || subjectName.length > 120) throw new Error('Indica la materia.');
  if (!university || university.length > 120) throw new Error('Indica la universidad.');
  const createdAt = new Date().toISOString();
  const member: CourseMember = {
    id: uid,
    username: params.username,
    fullName: params.fullName,
    role: 'owner',
    joinedAt: createdAt,
  };

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const ref = doc(db, coursesCollection, code);
    const created = await runTransaction(db, async transaction => {
      const existing = await transaction.get(ref);
      if (existing.exists()) return null;
      const payload = {
        code,
        name,
        description,
        subjectName,
        university,
        visibility: params.visibility,
        ownerId: uid,
        createdAt,
        memberIds: [uid],
        members: { [uid]: member },
        pendingIds: [],
        pending: {},
        adminIds: [],
      };
      transaction.set(ref, payload);
      return parseCourse(code, payload);
    });
    if (created) {
      await rememberMembership(uid, created, 'owner');
      return created;
    }
  }
  throw new Error('No se pudo crear el curso. Inténtalo de nuevo.');
}

export async function joinCourse(code: string, username: string, fullName: string): Promise<Course> {
  const uid = requireUid();
  const ref = doc(db, coursesCollection, code);
  const course = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('No encontramos ese curso. Revisa el código.');
    const current = parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
    if (current.memberIds.includes(uid)) return current;
    if (current.visibility === 'private') throw new Error('Este curso es privado. Hay que pedir autorización.');
    const member: CourseMember = {
      id: uid,
      username,
      fullName,
      role: 'student',
      joinedAt: new Date().toISOString(),
    };
    transaction.update(ref, {
      memberIds: arrayUnion(uid),
      [`members.${uid}`]: member,
    });
    return {
      ...current,
      memberIds: [...current.memberIds, uid],
      members: { ...current.members, [uid]: member },
    };
  });
  await rememberMembership(uid, course, course.ownerId === uid ? 'owner' : 'student');
  return course;
}

export async function requestCourse(code: string, username: string, fullName: string): Promise<Course> {
  const uid = requireUid();
  const ref = doc(db, coursesCollection, code);
  const course = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('No encontramos ese curso. Revisa el código.');
    const current = parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
    if (current.memberIds.includes(uid)) return current;
    if (current.visibility !== 'private') throw new Error('Este curso es público. Entra con el código.');
    if (current.pendingIds.includes(uid)) return current;
    const request: CourseRequest = {
      id: uid,
      username,
      fullName,
      requestedAt: new Date().toISOString(),
    };
    transaction.update(ref, {
      pendingIds: arrayUnion(uid),
      [`pending.${uid}`]: request,
    });
    return {
      ...current,
      pendingIds: [...current.pendingIds, uid],
      pending: { ...current.pending, [uid]: request },
    };
  });
  await rememberMembership(uid, course, course.memberIds.includes(uid) ? 'student' : 'pending');
  return course;
}

export async function enterCourse(code: string, username: string, fullName: string): Promise<{ course: Course; status: 'joined' | 'pending' }> {
  const uid = requireUid();
  const existing = await loadCourse(code);
  if (!existing) throw new Error('No encontramos ese curso. Revisa el código.');
  if (existing.memberIds.includes(uid)) return { course: existing, status: 'joined' };
  if (existing.visibility === 'private') {
    const course = await requestCourse(code, username, fullName);
    return { course, status: course.memberIds.includes(uid) ? 'joined' : 'pending' };
  }
  const course = await joinCourse(code, username, fullName);
  return { course, status: 'joined' };
}

export async function approveRequest(code: string, person: CourseRequest) {
  const uid = requireUid();
  const ref = doc(db, coursesCollection, code);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('No se encontró el curso.');
    const current = parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
    if (!isCourseStaff(current, uid)) throw new Error('Solo un admin del curso puede aceptar.');
    if (!current.pendingIds.includes(person.id)) return;
    const member: CourseMember = {
      id: person.id,
      username: person.username,
      fullName: person.fullName,
      role: 'student',
      joinedAt: new Date().toISOString(),
    };
    transaction.update(ref, {
      memberIds: arrayUnion(person.id),
      [`members.${person.id}`]: member,
      pendingIds: arrayRemove(person.id),
      [`pending.${person.id}`]: deleteField(),
    });
  });
}

export async function rejectRequest(code: string, personId: string) {
  const uid = requireUid();
  const ref = doc(db, coursesCollection, code);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) return;
    const current = parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
    if (!isCourseStaff(current, uid)) throw new Error('Solo un admin del curso puede rechazar.');
    transaction.update(ref, {
      pendingIds: arrayRemove(personId),
      [`pending.${personId}`]: deleteField(),
    });
  });
}

export async function leaveCourse(code: string) {
  const uid = requireUid();
  const ref = doc(db, coursesCollection, code);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) return;
    const current = parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
    if (current.ownerId === uid) throw new Error('El creador no puede salir. Puede eliminar el curso.');
    if (current.pendingIds.includes(uid) && !current.memberIds.includes(uid)) {
      transaction.update(ref, {
        pendingIds: arrayRemove(uid),
        [`pending.${uid}`]: deleteField(),
      });
      return;
    }
    transaction.update(ref, {
      memberIds: arrayRemove(uid),
      [`members.${uid}`]: deleteField(),
    });
  });
  await deleteDoc(doc(db, 'userCourses', uid, 'items', code));
}

export async function syncMembership(course: Course) {
  const uid = auth.currentUser?.uid;
  if (!uid || !course.memberIds.includes(uid)) return;
  await rememberMembership(uid, course, membershipRole(course, uid));
}

export async function forgetCourse(code: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await deleteDoc(doc(db, 'userCourses', uid, 'items', code));
}

export async function deleteCourse(code: string) {
  const uid = requireUid();
  const snapshot = await getDoc(doc(db, coursesCollection, code));
  if (!snapshot.exists()) return;
  const course = parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
  if (course.ownerId !== uid) throw new Error('Solo quien creó el curso puede eliminarlo.');
  await deleteDoc(doc(db, coursesCollection, code));
  await deleteDoc(doc(db, 'userCourses', uid, 'items', code));
}

const courseFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export async function uploadCourseFile(code: string, file: File) {
  const uid = requireUid();
  const fileContentType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!courseFileTypes.includes(fileContentType)) throw new Error('El archivo debe ser PDF, JPG, PNG, WEBP o GIF.');
  if (file.size > 10 * 1024 * 1024) throw new Error('El archivo debe pesar menos de 10 MB.');
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-60) || 'archivo';
  const storageRef = ref(storage, `courses/${code}/${uid}/${Date.now()}_${safeName}`);
  const snapshot = await uploadBytes(storageRef, file, { contentType: fileContentType });
  return {
    fileUrl: await getDownloadURL(snapshot.ref),
    fileName: file.name.slice(0, 180),
    fileContentType,
  };
}

export async function addCoursePost(code: string, params: {
  username: string;
  text: string;
  cardId?: string;
  cardTitle?: string;
  cardContentType?: ContentType;
  fileUrl?: string;
  fileName?: string;
  fileContentType?: string;
  roomCode?: string;
  closesAt?: number;
}) {
  const uid = requireUid();
  const course = await loadCourse(code);
  if (!course || !isCourseStaff(course, uid)) throw new Error('Solo un admin del curso puede publicar.');
  const text = params.text.trim();
  if (!text) throw new Error('Escribe el aviso.');
  await addDoc(collection(db, coursesCollection, code, 'posts'), {
    authorId: uid,
    authorUsername: params.username,
    text,
    createdAt: new Date().toISOString(),
    ...(params.cardId ? {
      cardId: params.cardId,
      cardTitle: params.cardTitle || '',
      cardContentType: params.cardContentType || 'material',
    } : {}),
    ...(params.fileUrl ? {
      fileUrl: params.fileUrl,
      fileName: params.fileName || 'Archivo',
      fileContentType: params.fileContentType || 'application/pdf',
    } : {}),
    ...(params.roomCode ? {
      roomCode: params.roomCode,
      closesAt: params.closesAt || 0,
    } : {}),
  });
  if (params.cardId) await rememberCardOnCourse(params.cardId, course).catch(() => undefined);
}

export async function uploadCourseCover(code: string, file: File) {
  const uid = requireUid();
  const storageRef = ref(storage, `courses/${code}/${uid}/cover_${Date.now()}.jpg`);
  const snapshot = await uploadBytes(storageRef, file, { contentType: 'image/jpeg' });
  return getDownloadURL(snapshot.ref);
}

export async function updateCourseDetails(code: string, details: { name: string; description: string }) {
  const uid = requireUid();
  const course = await loadCourse(code);
  if (!course || !isCourseStaff(course, uid)) throw new Error('Solo un admin del curso puede editarlo.');
  const name = details.name.trim();
  const description = details.description.trim();
  if (name.length < 2 || name.length > 120) throw new Error('Ponle un nombre al curso.');
  if (description.length > 500) throw new Error('La descripción es muy larga.');
  await updateDoc(doc(db, coursesCollection, code), { name, description });
}

export async function updateCourseCover(code: string, coverUrl: string | null) {
  const uid = requireUid();
  const course = await loadCourse(code);
  if (!course || !isCourseStaff(course, uid)) throw new Error('Solo un admin del curso puede cambiar la portada.');
  await updateDoc(doc(db, coursesCollection, code), coverUrl ? { coverUrl } : { coverUrl: deleteField() });
}

export async function deleteCoursePost(code: string, postId: string) {
  const uid = requireUid();
  const course = await loadCourse(code);
  if (!course || !isCourseStaff(course, uid)) throw new Error('Solo un admin del curso puede eliminar avisos.');
  const postRef = doc(db, coursesCollection, code, 'posts', postId);
  const postSnapshot = await getDoc(postRef);
  const cardId = postSnapshot.exists() ? String(postSnapshot.data().cardId || '') : '';
  await deleteDoc(postRef);
  if (!cardId) return;
  const remaining = await getDocs(query(
    collection(db, coursesCollection, code, 'posts'),
    where('cardId', '==', cardId),
  ));
  if (remaining.empty) await forgetCardOnCourse(cardId, code).catch(() => undefined);
}

export async function setCourseAdmin(code: string, personId: string, makeAdmin: boolean) {
  const uid = requireUid();
  const ref = doc(db, coursesCollection, code);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('No se encontró el curso.');
    const current = parseCourse(snapshot.id, snapshot.data() as Record<string, unknown>);
    if (current.ownerId !== uid) throw new Error('Solo quien creó el curso puede nombrar admins.');
    if (personId === current.ownerId) throw new Error('El creador ya administra el curso.');
    const member = current.members[personId];
    if (!member) throw new Error('Esa persona no está en el curso.');
    const adminIds = makeAdmin
      ? [...new Set([...current.adminIds, personId])]
      : current.adminIds.filter(id => id !== personId);
    transaction.update(ref, {
      [`members.${personId}`]: { ...member, role: makeAdmin ? 'admin' : 'student' },
      adminIds,
    });
  });
}

export async function publishCourseGame(params: {
  code: string;
  username: string;
  text: string;
  minutes: number;
  card: StudyItemCard;
  user: User;
}) {
  const uid = requireUid();
  const course = await loadCourse(params.code);
  if (!course || !isCourseStaff(course, uid)) throw new Error('Solo un admin del curso puede abrir un juego.');
  if (params.card.contentType !== 'game') throw new Error('Elige un juego.');
  if (params.card.authorId !== uid) throw new Error('Solo puedes abrir un juego que hayas creado.');
  if (!LIVE_GAME_MINUTES.includes(params.minutes as (typeof LIVE_GAME_MINUTES)[number])) {
    throw new Error('Elige 5, 10, 15 o 30 minutos.');
  }
  const closesAt = Date.now() + params.minutes * 60 * 1000;
  const text = params.text.trim() || `Juego en clase: ${params.card.title}`;
  const room = await createLiveRoom({
    user: { ...params.user, id: uid },
    card: params.card,
    maxPlayers: COURSE_ROOM_MAX,
    courseCode: params.code,
    closesAt,
  });
  try {
    await addCoursePost(params.code, {
      username: params.username,
      text,
      cardId: params.card.id,
      cardTitle: params.card.title,
      cardContentType: 'game',
      roomCode: room.roomCode,
      closesAt,
    });
  } catch (error) {
    await leaveLiveRoom(room, uid).catch(() => undefined);
    throw error;
  }
  return room;
}
