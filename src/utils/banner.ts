export function bannerStyle(value?: string): { background?: string; backgroundImage?: string; backgroundSize?: string; backgroundPosition?: string } {
  if (!value || /^(https?:|data:|blob:)/.test(value)) {
    return { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' };
  }
  return { background: value };
}
