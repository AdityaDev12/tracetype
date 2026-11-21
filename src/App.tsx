import { lazy, Suspense, useEffect } from 'react'
import { Logo } from './brand/Logo.tsx'
import { HeroPage } from './landing/HeroPage.tsx'
import { useRoute } from './router.ts'

// Heavier pages (the lesson page brings the code editor) load only when opened,
// so the landing page stays light.
const LessonPage = lazy(() => import('./lesson/LessonPage.tsx').then((m) => ({ default: m.LessonPage })))
const StylePage = lazy(() => import('./components/StylePage.tsx').then((m) => ({ default: m.StylePage })))
const loading = <p className="page box-label">{'> loading...'}</p>

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
      <Suspense fallback={loading}>
        {route.page === 'lesson' && <LessonPage id={route.id} step={route.step} />}
        {route.page === 'style' && <StylePage />}
      </Suspense>
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
