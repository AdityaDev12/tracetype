import { useEffect } from 'react'
import { HomePage } from './components/HomePage.tsx'
import { LessonPage } from './components/LessonPage.tsx'
import { StylePage } from './components/StylePage.tsx'
import { useRoute } from './router.ts'

export default function App() {
  const route = useRoute()
  const pageKey = route.page === 'lesson' ? `lesson:${route.id}` : route.page

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pageKey])

  return (
    <div className="app">
      <nav className="topbar">
        <a href="#/" className="brand">
          Trace<span className="accent">Type</span>
        </a>
      </nav>
      {route.page === 'home' && <HomePage />}
      {route.page === 'lesson' && <LessonPage id={route.id} mode={route.mode} />}
      {route.page === 'style' && <StylePage />}
      {route.page === 'notfound' && (
        <main className="page">
          <p>Page not found.</p>
          <a href="#/">Back to lessons</a>
        </main>
      )}
    </div>
  )
}
