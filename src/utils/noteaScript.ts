import type { ContentType, InteractiveBlock } from '../types';

const KINDS = ['texto', 'flashcard', 'conectar', 'secuencia', 'rellenar', 'clasificar', 'vf', 'slider'] as const;
type Kind = (typeof KINDS)[number];

export const NOTEA_SCRIPT_RULES = `Eres un autor de Notea. Responde solo con un guion Notea, sin explicación alrededor.

Un guion tiene una cabecera y bloques separados por una línea que dice exactamente ---.

Cabecera, una clave por línea:
tipo: material
tipo: juego
titulo: texto
descripcion: texto
universidad: nombre exacto del catálogo
materia: nombre exacto del catálogo
tiempos: 30
tiempos solo vale en un juego. Es segundos para cada pregunta. Las tarjetas de texto no llevan tiempo. Si no quieres tiempo, omite la línea.

Cada bloque empieza con su tipo, solo, en una línea. Luego sus claves. Una clave por línea. Si un texto sigue en la línea de abajo y esa línea no tiene :, se pega al valor anterior.

texto
titulo: texto
cuerpo: texto. Las fórmulas van entre $ y $, por ejemplo $x^2$.
aviso: info
aviso: clave
aviso: resumen
aviso: formula

flashcard
Solo en material, nunca en un juego.
pregunta: texto
respuesta: texto

conectar
enunciado: texto
par: izquierda | derecha
Mínimo dos pares.

secuencia
enunciado: texto
paso: texto
Los pasos van en el orden correcto. Mínimo dos.

rellenar
frase: La derivada de sen(x) es [cos(x)].
La respuesta correcta va entre corchetes.
modo: opciones
modo: escribir
opcion: texto
Si el modo es opciones, incluye la correcta y al menos una incorrecta.
explicacion: texto

clasificar
enunciado: texto
caja: nombre
item: texto | nombre de la caja
Mínimo dos cajas y un ítem.

vf
frase: afirmación | si | por qué
frase: afirmación | no | por qué
Mínimo una frase. Usa si o no.

slider
enunciado: texto
min: 0
max: 100
unidad: %
valor: 75
tolerancia: 5
explicacion: texto

No uses imágenes, zonas para tocar ni diagramas. Eso se agrega después en el editor visual.
No inventes claves. No numeres los bloques. No uses markdown.`;

export const NOTEA_SCRIPT_EXAMPLE = `tipo: material
titulo: Repaso de derivadas
descripcion: Tres ejercicios cortos antes de clase.
universidad: Universidad Nacional de Colombia
materia: Cálculo Diferencial

---
texto
titulo: Idea
cuerpo: La derivada mide cómo cambia una función. La de $x^2$ es $2x$.
aviso: clave

---
flashcard
pregunta: ¿Derivada de una constante?
respuesta: 0

---
vf
frase: La derivada de una constante es 0 | si | Una constante no cambia.
frase: La derivada de x^2 es x | no | Es 2x.`;

export type NoteaDraft = {
  contentType?: ContentType;
  title?: string;
  description?: string;
  university?: string;
  subject?: string;
  blocks: InteractiveBlock[];
};

type Fields = Map<string, string[]>;

const one = (fields: Fields, key: string) => (fields.get(key) || [])[0] || '';
const many = (fields: Fields, key: string) => fields.get(key) || [];

const stamp = (index: number) => `${index}_${Math.random().toString(36).slice(2, 7)}`;

function readLines(chunk: string, where: string, errors: string[]) {
  const fields: Fields = new Map();
  let kind = '';
  let lastKey = '';
  chunk.split('\n').forEach(raw => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const bare = line.toLowerCase().replace(/^bloque\s+/, '');
    if (!kind && (KINDS as readonly string[]).includes(bare) && !line.includes(':')) {
      kind = bare;
      lastKey = '';
      return;
    }
    const split = line.indexOf(':');
    if (split < 1) {
      if (!lastKey) {
        errors.push(`${where}: no entiendo "${line}".`);
        return;
      }
      const list = fields.get(lastKey) || [];
      list[list.length - 1] = `${list[list.length - 1]}\n${line}`;
      return;
    }
    const key = line.slice(0, split).trim().toLowerCase();
    const value = line.slice(split + 1).trim();
    const list = fields.get(key) || [];
    list.push(value);
    fields.set(key, list);
    lastKey = key;
  });
  return { kind: kind as Kind | '', fields };
}

