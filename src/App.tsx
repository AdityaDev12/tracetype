import { useEffect } from 'react'
import { Logo } from './brand/Logo.tsx'
import { LessonPage } from './components/LessonPage.tsx'
import { StylePage } from './components/StylePage.tsx'
import { HeroPage } from './landing/HeroPage.tsx'
import { useRoute } from './router.ts'

export default function App() {
  const route = useRoute()
  const pageKey = route.page === 'lesson' ? `lesson:${route.id}` : route.page

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pageKey])

  return (
    <div className="app grain">
      <nav className="topbar">
        <a href="#/" className="brand" aria-label="TraceType home">
          <Logo height={22} />
        </a>
      </nav>
      {route.page === 'home' && <HeroPage />}
      {route.page === 'lesson' && <LessonPage id={route.id} />}
      {route.page === 'style' && <StylePage />}
      {route.page === 'hero' && <HeroPage />}
      {route.page === 'notfound' && (
        <main className="page">
          <p>Page not found.</p>
          <a href="#/">Back to lessons</a>
        </main>
      )}
    </div>
  )
}
