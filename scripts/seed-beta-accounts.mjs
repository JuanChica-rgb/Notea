import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  arrayUnion,
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const app = initializeApp({
  apiKey: 'AIzaSyDHITVzEr4UNDyCPkvmllFkBk0LfIJvv24',
  authDomain: 'notea-6a76e.firebaseapp.com',
  projectId: 'notea-6a76e',
  storageBucket: 'notea-6a76e.firebasestorage.app',
});
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const PASSWORD = 'Notea12345';
const UNIVERSITY = 'Universidad Nacional de Colombia';

const people = [
  ['prueba1', 'Lucía Herrera', 'tutor'],
  ['prueba2', 'Mateo Ríos', 'professor'],
  ['prueba3', 'Sara Gómez', 'tutor'],
  ['prueba4', 'Camilo Díaz', 'student'],
  ['prueba5', 'Valentina Cruz', 'student'],
  ['prueba6', 'Juan Pablo Mora', 'student'],
  ['prueba7', 'Andrés Paz', 'tutor'],
  ['prueba8', 'Sofía León', 'student'],
  ['prueba9', 'Daniel Ortiz', 'student'],
  ['admin1', 'Ana Admin', 'tutor'],
  ['admin2', 'Pedro Admin', 'tutor'],
  ['admin3', 'Elena Admin', 'professor'],
];

function emailOf(username) {
  return `${username}@notea-beta.com`;
}

function statements(subject) {
  return [
    { id: 's1', statement: `Este repaso es de ${subject}.`, isTrue: true, explanation: 'Es el tema del curso de prueba.' },
    { id: 's2', statement: 'Notea es un curso de cocina.', isTrue: false, explanation: 'Notea es una app de cursos y material de estudio.' },
  ];
}

function practiceBlock(id, subject) {
  return {
    id,
    type: 'true_false_rush',
    title: 'Repaso',
    basePoints: 10,
    estimatedTimeSeconds: 30,
    statements: statements(subject),
  };
}

async function openAccount(username) {
  const email = emailOf(username);
  try {
    return (await createUserWithEmailAndPassword(auth, email, PASSWORD)).user;
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') throw error;
    return (await signInWithEmailAndPassword(auth, email, PASSWORD)).user;
  }
}

async function ready() {
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('Sin sesión.');
  await auth.currentUser.getIdToken(true);
}

async function saveProfile(user, username, fullName, kind) {
  await ready();
  const existing = await getDoc(doc(db, 'users', user.uid));
  if (existing.exists()) {
    if (kind !== 'student' && !existing.data().educatorStatus) {
      await updateDoc(doc(db, 'users', user.uid), {
        educatorKind: kind,
        educatorUniversity: UNIVERSITY,
        educatorStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }
  await setDoc(doc(db, 'users', user.uid), {
    id: user.uid,
    fullName,
    username,
    email: emailOf(username),
    avatarUrl: '',
    bannerType: 'gradient',
    bannerValue: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    university: UNIVERSITY,
    career: 'Ingeniería en Sistemas',
    currentSemester: 3,
    enrolledSubjects: ['Calculo Diferencial'],
    isIncognito: false,
    bio: kind === 'student' ? 'Cuenta de prueba. Estudiante.' : 'Cuenta de prueba. Tutor.',
    streakDays: 1,
    role: 'user',
    createdAt: '2026-10-26',
    updatedAt: '2026-10-26',
    isGuest: false,
    mustVerifyEmail: false,
    emailVerified: true,
  });
  if (kind !== 'student') {
    await updateDoc(doc(db, 'users', user.uid), {
      educatorKind: kind,
      educatorUniversity: UNIVERSITY,
      educatorStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });
  }
}

async function ensureCourse(owner, params) {
  const ref = doc(db, 'courses', params.code);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    const createdAt = new Date().toISOString();
    await setDoc(ref, {
      code: params.code,
      name: params.name,
      description: params.description,
      subjectName: params.subjectName,
      university: UNIVERSITY,
      visibility: params.visibility,
      ownerId: owner.uid,
      createdAt,
      memberIds: [owner.uid],
      members: {
        [owner.uid]: {
          id: owner.uid,
          username: owner.username,
          fullName: owner.fullName,
          role: 'owner',
          joinedAt: createdAt,
        },
      },
      pendingIds: [],
      pending: {},
      adminIds: [],
    });
  }
  await setDoc(doc(db, 'userCourses', owner.uid, 'items', params.code), {
    code: params.code,
    name: params.name,
    subjectName: params.subjectName,
    ownerId: owner.uid,
    role: 'owner',
  });
}

async function saveCard(owner, card) {
  const cardRef = doc(db, 'cards', card.id);
  if ((await getDoc(cardRef)).exists()) return;
  await setDoc(cardRef, {
    ...card,
    authorId: owner.uid,
    authorUsername: owner.username,
    authorUniversity: UNIVERSITY,
    universityName: UNIVERSITY,
    semester: 3,
    coverType: 'gradient',
    rating: 0,
    ratingsCount: 0,
    ratingSum: 0,
    visibility: 'public',
    createdAt: new Date().toISOString(),
  });
}

async function savePost(owner, code, id, data) {
  const postRef = doc(db, 'courses', code, 'posts', id);
  if ((await getDoc(postRef)).exists()) return;
  await setDoc(postRef, {
    authorId: owner.uid,
    authorUsername: owner.username,
    createdAt: new Date().toISOString(),
    ...data,
  });
}

async function join(person, course) {
  const courseRef = doc(db, 'courses', course.code);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(courseRef);
    const data = snapshot.data();
    if (data.memberIds.includes(person.uid)) return;
    transaction.update(courseRef, {
      memberIds: arrayUnion(person.uid),
      [`members.${person.uid}`]: {
        id: person.uid,
        username: person.username,
        fullName: person.fullName,
        role: 'student',
        joinedAt: new Date().toISOString(),
      },
    });
  });
  await setDoc(doc(db, 'userCourses', person.uid, 'items', course.code), {
    code: course.code,
    name: course.name,
    subjectName: course.subjectName,
    ownerId: course.ownerId,
    role: 'student',
  });
}

