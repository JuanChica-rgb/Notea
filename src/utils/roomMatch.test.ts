import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { allPlayersFinished, liveWindowOpen, normalizeRoomCode, playerProgressPercent, rankRoomPlayers } from './roomMatch.ts';
import { RoomPlayer } from '../types';

const player = (partial: Partial<RoomPlayer> & Pick<RoomPlayer, 'id' | 'username'>): RoomPlayer => ({
  avatarUrl: '',
  isIncognito: false,
  score: 0,
  currentBlockIndex: 0,
  finished: false,
  isHost: false,
  roundScore: 0,
  isReady: true,
  hasAnsweredCurrentRound: false,
  speedBonusApplied: false,
  ...partial,
});

describe('rankRoomPlayers', () => {
  it('orders by score and uses finish time as a tie-break', () => {
    const ranked = rankRoomPlayers([
      player({ id: 'a', username: 'ana', score: 10, finishedAt: 200 }),
      player({ id: 'b', username: 'bruno', score: 30, finishedAt: 400 }),
      player({ id: 'c', username: 'carla', score: 30, finishedAt: 150 }),
    ]);
    assert.deepEqual(ranked.map(item => item.id), ['c', 'b', 'a']);
  });

  it('treats unfinished players as last on a tied score', () => {
    const ranked = rankRoomPlayers([
      player({ id: 'late', username: 'late', score: 12 }),
      player({ id: 'done', username: 'done', score: 12, finishedAt: 10 }),
    ]);
    assert.equal(ranked[0].id, 'done');
  });
});

describe('room helpers', () => {
  it('normalizes join codes', () => {
    assert.equal(normalizeRoomCode(' 7k2m '), '7K2M');
  });

  it('closes a live game when its time is over', () => {
    assert.equal(liveWindowOpen(1_000, 999), true);
    assert.equal(liveWindowOpen(1_000, 1_000), false);
    assert.equal(liveWindowOpen(Number.NaN, 1_000), false);
  });

  it('reports progress and completion', () => {
    const racing = player({ id: 'p', username: 'p', currentBlockIndex: 1 });
    const done = player({ id: 'd', username: 'd', finished: true, currentBlockIndex: 4 });
    assert.equal(playerProgressPercent(racing, 4), 25);
    assert.equal(playerProgressPercent(done, 4), 100);
    assert.equal(allPlayersFinished([done, player({ id: 'x', username: 'x', finished: true })]), true);
    assert.equal(allPlayersFinished([done]), false);
  });
});
