import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function formulaHtml(source: string, display: boolean) {
  return katex.renderToString(source.trim(), {
    throwOnError: false,
    displayMode: display,
    strict: 'ignore',
    output: 'html',
  });
}

type BraceSlot = { open: number; close: number };

function braceSlots(value: string): BraceSlot[] {
  const slots: BraceSlot[] = [];
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '\\') {
      i += 1;
      continue;
    }
    if (value[i] !== '{') continue;
    let depth = 1;
    let j = i + 1;
    while (j < value.length && depth > 0) {
      if (value[j] === '\\') {
        j += 2;
        continue;
      }
      if (value[j] === '{') depth += 1;
      else if (value[j] === '}') depth -= 1;
      if (depth === 0) break;
      j += 1;
    }
    if (depth !== 0) break;
    if (value.slice(i + 1, j).includes('{')) continue;
    slots.push({ open: i, close: j });
    i = j;
  }
  return slots;
}

export type FormulaRange = { start: number; end: number; innerStart: number; inner: string };

export function formulaRanges(value: string): FormulaRange[] {
  const ranges: FormulaRange[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    const dollars = match[1] != null ? 2 : 1;
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      innerStart: match.index + dollars,
      inner: match[1] ?? match[2],
    });
  }
  return ranges;
}

export function formulaAt(value: string, index: number) {
  return formulaRanges(value).find(range => index > range.start && index < range.end) ?? null;
}

export function formulaSlots(value: string) {
  const slots: BraceSlot[] = [];
  for (const range of formulaRanges(value)) {
    for (const slot of braceSlots(range.inner)) {
      slots.push({ open: range.innerStart + slot.open, close: range.innerStart + slot.close });
    }
  }
  return slots;
}

function highlightFormula(source: string, localCursor: number | null) {
  const slots = braceSlots(source);
  let out = '';
  let index = 0;
  for (const slot of slots) {
    out += source.slice(index, slot.open + 1);
    const inner = source.slice(slot.open + 1, slot.close);
    const active = localCursor != null && localCursor > slot.open && localCursor <= slot.close;
    if (!inner) out += active ? '\\textcolor{#a5b4fc}{\\square}' : '\\square';
    else out += active ? `\\textcolor{#a5b4fc}{${inner}}` : inner;
    out += '}';
    index = slot.close + 1;
  }
  return out + source.slice(index);
}

function wrapBareMath(plain: string) {
  let out = '';
  let i = 0;
  while (i < plain.length) {
    const marker = plain[i] === '\\' && /[a-zA-Z]/.test(plain[i + 1] || '')
      ? i
      : plain[i] === '^' || plain[i] === '_'
        ? i
        : -1;
    const attached = marker > 0 && (plain[marker] === '^' || plain[marker] === '_') && /[A-Za-z0-9}]/.test(plain[marker - 1]);
    if (marker < 0 || ((plain[marker] === '^' || plain[marker] === '_') && !attached)) {
      out += plain[i];
      i += 1;
      continue;
    }
    let start = marker;
    if (plain[marker] === '^' || plain[marker] === '_') {
      while (start > 0 && /[A-Za-z0-9]/.test(plain[start - 1])) start -= 1;
    }
    while (start > 0 && /[[({]/.test(plain[start - 1])) start -= 1;
    let end = marker + 1;
    if (plain[marker] === '\\') {
      while (end < plain.length && /[a-zA-Z]/.test(plain[end])) end += 1;
    }
    while (end < plain.length) {
      const ch = plain[end];
      if (ch === '\\' && /[a-zA-Z]/.test(plain[end + 1] || '')) {
        end += 1;
        while (end < plain.length && /[a-zA-Z]/.test(plain[end])) end += 1;
        continue;
      }
      if (ch === '{' ) {
        let depth = 1;
        end += 1;
        while (end < plain.length && depth > 0) {
          if (plain[end] === '\\') end += 2;
          else {
            if (plain[end] === '{') depth += 1;
            else if (plain[end] === '}') depth -= 1;
            end += 1;
          }
        }
        continue;
      }
      if (ch === '^' || ch === '_') {
        end += 1;
        continue;
      }
      if (/[A-Za-z0-9()[\]+\-*=/,.]/.test(ch)) {
        end += 1;
        continue;
      }
      if (ch === ' ' && /[\\([{\^_]/.test(plain[end + 1] || '')) {
        end += 1;
        continue;
      }
      break;
    }
    while (end > start && /[.,]/.test(plain[end - 1]) && plain[end - 2] !== '\\') end -= 1;
    if (start < i) out = out.slice(0, out.length - (i - start));
    out += `$${plain.slice(start, end)}$`;
    i = end;
  }
  return out;
}

function withBareMath(text: string) {
  const pattern = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g;
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    out += wrapBareMath(text.slice(last, match.index));
    out += match[0];
    last = match.index + match[0].length;
  }
  return out + wrapBareMath(text.slice(last));
}

export function MathText({
  text,
  className = '',
  activeCursor = null,
  showSlots = false,
  onFormulaClick,
}: {
  text: string;
  className?: string;
  activeCursor?: number | null;
  showSlots?: boolean;
  onFormulaClick?: (start: number, end: number) => void;
}) {
  const rendered = showSlots ? text : withBareMath(text);
  const parts: React.ReactNode[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(rendered)) !== null) {
    if (match.index > last) parts.push(rendered.slice(last, match.index));
    const display = match[1] != null;
    const dollars = display ? 2 : 1;
    const source = match[1] ?? match[2];
    const end = match.index + match[0].length;
    const local = showSlots && activeCursor != null && activeCursor > match.index && activeCursor < end
      ? activeCursor - match.index - dollars
      : null;
    const shown = showSlots ? highlightFormula(source, local) : source;
    const start = match.index;
    parts.push(
      <span
        key={index}
        className="notea-math"
        onMouseDown={onFormulaClick ? event => event.preventDefault() : undefined}
        onClick={onFormulaClick ? event => {
          event.preventDefault();
          event.stopPropagation();
          onFormulaClick(start, end);
        } : undefined}
        dangerouslySetInnerHTML={{ __html: formulaHtml(shown, display) }}
      />,
    );
    index += 1;
    last = end;
  }
  if (last < rendered.length) parts.push(rendered.slice(last));
  if (parts.length === 0) return <span className={className}>{rendered}</span>;
  return <span className={`whitespace-pre-line ${className}`}>{parts}</span>;
}