async function requestEntry(person, course) {
  const courseRef = doc(db, 'courses', course.code);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(courseRef);
    const data = snapshot.data();
    if (data.memberIds.includes(person.uid) || data.pendingIds.includes(person.uid)) return;
    transaction.update(courseRef, {
      pendingIds: arrayUnion(person.uid),
      [`pending.${person.uid}`]: {
        id: person.uid,
        username: person.username,
        fullName: person.fullName,
        requestedAt: new Date().toISOString(),
      },
    });
  });
  await setDoc(doc(db, 'userCourses', person.uid, 'items', course.code), {
    code: course.code,
    name: course.name,
    subjectName: course.subjectName,
    ownerId: course.ownerId,
    role: 'pending',
  });
}

async function promote(ownerUid, person, course) {
  const courseRef = doc(db, 'courses', course.code);
  try {
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(courseRef);
      const data = snapshot.data();
      if (data.members?.[person.uid]?.role === 'admin') return;
      const adminIds = Array.isArray(data.adminIds) ? data.adminIds : [];
      transaction.update(courseRef, {
        [`members.${person.uid}`]: { ...data.members[person.uid], role: 'admin' },
        adminIds: [...new Set([...adminIds, person.uid])],
      });
    });
    console.log('admin del curso', person.username, course.code);
  } catch (error) {
    console.error('no se pudo nombrar admin', person.username, error.code, error.message);
    throw error;
  }
  await signOut(auth);
  await signInWithEmailAndPassword(auth, emailOf(person.username), PASSWORD);
  await ready();
  await setDoc(doc(db, 'userCourses', person.uid, 'items', course.code), {
    code: course.code,
    name: course.name,
    subjectName: course.subjectName,
    ownerId: ownerUid,
    role: 'admin',
  });
}

async function uploadPdf(owner, code) {
  const storageRef = ref(storage, `courses/${code}/${owner.uid}/guia_de_prueba.pdf`);
  try {
    return await getDownloadURL(storageRef);
  } catch (error) {
    if (error.code !== 'storage/object-not-found') throw error;
  }
  const bytes = new Blob([
    '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
  ], { type: 'application/pdf' });
  const snapshot = await uploadBytes(storageRef, bytes, { contentType: 'application/pdf' });
  return getDownloadURL(snapshot.ref);
}

const accounts = {};
for (const [username, fullName, kind] of people) {
  try {
    const user = await openAccount(username);
    await saveProfile(user, username, fullName, kind);
    accounts[username] = { uid: user.uid, username, fullName, kind };
    console.log('cuenta', username, user.uid);
    await signOut(auth);
  } catch (error) {
    console.error('falló', username, error.code || '', error.message);
    throw error;
  }
}

async function asUser(username, task) {
  await signInWithEmailAndPassword(auth, emailOf(username), PASSWORD);
  await ready();
  try {
    return await task(accounts[username]);
  } finally {
    await signOut(auth);
  }
}

const courses = {
  calculo: { code: 'P1CL', name: 'Cálculo de prueba', description: 'Curso de prueba de cálculo diferencial.', subjectName: 'Calculo Diferencial', visibility: 'public', owner: 'prueba1' },
  quimica: { code: 'Q2PR', name: 'Química de prueba', description: 'Curso de prueba de química.', subjectName: 'Quimica', visibility: 'public', owner: 'prueba2' },
  fisica: { code: 'F3PR', name: 'Física de prueba', description: 'Curso de prueba de física mecánica.', subjectName: 'Física Mecánica', visibility: 'public', owner: 'prueba3' },
  privado: { code: 'V7PR', name: 'Repaso privado', description: 'Curso privado de prueba. Hay que pedir autorización.', subjectName: 'Calculo Integral', visibility: 'private', owner: 'prueba7' },
};

