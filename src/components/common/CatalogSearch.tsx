import React, { useState } from 'react';
import { X } from 'lucide-react';

function fold(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function CatalogSearch({
  placeholder,
  selected,
  items,
  emptyLabel,
  onSelect,
  onClear,
}: {
  placeholder: string;
  selected: string;
  items: { id: string; name: string }[];
  emptyLabel: string;
  onSelect: (name: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const text = fold(query.trim());
  const matches = text
    ? items.filter(item => fold(item.name).includes(text)).slice(0, 6)
    : [];

  if (selected) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-100">
        {selected}
        <button type="button" onClick={onClear} className="text-zinc-500 hover:text-zinc-200" aria-label={`Quitar ${selected}`}>
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
      />
      {text && (
        matches.length === 0 ? (
          <p className="text-xs text-zinc-500">{emptyLabel}</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {matches.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.name);
                  setQuery('');
                }}
                className="w-full py-2 text-left text-base text-zinc-200 hover:text-zinc-50"
              >
                {item.name}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
