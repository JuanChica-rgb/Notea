import { StudyItemCard } from '../types';

export function getRatingVoteCount(card: Pick<StudyItemCard, 'ratingsCount' | 'ratingsByUser'>): number {
  const votes = Object.keys(card.ratingsByUser || {}).length;
  return votes;
}

export function cardHasRealRatings(card: Pick<StudyItemCard, 'ratingsCount' | 'ratingsByUser'>): boolean {
  return getRatingVoteCount(card) > 0;
}

export function getCardAverageRating(card: Pick<StudyItemCard, 'rating' | 'ratingsByUser' | 'ratingSum'>): number {
  const ratings = Object.values(card.ratingsByUser || {});
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((total, value) => total + value, 0);
  return Number((sum / ratings.length).toFixed(2));
}

export function getCardLikeScore(card: Pick<StudyItemCard, 'rating' | 'ratingsByUser' | 'ratingSum' | 'ratingsCount'>): number {
  const votes = getRatingVoteCount(card);
  const average = getCardAverageRating(card);
  return average * votes;
}

export function sortByMostLiked<T extends Pick<StudyItemCard, 'rating' | 'ratingsByUser' | 'ratingSum' | 'ratingsCount'>>(cards: T[]): T[] {
  return [...cards].sort((first, second) => {
    const likeDiff = getCardLikeScore(second) - getCardLikeScore(first);
    if (likeDiff !== 0) return likeDiff;
    const voteDiff = getRatingVoteCount(second) - getRatingVoteCount(first);
    if (voteDiff !== 0) return voteDiff;
    return getCardAverageRating(second) - getCardAverageRating(first);
  });
}
