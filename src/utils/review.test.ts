import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { InteractiveBlock } from '../types/index.ts';
import {
  accuracyPercent,
  memoryKey,
  nextDueAt,
  pickReviewBlocks,
  type BlockMemory,
  type ReviewSource,
} from './review.ts';

function block(id: string, seconds?: number): InteractiveBlock {
  return {
    id,
    type: 'true_false_rush',
    statements: [],
    estimatedTimeSeconds: seconds,
  };
}

function source(cardId: string, blockId: string, seconds?: number): ReviewSource {
  return { cardId, cardTitle: cardId, block: block(blockId, seconds) };
}

describe('pickReviewBlocks', () => {
  const now = new Date('2026-10-11T18:00:00.000Z');

  it('fills the session with unseen blocks up to about five minutes', () => {
    const pool = Array.from({ length: 12 }, (_, index) => source('calc', `b${index}`, 40));
    const picks = pickReviewBlocks(pool, [], now);
    assert.equal(picks.length, 8);
    assert.equal(picks.every(item => !item.missed), true);
  });

  it('puts due misses ahead of unseen blocks', () => {
    const pool = [source('calc', 'new', 40), source('calc', 'miss', 40)];
    const memory: BlockMemory[] = [{
      cardId: 'calc',
      blockId: 'miss',
      wrongCount: 1,
      correctCount: 0,
      lastCorrect: false,
      dueAt: '2026-10-11T08:00:00.000Z',
    }];
    const picks = pickReviewBlocks(pool, memory, now);
    assert.equal(picks[0].block.id, 'miss');
    assert.equal(picks[0].missed, true);
    assert.equal(picks[1].block.id, 'new');
  });

  it('leaves a miss for tomorrow instead of repeating it the same day', () => {
    const pool = [source('calc', 'miss', 40)];
    const memory: BlockMemory[] = [{
      cardId: 'calc',
      blockId: 'miss',
      wrongCount: 1,
      correctCount: 0,
      lastCorrect: false,
      dueAt: nextDueAt(false, now),
    }];
    assert.equal(pickReviewBlocks(pool, memory, now).length, 0);
  });

  it('still offers a short pass when everything was already answered well', () => {
    const pool = [source('calc', 'ok', 40), source('calc', 'also', 40)];
    const memory: BlockMemory[] = pool.map(item => ({
      cardId: item.cardId,
      blockId: item.block.id,
      wrongCount: 0,
      correctCount: 1,
      lastCorrect: true,
      dueAt: nextDueAt(true, now),
    }));
    const picks = pickReviewBlocks(pool, memory, now);
    assert.equal(picks.length, 2);
    assert.equal(picks.every(item => !item.missed), true);
  });
});

describe('accuracyPercent', () => {
  it('rounds the share of correct answers', () => {
    assert.equal(accuracyPercent(1, 3), 33);
    assert.equal(accuracyPercent(0, 0), 0);
  });
});

describe('memoryKey', () => {
  it('joins the card and the block', () => {
    assert.equal(memoryKey('CALC-7AEA', 'blk_1'), 'CALC-7AEA__blk_1');
  });
});
