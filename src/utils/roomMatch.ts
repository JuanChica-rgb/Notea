import { MultiplayerRoom, RoomPlayer } from '../types';

export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const MIN_ROOM_PLAYERS = 2;
export const MAX_ROOM_PLAYERS = 5;
export const COURSE_ROOM_MAX = 40;

export function liveWindowOpen(closesAt: number, now = Date.now()) {
  return Number.isFinite(closesAt) && closesAt > now;
}

export function generateRoomCode(length = 4): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS.charAt(index);
  }
  return code;
}

export function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

export function roomPlayerList(room: MultiplayerRoom | null | undefined): RoomPlayer[] {
  if (!room?.players) return [];
  return Object.values(room.players);
}

export function rankRoomPlayers(players: RoomPlayer[]): RoomPlayer[] {
  return [...players].sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    const aTime = a.finishedAt ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.finishedAt ?? Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

export function playerProgressPercent(player: RoomPlayer, totalBlocks: number): number {
  if (player.finished) return 100;
  if (totalBlocks <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, player.currentBlockIndex) / totalBlocks) * 100));
}

export function allPlayersFinished(players: RoomPlayer[]): boolean {
  return players.length >= MIN_ROOM_PLAYERS && players.every(player => player.finished);
}

export function parseRoomDoc(id: string, data: Record<string, unknown>): MultiplayerRoom {
  const rawPlayers = data.players;
  let players: Record<string, RoomPlayer> = {};
  if (Array.isArray(rawPlayers)) {
    players = Object.fromEntries(
      rawPlayers
        .filter((item): item is RoomPlayer => Boolean(item && typeof item === 'object' && 'id' in item))
        .map(item => [item.id, item])
    );
  } else if (rawPlayers && typeof rawPlayers === 'object') {
    players = rawPlayers as Record<string, RoomPlayer>;
  }

  const state = data.state === 'playing' || data.state === 'finished' || data.state === 'lobby'
    ? data.state
    : 'lobby';

  return {
    id,
    roomCode: String(data.roomCode || id),
    hostId: String(data.hostId || ''),
    name: String(data.name || data.gameTitle || 'Sala'),
    gameId: String(data.gameId || ''),
    gameTitle: String(data.gameTitle || ''),
    isPrivate: true,
    format: Object.keys(players).length > 2 ? 'group' : '1v1',
    maxPlayers: Math.min(COURSE_ROOM_MAX, Math.max(MIN_ROOM_PLAYERS, Number(data.maxPlayers || COURSE_ROOM_MAX))),
    players,
    state,
    currentQuestionIndex: 0,
    totalQuestions: Number(data.totalBlocks || 0),
    totalBlocks: Number(data.totalBlocks || 0),
    secondsRemainingInRound: 0,
    roundStartTime: Number(data.startedAt || 0),
    createdAt: String(data.createdAt || ''),
    startedAt: typeof data.startedAt === 'number' ? data.startedAt : undefined,
  };
}
