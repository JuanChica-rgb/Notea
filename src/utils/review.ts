import type { InteractiveBlock, StudyItemCard } from '../types';

export const REVIEW_BUDGET_SECONDS = 5 * 60;
export const REVIEW_MAX_BLOCKS = 8;
export const FALLBACK_BLOCK_SECONDS = 40;

export interface BlockMemory {
  cardId: string;
  blockId: string;
  wrongCount: number;
  correctCount: number;
  lastCorrect: boolean;
  dueAt: string;
}

export interface ReviewSource {
  cardId: string;
  cardTitle: string;
  block: InteractiveBlock;
}

export interface ReviewPick extends ReviewSource {
  missed: boolean;
}

export function memoryKey(cardId: string, blockId: string) {
  return `${cardId}__${blockId}`.replace(/\//g, '_');
}

export function isPracticeBlock(block: InteractiveBlock) {
  return block.type !== 'content_card';
}

export function blockSeconds(block: InteractiveBlock) {
  const seconds = block.estimatedTimeSeconds;
  if (typeof seconds === 'number' && seconds > 0) return seconds;
  return FALLBACK_BLOCK_SECONDS;
}

export function nextDueAt(correct: boolean, from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + (correct ? 4 : 1));
  next.setHours(8, 0, 0, 0);
  return next.toISOString();
}

export function accuracyPercent(correct: number, attempts: number) {
  if (attempts <= 0) return 0;
  return Math.round((correct * 100) / attempts);
}

export function coursePracticePool(cards: StudyItemCard[], cardIds: string[]): ReviewSource[] {
  const wanted = new Set(cardIds);
  const pool: ReviewSource[] = [];
  for (const card of cards) {
    if (!wanted.has(card.id)) continue;
    for (const block of card.blocks || []) {
      if (!isPracticeBlock(block)) continue;
      pool.push({ cardId: card.id, cardTitle: card.title, block });
    }
  }
  return pool;
}

export function pickReviewBlocks(pool: ReviewSource[], memory: BlockMemory[], now = new Date()): ReviewPick[] {
  const byKey = new Map(memory.map(item => [memoryKey(item.cardId, item.blockId), item]));
  const nowIso = now.toISOString();
  const missedDue: ReviewSource[] = [];
  const unseen: ReviewSource[] = [];
  const mastered: ReviewSource[] = [];

  for (const item of pool) {
    const saved = byKey.get(memoryKey(item.cardId, item.block.id));
    if (!saved) unseen.push(item);
    else if (!saved.lastCorrect && saved.dueAt <= nowIso) missedDue.push(item);
    else if (saved.lastCorrect) mastered.push(item);
  }

  const chosen: ReviewPick[] = [];
  let seconds = 0;
  const take = (item: ReviewSource, missed: boolean, limit: number) => {
    if (chosen.length >= limit) return false;
    if (chosen.length > 0 && seconds >= REVIEW_BUDGET_SECONDS) return false;
    chosen.push({ ...item, missed });
    seconds += blockSeconds(item.block);
    return true;
  };

  for (const item of [...missedDue, ...unseen]) {
    if (!take(item, missedDue.includes(item), REVIEW_MAX_BLOCKS)) break;
  }

  if (chosen.length === 0) {
    for (const item of mastered) {
      if (!take(item, false, 4)) break;
    }
  }

  return chosen;
}