function splitPair(value: string, where: string, errors: string[]) {
  const parts = value.split('|').map(part => part.trim());
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    errors.push(`${where}: falta el separador |.`);
    return null;
  }
  return parts;
}

function bracketAnswer(sentence: string) {
  const match = sentence.match(/\[([^[\]]+)\]/);
  return match?.[1]?.trim() || '';
}

function callout(value: string): 'info' | 'key_concept' | 'summary' | 'formula' | undefined {
  const name = value.toLowerCase();
  if (name === 'clave') return 'key_concept';
  if (name === 'resumen') return 'summary';
  if (name === 'formula' || name === 'fórmula') return 'formula';
  if (name === 'info') return 'info';
  return undefined;
}

function buildBlock(kind: Kind, fields: Fields, index: number, contentType: ContentType, errors: string[]): InteractiveBlock | null {
  const where = `Bloque ${index + 1} (${kind})`;
  const id = `blk_${stamp(index)}`;
  const ownTime = Number(one(fields, 'tiempo'));
  const withTime = (block: InteractiveBlock): InteractiveBlock => {
    if (block.type === 'content_card' || !Number.isFinite(ownTime) || ownTime <= 0) return block;
    return { ...block, estimatedTimeSeconds: ownTime };
  };

  if (kind === 'texto') {
    const body = one(fields, 'cuerpo');
    if (!body) {
      errors.push(`${where}: falta cuerpo.`);
      return null;
    }
    const notice = callout(one(fields, 'aviso'));
    return {
      id,
      type: 'content_card',
      title: one(fields, 'titulo') || 'Texto',
      body,
      ...(notice ? { calloutType: notice } : {}),
    };
  }

  if (kind === 'flashcard') {
    if (contentType === 'game') {
      errors.push(`${where}: una flashcard solo vive en un material, no en un juego.`);
      return null;
    }
    const question = one(fields, 'pregunta');
    const answer = one(fields, 'respuesta');
    if (!question || !answer) {
      errors.push(`${where}: faltan pregunta y respuesta.`);
      return null;
    }
    return { id, type: 'flashcard', question, answer };
  }

  if (kind === 'conectar') {
    const prompt = one(fields, 'enunciado');
    const pairs = many(fields, 'par').map((value, pairIndex) => {
      const parts = splitPair(value, where, errors);
      return parts ? { id: `p_${stamp(pairIndex)}`, left: parts[0], right: parts[1] } : null;
    }).filter((pair): pair is { id: string; left: string; right: string } => Boolean(pair));
    if (!prompt || pairs.length < 2) {
      errors.push(`${where}: hacen falta el enunciado y al menos dos pares.`);
      return null;
    }
    return withTime({ id, type: 'connect', prompt, pairs });
  }

  if (kind === 'secuencia') {
    const prompt = one(fields, 'enunciado');
    const items = many(fields, 'paso').filter(Boolean).map((text, step) => ({
      id: `s_${stamp(step)}`,
      text,
      correctOrder: step + 1,
    }));
    if (!prompt || items.length < 2) {
      errors.push(`${where}: hacen falta el enunciado y al menos dos pasos.`);
      return null;
    }
    return withTime({ id, type: 'sequence', prompt, items });
  }

  if (kind === 'rellenar') {
    const sentence = one(fields, 'frase');
    const correctAnswer = bracketAnswer(sentence);
    const options = many(fields, 'opcion').filter(Boolean);
    const modeWord = one(fields, 'modo').toLowerCase();
    const mode = modeWord === 'opciones' || (modeWord !== 'escribir' && options.length > 0)
      ? 'multiple_choice'
      : 'free_text';
    if (!sentence || !correctAnswer) {
      errors.push(`${where}: la frase debe traer la respuesta entre corchetes.`);
      return null;
    }
    if (mode === 'multiple_choice') {
      const names = options.length ? options : [correctAnswer];
      if (!names.some(option => option.toLowerCase() === correctAnswer.toLowerCase())) names.unshift(correctAnswer);
      const correctOptionIndex = names.findIndex(option => option.toLowerCase() === correctAnswer.toLowerCase());
      return withTime({
        id,
        type: 'fill_blank',
        sentence,
        mode,
        options: names,
        correctAnswer,
        correctOptionIndex,
        explanation: one(fields, 'explicacion'),
      });
    }
    return withTime({
      id,
      type: 'fill_blank',
      sentence,
      mode,
      options: [],
      correctAnswer,
      explanation: one(fields, 'explicacion'),
    });
  }

  if (kind === 'clasificar') {
    const prompt = one(fields, 'enunciado');
    const categories = many(fields, 'caja').filter(Boolean);
    const items = many(fields, 'item').map((value, itemIndex) => {
      const parts = splitPair(value, where, errors);
      return parts ? { id: `c_${stamp(itemIndex)}`, text: parts[0], category: parts[1] } : null;
    }).filter((item): item is { id: string; text: string; category: string } => Boolean(item));
    const known = new Set(categories.map(name => name.toLowerCase()));
    if (!prompt || categories.length < 2 || items.length < 1 || items.some(item => !known.has(item.category.toLowerCase()))) {
      errors.push(`${where}: hacen falta el enunciado, dos cajas y cada ítem en una de esas cajas.`);
      return null;
    }
    return withTime({ id, type: 'swipe_classify', prompt, categories, items });
  }

  if (kind === 'vf') {
    const statements = many(fields, 'frase').map((value, itemIndex) => {
      const parts = value.split('|').map(part => part.trim());
      if (parts.length < 2 || !parts[0]) {
        errors.push(`${where}: cada frase va como afirmación | si | por qué.`);
        return null;
      }
      const flag = parts[1].toLowerCase();
      const isTrue = flag === 'si' || flag === 'sí' || flag === 'verdadero' || flag === 'true';
      const isFalse = flag === 'no' || flag === 'falso' || flag === 'false';
      if (!isTrue && !isFalse) {
        errors.push(`${where}: usa si o no.`);
        return null;
      }
      return {
        id: `tf_${stamp(itemIndex)}`,
        statement: parts[0],
        isTrue,
        explanation: parts.slice(2).join(' | '),
      };
    }).filter((item): item is { id: string; statement: string; isTrue: boolean; explanation: string } => Boolean(item));
    if (!statements.length) {
      errors.push(`${where}: falta al menos una frase.`);
      return null;
    }
    return withTime({ id, type: 'true_false_rush', statements });
  }

  const prompt = one(fields, 'enunciado');
  const min = Number(one(fields, 'min').replace(',', '.'));
  const max = Number(one(fields, 'max').replace(',', '.'));
  const correctValue = Number(one(fields, 'valor').replace(',', '.'));
  const tolerance = Number(one(fields, 'tolerancia').replace(',', '.'));
  if (!prompt || [min, max, correctValue, tolerance].some(value => !Number.isFinite(value)) || min >= max) {
    errors.push(`${where}: faltan enunciado, min, max, valor y tolerancia.`);
    return null;
  }
  return withTime({
    id,
    type: 'slider_estimator',
    prompt,
    min,
    max,
    unit: one(fields, 'unidad'),
    correctValue,
    tolerance,
    explanation: one(fields, 'explicacion'),
  });
}

