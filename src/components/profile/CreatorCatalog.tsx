import React from 'react';
import { ClassroomCard } from '../common/ClassroomCard';
import type { StudyItemCard } from '../../types';

export const CreatorCatalog: React.FC<{ cards: StudyItemCard[] }> = ({ cards }) => {
  if (cards.length === 0) {
    return (
      <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl">
        <p className="text-sm font-semibold text-zinc-200">No ha creado material ni juegos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map(card => <ClassroomCard key={card.id} card={card} />)}
    </div>
  );
};
