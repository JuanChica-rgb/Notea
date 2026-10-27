import { Career, Subject } from '../types';

export function foldCatalogName(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function matchCatalogItem<T extends { name: string }>(items: T[], value: string): T | undefined {
  const key = foldCatalogName(value);
  if (!key) return undefined;
  const exact = items.filter(item => foldCatalogName(item.name) === key);
  if (exact.length > 0) return exact[0];
  const loose = items.filter(item => {
    const name = foldCatalogName(item.name);
    return name.includes(key) || key.includes(name);
  });
  return loose.length === 1 ? loose[0] : undefined;
}

export function sortByCatalogOrder<T extends { name: string; order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export function nextCatalogOrder(items: { order?: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1;
}

export function namesFromList(text: string, existing: string[]) {
  const seen = new Set(existing.map(foldCatalogName));
  const names: string[] = [];
  const skipped: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const name = line.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!name) continue;
    const key = foldCatalogName(name);
    if (seen.has(key)) {
      skipped.push(name);
      continue;
    }
    seen.add(key);
    names.push(name);
  }
  return { names, skipped };
}

export function careerUniversityIds(career: Career): string[] {
  if (career.universityIds && career.universityIds.length > 0) return career.universityIds;
  return career.universityId ? [career.universityId] : [];
}

export function careersForUniversity(careers: Career[], universityId?: string): Career[] {
  if (!universityId) return careers;
  return careers.filter(career => {
    const ids = careerUniversityIds(career);
    return ids.length === 0 || ids.includes(universityId);
  });
}

export function sortedUniqueSubjects(subjects: Subject[]): Subject[] {
  const seen = new Set<string>();
  return [...subjects]
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    .filter(subject => {
      const key = subject.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
