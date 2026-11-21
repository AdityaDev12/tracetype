import { createContext, useContext } from 'react'

// Hover-link: hover (or tap) a name in the code and its memory box lights up,
// and the other way round. One provider per step layout (HoverName.tsx).

export interface HoverCtx {
  name: string | null
  set: (name: string | null) => void
}

export const HoverContext = createContext<HoverCtx>({ name: null, set: () => {} })

export function useHoverName(): HoverCtx {
  return useContext(HoverContext)
}

/** Props that make an element take part in hover-link for `name`. */
export function useHoverProps(name: string) {
  const h = useHoverName()
  return {
    onMouseEnter: () => h.set(name),
    onMouseLeave: () => h.set(null),
    onFocus: () => h.set(name),
    onBlur: () => h.set(null),
    'data-hl': h.name === name ? 'on' : undefined,
  }
}