export function parseNoteaScript(source: string): { draft: NoteaDraft | null; errors: string[] } {
  const errors: string[] = [];
  const chunks = source.replace(/\r\n/g, '\n').split(/\n---\s*(?:\n|$)/).map(chunk => chunk.trim()).filter(Boolean);
  if (!chunks.length) {
    return { draft: null, errors: ['El guion está vacío.'] };
  }

  const header = readLines(chunks[0], 'Cabecera', errors);
  const headerStartsBlock = Boolean(header.kind);
  const headerFields = headerStartsBlock ? new Map() : header.fields;
  const tipo = one(headerFields, 'tipo').toLowerCase();
  let contentType: ContentType | undefined;
  if (tipo === 'material' || tipo === 'cuaderno' || tipo === 'estudio') contentType = 'material';
  else if (tipo === 'juego' || tipo === 'game') contentType = 'game';
  else if (tipo) errors.push('Cabecera: tipo debe ser material o juego.');

  const assumed: ContentType = contentType || 'material';
  const blockChunks = headerStartsBlock ? chunks : chunks.slice(1);
  if (headerStartsBlock) {
    errors.push('Cabecera: el primer bloque tiene que ir después de una línea ---.');
  }

  const timeWord = one(headerFields, 'tiempos').toLowerCase();
  const headerTime = timeWord === 'si' || timeWord === 'sí' ? 30 : Number(timeWord.replace(',', '.'));

  const blocks = blockChunks.map((chunk, index) => {
    const read = readLines(chunk, `Bloque ${index + 1}`, errors);
    if (!read.kind) {
      errors.push(`Bloque ${index + 1}: falta el tipo (texto, flashcard, conectar, secuencia, rellenar, clasificar, vf o slider).`);
      return null;
    }
    return buildBlock(read.kind, read.fields, index, assumed, errors);
  }).filter((block): block is InteractiveBlock => Boolean(block));

  if (!blocks.length) errors.push('No quedó ningún bloque.');

  const timedBlocks = assumed === 'game' && Number.isFinite(headerTime) && headerTime > 0
    ? blocks.map(block => block.type === 'content_card' || block.estimatedTimeSeconds
      ? block
      : { ...block, estimatedTimeSeconds: headerTime })
    : blocks;

  if (errors.length) return { draft: null, errors };
  return {
    draft: {
      contentType,
      title: one(headerFields, 'titulo') || undefined,
      description: one(headerFields, 'descripcion') || undefined,
      university: one(headerFields, 'universidad') || undefined,
      subject: one(headerFields, 'materia') || undefined,
      blocks: timedBlocks,
    },
    errors: [],
  };
}