for (const course of Object.values(courses)) {
  await asUser(course.owner, owner => ensureCourse(owner, course));
  course.ownerId = accounts[course.owner].uid;
  console.log('curso', course.code, course.name);
}

await asUser('prueba1', async owner => {
  await saveCard(owner, {
    id: 'prueba1-derivadas-cuaderno',
    title: 'Derivadas de prueba',
    description: 'Cuaderno corto para el curso de cálculo.',
    contentType: 'material',
    accessCode: 'CALC-P1A',
    subjectName: 'Calculo Diferencial',
    coverValue: 'linear-gradient(135deg, #064e3b 0%, #18181b 100%)',
    blocks: [
      { id: 'c1', type: 'content_card', title: 'La derivada', body: 'La derivada mide cómo cambia una función.', calloutType: 'key_concept', basePoints: 0, estimatedTimeSeconds: 20 },
      practiceBlock('p1', 'cálculo'),
    ],
  });
  await saveCard(owner, {
    id: 'prueba1-derivadas-juego',
    title: 'Juego de derivadas',
    description: 'Juego corto de verdadero o falso.',
    contentType: 'game',
    accessCode: 'CALC-P1B',
    subjectName: 'Calculo Diferencial',
    coverValue: 'linear-gradient(135deg, #4c1d95 0%, #18181b 100%)',
    blocks: [practiceBlock('g1', 'cálculo')],
  });
  await savePost(owner, 'P1CL', 'cuaderno', {
    text: 'Cuaderno del curso.',
    cardId: 'prueba1-derivadas-cuaderno',
    cardTitle: 'Derivadas de prueba',
    cardContentType: 'material',
  });
  await savePost(owner, 'P1CL', 'juego', {
    text: 'Juego del curso.',
    cardId: 'prueba1-derivadas-juego',
    cardTitle: 'Juego de derivadas',
    cardContentType: 'game',
  });
  const fileUrl = await uploadPdf(owner, 'P1CL');
  await savePost(owner, 'P1CL', 'guia', {
    text: 'Guía de prueba.pdf',
    fileUrl,
    fileName: 'Guía de prueba.pdf',
    fileContentType: 'application/pdf',
  });
});

await asUser('prueba2', async owner => {
  await saveCard(owner, {
    id: 'prueba2-quimica-cuaderno',
    title: 'Átomos de prueba',
    description: 'Cuaderno corto de química.',
    contentType: 'material',
    accessCode: 'QUIM-P2A',
    subjectName: 'Quimica',
    coverValue: 'linear-gradient(135deg, #7c2d12 0%, #18181b 100%)',
    blocks: [practiceBlock('q1', 'química')],
  });
  await savePost(owner, 'Q2PR', 'cuaderno', {
    text: 'Cuaderno de química.',
    cardId: 'prueba2-quimica-cuaderno',
    cardTitle: 'Átomos de prueba',
    cardContentType: 'material',
  });
});

await asUser('prueba3', async owner => {
  await saveCard(owner, {
    id: 'prueba3-fisica-juego',
    title: 'Fuerzas de prueba',
    description: 'Juego corto de física.',
    contentType: 'game',
    accessCode: 'FISI-P3A',
    subjectName: 'Física Mecánica',
    coverValue: 'linear-gradient(135deg, #1e3a8a 0%, #18181b 100%)',
    blocks: [practiceBlock('f1', 'física')],
  });
  await savePost(owner, 'F3PR', 'juego', {
    text: 'Juego de física.',
    cardId: 'prueba3-fisica-juego',
    cardTitle: 'Fuerzas de prueba',
    cardContentType: 'game',
  });
});

const joins = [
  ['prueba4', courses.calculo],
  ['prueba5', courses.calculo],
  ['prueba5', courses.fisica],
  ['prueba6', courses.quimica],
  ['prueba8', courses.quimica],
  ['prueba9', courses.fisica],
  ['admin1', courses.calculo],
  ['admin2', courses.quimica],
  ['admin3', courses.fisica],
];
for (const [username, course] of joins) {
  await asUser(username, person => join(person, { ...course, ownerId: accounts[course.owner].uid }));
  console.log('entra', username, course.code);
}

await asUser('prueba8', person => requestEntry(person, { ...courses.privado, ownerId: accounts.prueba7.uid }));
console.log('solicitud', 'prueba8', 'V7PR');

await asUser('prueba1', () => promote(accounts.prueba1.uid, accounts.admin1, { ...courses.calculo, ownerId: accounts.prueba1.uid }));
await asUser('prueba2', () => promote(accounts.prueba2.uid, accounts.admin2, { ...courses.quimica, ownerId: accounts.prueba2.uid }));
await asUser('prueba3', () => promote(accounts.prueba3.uid, accounts.admin3, { ...courses.fisica, ownerId: accounts.prueba3.uid }));
console.log('admins listos');
console.log(JSON.stringify(Object.values(courses).map(course => ({ code: course.code, name: course.name, owner: course.owner })), null, 2));
