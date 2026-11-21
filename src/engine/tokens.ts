// Token kinds shared by every language pack's syntax coloring.

export type TokenKind = 'keyword' | 'builtin' | 'string' | 'number' | 'comment' | 'operator' | 'punct' | 'name' | 'space'

export interface Token {
  kind: TokenKind
  text: string
  start: number
}

/** Token kind for every character position of a line. */
export function charKinds(tokens: Token[], length: number): TokenKind[] {
  const kinds: TokenKind[] = new Array(length)
  for (const t of tokens) {
    for (let k = 0; k < t.text.length; k++) kinds[t.start + k] = t.kind
  }
  return kinds
}
