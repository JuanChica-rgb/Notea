import { deleteField, doc, getDoc, onSnapshot, runTransaction, Unsubscribe } from 'firebase/firestore';
import { auth, db } from './firebase';
import { MultiplayerRoom, RoomPlayer, StudyItemCard, User } from '../types';
import {
  COURSE_ROOM_MAX,
  generateRoomCode,
  liveWindowOpen,
  MIN_ROOM_PLAYERS,
  normalizeRoomCode,
  parseRoomDoc,
  roomPlayerList,
} from '../utils/roomMatch';

const roomsCollection = 'rooms';

const toRoomPlayer = (user: User, isHost: boolean): RoomPlayer => ({
  id: user.id,
  username: user.username,
  avatarUrl: user.avatarUrl || '',
  isIncognito: false,
  score: 0,
  currentBlockIndex: 0,
  finished: false,
  isHost,
  isReady: true,
  roundScore: 0,
  hasAnsweredCurrentRound: false,
  speedBonusApplied: false,
});

export function listenToRoom(roomCode: string, onChange: (room: MultiplayerRoom | null) => void): Unsubscribe {
  return onSnapshot(doc(db, roomsCollection, roomCode), snapshot => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }
    onChange(parseRoomDoc(snapshot.id, snapshot.data() as Record<string, unknown>));
  }, error => {
    console.error('Error al escuchar la sala:', error);
    onChange(null);
  });
}

export async function createLiveRoom(params: {
  user: User;
  card: StudyItemCard;
  courseCode: string;
  closesAt: number;
  maxPlayers?: number;
}): Promise<MultiplayerRoom> {
  const uid = auth.currentUser?.uid;
  if (!uid || params.user.isGuest) {
    throw new Error('Debes iniciar sesión para abrir el juego.');
  }
  if (!liveWindowOpen(params.closesAt)) {
    throw new Error('El tiempo para entrar ya terminó.');
  }

  const maxPlayers = Math.min(COURSE_ROOM_MAX, Math.max(MIN_ROOM_PLAYERS, params.maxPlayers || COURSE_ROOM_MAX));
  const host = toRoomPlayer({ ...params.user, id: uid }, true);
  const createdAt = new Date().toISOString();

  for (let attempt = 0; attempt < 8; attempt++) {
    const roomCode = generateRoomCode();
    const roomRef = doc(db, roomsCollection, roomCode);
    const created = await runTransaction(db, async transaction => {
      const existing = await transaction.get(roomRef);
      if (existing.exists()) return null;
      const payload = {
        hostId: uid,
        roomCode,
        name: params.card.title,
        gameId: params.card.id,
        gameTitle: params.card.title,
        isPrivate: true,
        format: 'group',
        maxPlayers,
        state: 'lobby',
        totalBlocks: params.card.blocks?.length || 0,
        createdAt,
        courseCode: params.courseCode,
        closesAt: params.closesAt,
        players: { [uid]: host },
      };
      transaction.set(roomRef, payload);
      return parseRoomDoc(roomCode, payload);
    });
    if (created) return created;
  }

  throw new Error('No se pudo generar un código de sala libre. Inténtalo de nuevo.');
}

export async function joinLiveRoom(code: string, user: User): Promise<MultiplayerRoom> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('No se pudo entrar a la sala. Recarga la página e inténtalo de nuevo.');
  }

  const roomCode = normalizeRoomCode(code);
  if (roomCode.length !== 4) {
    throw new Error('El código de sala debe tener 4 caracteres.');
  }

  const roomRef = doc(db, roomsCollection, roomCode);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) {
      throw new Error('No encontramos esa sala. Revisa el código.');
    }
    const data = snapshot.data() as Record<string, unknown>;
    const room = parseRoomDoc(snapshot.id, data);
    const closesAt = Number(data.closesAt || 0);
    const courseCode = String(data.courseCode || '');
    if (!courseCode) throw new Error('Esta partida no está abierta.');
    if (room.state === 'lobby' && !liveWindowOpen(closesAt)) {
      throw new Error('El tiempo para entrar ya terminó.');
    }
    if (room.players[uid]) return room;
    if (!liveWindowOpen(closesAt)) throw new Error('El tiempo para entrar ya terminó.');
    if (room.state !== 'lobby') {
      throw new Error('Esa partida ya comenzó o terminó.');
    }
    const seated = roomPlayerList(room);
    if (seated.length >= room.maxPlayers) {
      throw new Error('La sala está llena.');
    }

    const member = toRoomPlayer({ ...user, id: uid }, false);
    transaction.update(roomRef, { [`players.${uid}`]: member });
    return {
      ...room,
      players: { ...room.players, [uid]: member },
    };
  });
}

