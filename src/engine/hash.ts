// Canonical JSON (sorted keys, no spaces) so TypeScript and Python agree on
// the hash of an item's authored fields. Must match canonical_hash() in
// src/languages/python/runtime.py.

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`
}

/** The authored part of an item: everything except the generated `gen`. */
export function authored<T extends object>(item: T): Omit<T, 'gen'> {
  const { gen, ...rest } = item as T & { gen?: unknown }
  void gen
  return rest
}
