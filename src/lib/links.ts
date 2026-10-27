export type AppLink =
  | { type: 'material'; id: string }
  | { type: 'course'; code: string }
  | { type: 'account'; username: string };

export function parseAppPath(path: string): AppLink | null {
  const parts = path.split('/').filter(Boolean);
  const id = parts[1] ? decodeURIComponent(parts[1]) : '';
  if (!id) return null;
  if (parts[0] === 'm') return { type: 'material', id };
  if (parts[0] === 'c') return { type: 'course', code: id.toUpperCase() };
  if (parts[0] === 'u') return { type: 'account', username: id.replace(/^@/, '').toLowerCase() };
  return null;
}

export function materialUrl(id: string) {
  return `${window.location.origin}/m/${encodeURIComponent(id)}`;
}

export function courseUrl(code: string) {
  return `${window.location.origin}/c/${encodeURIComponent(code)}`;
}

export function accountUrl(username: string) {
  return `${window.location.origin}/u/${encodeURIComponent(username.replace(/^@/, ''))}`;
}

export function rememberPath(path: string) {
  if (window.location.pathname !== path) {
    window.history.replaceState(null, '', path);
  }
}

export async function copyAppLink(url: string, showToast: (message: string) => void) {
  try {
    await navigator.clipboard.writeText(url);
    showToast('Enlace copiado.');
  } catch {
    showToast(url);
  }
}
