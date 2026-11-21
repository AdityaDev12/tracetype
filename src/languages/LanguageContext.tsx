import { createContext, useContext } from 'react'
import { languagePack, type LanguagePack } from './index.ts'

/** The language of the code on screen. Lesson pages set it from lesson.language. */
export const LanguageContext = createContext<string>('python')

export function useLanguagePack(): LanguagePack {
  return languagePack(useContext(LanguageContext))
}
