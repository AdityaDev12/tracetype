import { useState, type ReactNode } from 'react'
import { HoverContext } from './hover.ts'

export function HoverNameProvider({ children }: { children: ReactNode }) {
  const [name, set] = useState<string | null>(null)
  return <HoverContext.Provider value={{ name, set }}>{children}</HoverContext.Provider>
}
