import { lazy, Suspense, useEffect } from 'react'
import { HeroPage } from './landing/HeroPage.tsx'
import { CoursePage, TrackPage } from './pages/CoursePages.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { TopBar, XpToaster } from './pages/Shell.tsx'
import { hasProgress, useProgress } from './progress/store.ts'
import { useRoute } from './router.ts'

// Pages with the code editor or Python load only when opened, so the landing
// page stays light.
const LessonPage = lazy(() => import('./lesson/LessonPage.tsx').then((m) => ({ default: m.LessonPage })))
const PracticePages = () => import('./pages/PracticePages.tsx')
const ReviewPage = lazy(() => PracticePages().then((m) => ({ default: m.ReviewPage })))
const UnitReviewPage = lazy(() => PracticePages().then((m) => ({ default: m.UnitReviewPage })))
const ProjectPage = lazy(() => PracticePages().then((m) => ({ default: m.ProjectPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })))
const StylePage = lazy(() => import('./components/StylePage.tsx').then((m) => ({ default: m.StylePage })))

const loading = (
  <main className="page">
    <p className="box-label">{'> loading...'}</p>
  </main>
)

export default function App() {
  const route = useRoute()
  const progress = useProgress()
  const pageKey = 'id' in route ? `${route.page}:${route.id}` : route.page

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pageKey])

  let page
  switch (route.page) {
    case 'home':
      // New visitors see the landing page, returning ones their dashboard.
      page = hasProgress(progress) ? <Dashboard /> : <HeroPage />
      break
    case 'welcome':
      page = <HeroPage />
      break
    case 'course':
      page = <CoursePage />
      break
    case 'track':
      page = <TrackPage id={route.id} />
      break
    case 'lesson':
      page = <LessonPage id={route.id} step={route.step} />
      break
    case 'project':
      page = <ProjectPage id={route.id} />
      break
    case 'unit-review':
      page = <UnitReviewPage id={route.id} />
      break
    case 'review':
      page = <ReviewPage />
      break
    case 'settings':
      page = <SettingsPage />
      break
    case 'style':
      page = <StylePage />
      break
    default:
      page = <NotFound />
  }

  return (
    <div className={`app${progress.settings.texture ? ' grain' : ''}`}>
      <a href="#main" className="skip-link" onClick={(e) => (e.preventDefault(), document.querySelector('main')?.focus())}>
        Skip to content
      </a>
      <TopBar route={route} />
      <Suspense fallback={loading}>{page}</Suspense>
      <XpToaster />
    </div>
  )
}
