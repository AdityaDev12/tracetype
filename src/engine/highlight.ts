// A small Python tokenizer, good enough for coloring one line at a time.

export type TokenKind =
  | 'keyword'
  | 'builtin'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'punct'
  | 'name'
  | 'space'

export interface Token {
  kind: TokenKind
  text: string
  start: number
}

export const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
  'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield',
])

export const BUILTINS = new Set([
  'print', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple',
  'type', 'input', 'sum', 'min', 'max', 'abs', 'round', 'sorted', 'reversed', 'enumerate',
  'zip', 'map', 'filter', 'any', 'all', 'isinstance', 'open',
])

const OPERATOR_CHARS = '+-*/%=<>!&|^~@'
const PUNCT_CHARS = '()[]{}:,.;'

export function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const push = (kind: TokenKind, end: number) => {
    tokens.push({ kind, text: line.slice(i, end), start: i })
    i = end
  }
  while (i < line.length) {
    const c = line[i]
    if (c === ' ' || c === '\t') {
      let j = i
      while (j < line.length && (line[j] === ' ' || line[j] === '\t')) j++
      push('space', j)
    } else if (c === '#') {
      push('comment', line.length)
    } else if (c === '"' || c === "'" || (/[fFrRbB]/.test(c) && (line[i + 1] === '"' || line[i + 1] === "'"))) {
      let j = c === '"' || c === "'" ? i : i + 1
      const q = line[j]
      j++
      while (j < line.length && line[j] !== q) {
        if (line[j] === '\\') j++
        j++
      }
      push('string', Math.min(j + 1, line.length))
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(line[i + 1] ?? ''))) {
      let j = i
      while (j < line.length && /[0-9._a-fA-FxXoObBeEjJ]/.test(line[j])) j++
      push('number', j)
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++
      const word = line.slice(i, j)
      push(KEYWORDS.has(word) ? 'keyword' : BUILTINS.has(word) ? 'builtin' : 'name', j)
    } else if (OPERATOR_CHARS.includes(c)) {
      let j = i
      while (j < line.length && OPERATOR_CHARS.includes(line[j])) j++
      push('operator', j)
    } else if (PUNCT_CHARS.includes(c)) {
      push('punct', i + 1)
    } else {
      push('name', i + 1)
    }
  }
  return tokens
}

/** Token kind for every character position of the line. */
export function charKinds(line: string): TokenKind[] {
  const kinds: TokenKind[] = new Array(line.length)
  for (const t of tokenize(line)) {
    for (let k = 0; k < t.text.length; k++) kinds[t.start + k] = t.kind
  }
  return kinds
}