function line(key: string, value?: string) {
  return value ? `${key}: ${value.replace(/\n/g, '\n')}` : '';
}

export function notebookToScript(input: {
  contentType: ContentType;
  title: string;
  description: string;
  university: string;
  subject: string;
  blocks: InteractiveBlock[];
}) {
  const timed = input.blocks.find(block => block.type !== 'content_card' && (block.estimatedTimeSeconds ?? 0) > 0);
  const header = [
    `tipo: ${input.contentType === 'game' ? 'juego' : 'material'}`,
    line('titulo', input.title),
    input.description && input.description !== 'Sin descripción.' ? line('descripcion', input.description) : '',
    line('universidad', input.university),
    line('materia', input.subject),
    input.contentType === 'game' && timed?.estimatedTimeSeconds ? `tiempos: ${timed.estimatedTimeSeconds}` : '',
  ].filter(Boolean);

  const body = input.blocks.map(block => {
    if (block.type === 'content_card') {
      const aviso = block.calloutType === 'key_concept' ? 'clave'
        : block.calloutType === 'summary' ? 'resumen'
        : block.calloutType === 'formula' ? 'formula'
        : block.calloutType === 'info' ? 'info' : '';
      return ['texto', line('titulo', block.title), `cuerpo: ${block.body}`, aviso ? `aviso: ${aviso}` : ''].filter(Boolean).join('\n');
    }
    if (block.type === 'flashcard') {
      return ['flashcard', `pregunta: ${block.question}`, `respuesta: ${block.answer}`].join('\n');
    }
    if (block.type === 'connect') {
      return ['conectar', `enunciado: ${block.prompt}`, ...block.pairs.map(pair => `par: ${pair.left} | ${pair.right}`)].join('\n');
    }
    if (block.type === 'sequence') {
      return ['secuencia', `enunciado: ${block.prompt}`, ...[...block.items].sort((a, b) => a.correctOrder - b.correctOrder).map(item => `paso: ${item.text}`)].join('\n');
    }
    if (block.type === 'fill_blank') {
      const lines = ['rellenar', `frase: ${block.sentence}`, `modo: ${block.mode === 'multiple_choice' ? 'opciones' : 'escribir'}`];
      block.options.forEach(option => lines.push(`opcion: ${option}`));
      if (block.explanation) lines.push(`explicacion: ${block.explanation}`);
      return lines.join('\n');
    }
    if (block.type === 'swipe_classify') {
      return ['clasificar', `enunciado: ${block.prompt}`, ...block.categories.map(name => `caja: ${name}`), ...block.items.map(item => `item: ${item.text} | ${item.category}`)].join('\n');
    }
    if (block.type === 'true_false_rush') {
      return ['vf', ...block.statements.map(item => `frase: ${item.statement} | ${item.isTrue ? 'si' : 'no'} | ${item.explanation}`)].join('\n');
    }
    if (block.type === 'slider_estimator') {
      return ['slider', `enunciado: ${block.prompt}`, `min: ${block.min}`, `max: ${block.max}`, `unidad: ${block.unit}`, `valor: ${block.correctValue}`, `tolerancia: ${block.tolerance}`, `explicacion: ${block.explanation}`].join('\n');
    }
    return '';
  }).filter(Boolean);

  return [...header, ...body.map(chunk => `---\n${chunk}`)].join('\n');
}
