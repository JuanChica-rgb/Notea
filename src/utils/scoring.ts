import { InteractiveBlock } from '../types';

export function getBlockItemCount(block: InteractiveBlock): number {
  switch (block.type) {
    case 'content_card':
      return 0;
    case 'connect':
      return Math.max(1, block.pairs.length);
    case 'sequence':
      return Math.max(1, block.items.length);
    case 'swipe_classify':
      return Math.max(1, block.items.length);
    case 'hotspot':
      return Math.max(1, block.hotspots.length);
    case 'true_false_rush':
      return Math.max(1, block.statements.length);
    default:
      return 1;
  }
}

export function getBlockMaxPoints(block: InteractiveBlock, isGameMode: boolean): number {
  if (block.type === 'content_card') return 0;
  if (!isGameMode) return Math.max(0, block.basePoints ?? 100);
  return Math.min(20, Math.max(0, block.basePoints ?? 10));
}

export function scorePartial(correctItems: number, totalItems: number, maxPoints: number): number {
  if (totalItems <= 0 || maxPoints <= 0) return 0;
  return Math.round((maxPoints / totalItems) * Math.max(0, Math.min(correctItems, totalItems)));
}

function withoutContentScore(block: InteractiveBlock): InteractiveBlock {
  const { estimatedTimeSeconds: _time, basePoints: _points, ...rest } = block;
  return rest as InteractiveBlock;
}

export function applyExpectedTime(blocks: InteractiveBlock[], enabled: boolean): InteractiveBlock[] {
  return blocks.map(block => {
    if (block.type === 'content_card') return withoutContentScore(block);
    if (!enabled) {
      if (!block.estimatedTimeSeconds) return block;
      const { estimatedTimeSeconds: _removed, ...rest } = block;
      return rest as InteractiveBlock;
    }
    return {
      ...block,
      estimatedTimeSeconds: block.estimatedTimeSeconds && block.estimatedTimeSeconds > 0 ? block.estimatedTimeSeconds : 30,
    };
  });
}

export function withConsistentBlockTimes(blocks: InteractiveBlock[]): InteractiveBlock[] {
  const timed = blocks.some(block => block.type !== 'content_card' && (block.estimatedTimeSeconds ?? 0) > 0);
  return applyExpectedTime(blocks, timed);
}

export function getActivityMaxPoints(blocks: InteractiveBlock[], isGameMode: boolean): number {
  return blocks.reduce((sum, block) => sum + getBlockMaxPoints(block, isGameMode), 0);
}