export async function startLiveRoom(room: MultiplayerRoom, userId: string): Promise<void> {
  if (room.hostId !== userId) {
    throw new Error('Solo el anfitrión puede iniciar la partida.');
  }
  const seated = roomPlayerList(room);
  if (seated.length < MIN_ROOM_PLAYERS) {
    throw new Error(`Se necesitan al menos ${MIN_ROOM_PLAYERS} jugadores para empezar.`);
  }

  const roomRef = doc(db, roomsCollection, room.roomCode);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error('La sala ya no existe.');
    const current = parseRoomDoc(snapshot.id, snapshot.data() as Record<string, unknown>);
    if (current.hostId !== userId) throw new Error('Solo el anfitrión puede iniciar la partida.');
    if (current.state !== 'lobby') return;
    if (roomPlayerList(current).length < MIN_ROOM_PLAYERS) {
      throw new Error(`Se necesitan al menos ${MIN_ROOM_PLAYERS} jugadores para empezar.`);
    }
    transaction.update(roomRef, {
      state: 'playing',
      startedAt: Date.now(),
    });
  });
}

export async function updateLiveRoomProgress(params: {
  roomCode: string;
  userId: string;
  score: number;
  currentBlockIndex: number;
  finished: boolean;
}): Promise<void> {
  const roomRef = doc(db, roomsCollection, params.roomCode);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error('La sala ya no existe.');
    const room = parseRoomDoc(snapshot.id, snapshot.data() as Record<string, unknown>);
    const me = room.players[params.userId];
    if (!me) throw new Error('Ya no estás en esta sala.');
    if (room.state === 'finished' || me.finished) return;

    const nextPlayer: RoomPlayer = {
      id: me.id,
      username: me.username,
      avatarUrl: me.avatarUrl || '',
      isIncognito: Boolean(me.isIncognito),
      score: params.score,
      currentBlockIndex: params.currentBlockIndex,
      finished: params.finished,
      isHost: Boolean(me.isHost),
      isReady: me.isReady ?? true,
      roundScore: me.roundScore || 0,
      hasAnsweredCurrentRound: Boolean(me.hasAnsweredCurrentRound),
      speedBonusApplied: Boolean(me.speedBonusApplied),
    };
    if (params.finished) {
      nextPlayer.finishedAt = me.finishedAt || Date.now();
    }
    const players = { ...room.players, [params.userId]: nextPlayer };
    const seated = roomPlayerList({ ...room, players });
    const everyoneDone = seated.length >= MIN_ROOM_PLAYERS && seated.every(player => player.finished);

    transaction.update(roomRef, {
      [`players.${params.userId}`]: nextPlayer,
      ...(everyoneDone ? { state: 'finished' } : {}),
    });
  });
}

export async function leaveLiveRoom(room: MultiplayerRoom, userId: string): Promise<void> {
  const roomRef = doc(db, roomsCollection, room.roomCode);
  const snapshot = await getDoc(roomRef);
  if (!snapshot.exists()) return;

  const current = parseRoomDoc(snapshot.id, snapshot.data() as Record<string, unknown>);
  if (current.hostId === userId && current.state === 'lobby') {
    await runTransaction(db, async transaction => {
      const latest = await transaction.get(roomRef);
      if (latest.exists()) transaction.delete(roomRef);
    });
    return;
  }

  if (!current.players[userId]) return;
  await runTransaction(db, async transaction => {
    const latest = await transaction.get(roomRef);
    if (!latest.exists()) return;
    transaction.update(roomRef, { [`players.${userId}`]: deleteField() });
  });
}
