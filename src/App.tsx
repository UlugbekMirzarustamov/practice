import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ScrollProgress } from './components/ScrollProgress'
import type { Mode, Session, SessionFeedback } from './types/session'
import type { Category } from './data/prompts'
import type { Format } from './types/flow'
import type { IeltsPart } from './data/ielts'
import { getRandomPrompt } from './data/prompts'
import { getRandomIeltsTopicGroup, formatIeltsTopicGroup, getRandomIeltsPart2, formatIeltsPart2 } from './data/ielts'
import { createSession } from './lib/storage'
import { loadDraft, saveDraft, clearDraft, type Draft } from './lib/drafts'
import { loadSidebarCollapsedDefault, saveSidebarCollapsedDefault } from './lib/uiPrefs'
import { loadStats, type Stats } from './lib/gamification'
import { type Theme, loadTheme, saveTheme, applyTheme } from './lib/theme'
import { loadProfile, type Profile } from './lib/profile'
import { primeAudio } from './lib/sound'
import { useAuth } from './lib/auth'
import { AuthPage } from './features/auth/AuthPage'
import { LandingPage } from './features/landing/LandingPage'
import { TrialPicker, TrialComplete, TrialFailed } from './features/landing/TrialFlow'
import { PublicSessionPage } from './features/share/PublicSessionPage'
import { PrivacyPolicyPage } from './features/share/PrivacyPolicyPage'
import { NotFoundPage } from './features/share/NotFoundPage'
import { Sidebar, type SidebarDest } from './components/Sidebar'
import { SessionSetup } from './features/session/SessionSetup'
import { TopicReveal, type StartOptions } from './features/session/TopicReveal'
import { ResearchPhase } from './features/session/ResearchPhase'
import { SessionLock } from './features/session/SessionLock'
import { SessionFeedbackReport } from './features/session/SessionFeedbackReport'
import { SessionComplete } from './features/session/SessionComplete'
import { SessionFailed } from './features/session/SessionFailed'
import { ArchiveList } from './features/archive/ArchiveList'
import { ArchiveDetail } from './features/archive/ArchiveDetail'
import { ProfilePage } from './features/profile/ProfilePage'
import { LeaderboardPage } from './features/leaderboard/LeaderboardPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { AdminPage } from './features/admin/AdminPage'

type Screen =
  | { name: 'setup' }
  | {
      name: 'revealing'
      category: Category
      format: Format
      ielts?: IeltsPart
      ieltsQuestions?: string[]
      ieltsTopicLabel?: string
      durationMinutes: number
      topic: string
    }
  | {
      name: 'researching'
      mode: Mode
      category: Category
      format: Format
      ielts?: IeltsPart
      ieltsQuestions?: string[]
      ieltsTopicLabel?: string
      durationMinutes: number
      dangerEnabled: boolean
      dangerSeconds: number
      topic: string
      researchMinutes: number
    }
  | {
      name: 'locked'
      mode: Mode
      category: Category
      format: Format
      ielts?: IeltsPart
      ieltsQuestions?: string[]
      ieltsTopicLabel?: string
      durationMinutes: number
      dangerEnabled: boolean
      dangerSeconds: number
      topic: string
      initialContent?: string
      initialSecondsLeft?: number
    }
  | { name: 'feedback'; session: Session; prevStats: Stats; nextStats: Stats; wasFirstEver: boolean }
  | { name: 'complete'; session: Session; prevStats: Stats; nextStats: Stats; wasFirstEver: boolean }
  | { name: 'failed' }
  | { name: 'archive' }
  | { name: 'archiveDetail'; session: Session }
  | { name: 'leaderboard' }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'admin' }

const FOCUS_SCREENS: Screen['name'][] = ['revealing', 'researching', 'locked']

function sidebarDestFor(screen: Screen): SidebarDest {
  if (screen.name === 'archive' || screen.name === 'archiveDetail') return 'archive'
  if (screen.name === 'leaderboard') return 'leaderboard'
  if (screen.name === 'profile') return 'profile'
  if (screen.name === 'settings') return 'settings'
  if (screen.name === 'admin') return 'admin'
  return 'dashboard'
}

function LoadingScreen() {
  return (
    <div className="app-shell">
      <div className="app-main">
        <div className="page">
          <div className="page-inner">
            <span className="wordmark">Bema</span>
            <p className="lede">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  const [screen, setScreen] = useState<Screen>({ name: 'setup' })
  const [theme, setTheme] = useState<Theme>(() => loadTheme())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadSidebarCollapsedDefault())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [bootLoading, setBootLoading] = useState(true)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    Promise.all([loadProfile(), loadStats(), loadDraft()]).then(([p, s, d]) => {
      if (cancelled) return
      setProfile(p)
      setStats(s)
      setDraft(d)
      setBootLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const refreshStats = async () => {
    const next = await loadStats()
    setStats(next)
    return next
  }

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((c) => {
      const next = !c
      saveSidebarCollapsedDefault(next)
      return next
    })
  }

  const handlePickTopic = async (category: Category, format: Format, durationMinutes: number) => {
    await clearDraft()
    setDraft(null)
    setScreen({ name: 'revealing', category, format, durationMinutes, topic: getRandomPrompt(category) })
  }

  const handlePickIelts = async (part: IeltsPart, durationMinutes: number) => {
    await clearDraft()
    setDraft(null)
    const sequential = part === 'part1' || part === 'part3'
    const group = sequential ? getRandomIeltsTopicGroup(part) : null
    const topic = sequential ? formatIeltsTopicGroup(group!) : formatIeltsPart2(getRandomIeltsPart2())
    setScreen({
      name: 'revealing',
      category: 'general',
      format: 'cuff',
      ielts: part,
      ieltsQuestions: group?.questions,
      ieltsTopicLabel: group?.topic,
      durationMinutes,
      topic,
    })
  }

  const handleSessionStart = (mode: Mode, topic: string, opts: StartOptions) => {
    if (screen.name !== 'revealing') return
    setScreen({
      name: 'locked',
      mode,
      category: screen.category,
      format: screen.format,
      ielts: screen.ielts,
      ieltsQuestions: opts.ieltsQuestions,
      ieltsTopicLabel: opts.ieltsTopicLabel,
      durationMinutes: screen.durationMinutes,
      dangerEnabled: opts.dangerEnabled,
      dangerSeconds: opts.dangerSeconds,
      topic,
    })
  }

  const handleResearchStart = (mode: Mode, topic: string, researchMinutes: number, opts: StartOptions) => {
    if (screen.name !== 'revealing') return
    setScreen({
      name: 'researching',
      mode,
      category: screen.category,
      format: screen.format,
      ielts: screen.ielts,
      ieltsQuestions: opts.ieltsQuestions,
      ieltsTopicLabel: opts.ieltsTopicLabel,
      durationMinutes: screen.durationMinutes,
      dangerEnabled: opts.dangerEnabled,
      dangerSeconds: opts.dangerSeconds,
      topic,
      researchMinutes,
    })
  }

  const handleResearchDone = () => {
    if (screen.name !== 'researching') return
    setScreen({
      name: 'locked',
      mode: screen.mode,
      category: screen.category,
      format: screen.format,
      ielts: screen.ielts,
      ieltsQuestions: screen.ieltsQuestions,
      ieltsTopicLabel: screen.ieltsTopicLabel,
      durationMinutes: screen.durationMinutes,
      dangerEnabled: screen.dangerEnabled,
      dangerSeconds: screen.dangerSeconds,
      topic: screen.topic,
    })
  }

  const handleComplete = async (content: string, feedback: SessionFeedback, verifiedUnaided: boolean) => {
    if (screen.name !== 'locked') return
    await clearDraft()
    setDraft(null)
    const prevStats = stats ?? (await loadStats())
    const wasFirstEver = prevStats.sessionCount === 0

    const session = await createSession({
      mode: screen.mode,
      category: screen.ielts ? (`ielts-${screen.ielts}` as const) : screen.category,
      format: screen.format,
      ieltsPart: screen.ielts,
      topic: screen.topic,
      durationMinutes: screen.durationMinutes,
      content,
      feedback,
      verifiedUnaided,
    })

    const nextStats = await refreshStats()
    setScreen({ name: 'feedback', session, prevStats, nextStats, wasFirstEver })
  }

  const handleFail = async () => {
    await clearDraft()
    setDraft(null)
    setScreen({ name: 'failed' })
  }

  const handlePause = async (content: string, secondsLeft: number, ieltsQuestions?: string[], ieltsTopicLabel?: string) => {
    if (screen.name !== 'locked') return
    await saveDraft({
      mode: screen.mode,
      topic: screen.topic,
      category: screen.category,
      format: screen.format,
      ielts: screen.ielts,
      ieltsQuestions,
      ieltsTopicLabel,
      durationMinutes: screen.durationMinutes,
      dangerEnabled: screen.dangerEnabled,
      dangerSeconds: screen.dangerSeconds,
      content,
      secondsLeft,
    })
    setDraft(await loadDraft())
    setScreen({ name: 'setup' })
  }

  const handleLeaveNeutral = () => setScreen({ name: 'setup' })

  const handleResumeDraft = (d: Draft) => {
    clearDraft()
    setDraft(null)
    setScreen({
      name: 'locked',
      mode: d.mode,
      category: d.category,
      format: d.format,
      ielts: d.ielts,
      ieltsQuestions: d.ieltsQuestions,
      ieltsTopicLabel: d.ieltsTopicLabel,
      durationMinutes: d.durationMinutes,
      dangerEnabled: d.dangerEnabled,
      dangerSeconds: d.dangerSeconds,
      topic: d.topic,
      initialContent: d.content,
      initialSecondsLeft: d.secondsLeft,
    })
  }

  const handleDiscardDraft = async () => {
    await clearDraft()
    setDraft(null)
  }

  const handleReset = () => setScreen({ name: 'setup' })
  const goArchive = () => setScreen({ name: 'archive' })

  const handleSidebarNavigate = (dest: SidebarDest) => {
    if (dest === 'dashboard') setScreen({ name: 'setup' })
    else if (dest === 'archive') setScreen({ name: 'archive' })
    else if (dest === 'leaderboard') setScreen({ name: 'leaderboard' })
    else if (dest === 'profile') setScreen({ name: 'profile' })
    else if (dest === 'settings') setScreen({ name: 'settings' })
    else if (dest === 'admin') setScreen({ name: 'admin' })
  }

  const showSidebar = !FOCUS_SCREENS.includes(screen.name)

  if (bootLoading || !profile || !stats) return <LoadingScreen />

  return (
    <div className="app-shell">
      {showSidebar && (
        <Sidebar
          active={sidebarDestFor(screen)}
          onNavigate={handleSidebarNavigate}
          profile={profile}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      )}

      <div className="app-main" ref={mainRef}>
        <ScrollProgress containerRef={mainRef} />
        <AnimatePresence mode="wait">
          {screen.name === 'setup' && (
            <SessionSetup key="setup" stats={stats} onStart={handlePickTopic} onStartIelts={handlePickIelts} />
          )}

          {screen.name === 'revealing' && (
            <TopicReveal
              key="revealing"
              initialTopic={screen.topic}
              category={screen.category}
              format={screen.format}
              ielts={screen.ielts}
              initialIeltsQuestions={screen.ieltsQuestions}
              initialIeltsTopicLabel={screen.ieltsTopicLabel}
              onLeave={handleReset}
              onStart={handleSessionStart}
              onResearch={handleResearchStart}
            />
          )}

          {screen.name === 'researching' && (
            <ResearchPhase
              key="researching"
              topic={screen.topic}
              minutes={screen.researchMinutes}
              ielts={Boolean(screen.ielts)}
              onDone={handleResearchDone}
            />
          )}

          {screen.name === 'locked' && (
            <SessionLock
              key="locked"
              mode={screen.mode}
              topic={screen.topic}
              durationMinutes={screen.durationMinutes}
              dangerEnabled={screen.dangerEnabled}
              dangerSeconds={screen.dangerSeconds}
              ielts={screen.ielts}
              ieltsQuestions={screen.ieltsQuestions}
              ieltsTopicLabel={screen.ieltsTopicLabel}
              initialContent={screen.initialContent}
              initialSecondsLeft={screen.initialSecondsLeft}
              onComplete={handleComplete}
              onFail={handleFail}
              onPause={handlePause}
              onLeaveNeutral={handleLeaveNeutral}
            />
          )}

          {screen.name === 'feedback' && (
            <SessionFeedbackReport
              key="feedback"
              session={screen.session}
              onContinue={() =>
                setScreen({
                  name: 'complete',
                  session: screen.session,
                  prevStats: screen.prevStats,
                  nextStats: screen.nextStats,
                  wasFirstEver: screen.wasFirstEver,
                })
              }
            />
          )}

          {screen.name === 'complete' && (
            <SessionComplete
              key="complete"
              session={screen.session}
              prevStats={screen.prevStats}
              nextStats={screen.nextStats}
              wasFirstEver={screen.wasFirstEver}
              onDone={handleReset}
            />
          )}

          {screen.name === 'failed' && <SessionFailed key="failed" onDone={handleReset} />}

          {screen.name === 'archive' && (
            <ArchiveList
              key="archive"
              draft={draft}
              onResumeDraft={handleResumeDraft}
              onDiscardDraft={handleDiscardDraft}
              onSelect={(session) => setScreen({ name: 'archiveDetail', session })}
            />
          )}

          {screen.name === 'archiveDetail' && <ArchiveDetail key="archiveDetail" session={screen.session} onBack={goArchive} />}

          {screen.name === 'leaderboard' && <LeaderboardPage key="leaderboard" />}

          {screen.name === 'profile' && <ProfilePage key="profile" />}

          {screen.name === 'settings' && (
            <SettingsPage
              key="settings"
              theme={theme}
              onToggleTheme={toggleTheme}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebarCollapsed={toggleSidebarCollapsed}
              profile={profile}
            />
          )}

          {screen.name === 'admin' && profile.isAdmin && <AdminPage key="admin" />}
        </AnimatePresence>
      </div>
    </div>
  )
}

type PublicView =
  | { name: 'landing' }
  | { name: 'auth' }
  | { name: 'trialPicker' }
  | { name: 'trialActive'; mode: Mode; topic: string }
  | { name: 'trialComplete'; mode: Mode; topic: string; content: string }
  | { name: 'trialFailed'; mode?: Mode; topic?: string; content?: string }

function App() {
  const { user, loading } = useAuth()
  const [publicView, setPublicView] = useState<PublicView>({ name: 'landing' })

  const pathname = window.location.pathname
  const goHomePath = () => {
    window.history.pushState({}, '', '/')
    setPublicView({ name: 'landing' })
  }

  const shareMatch = pathname.match(/^\/s\/([^/]+)$/)
  if (shareMatch) {
    return (
      <PublicSessionPage
        sessionId={shareMatch[1]}
        onTryFree={() => {
          window.history.pushState({}, '', '/')
          setPublicView({ name: 'trialPicker' })
        }}
      />
    )
  }

  if (pathname === '/privacy') {
    return <PrivacyPolicyPage onHome={goHomePath} />
  }

  if (pathname !== '/') {
    return <NotFoundPage onHome={goHomePath} />
  }

  if (loading) return <LoadingScreen />
  if (user) return <AuthenticatedApp />

  const goLanding = () => setPublicView({ name: 'landing' })

  if (publicView.name === 'auth') return <AuthPage />

  if (publicView.name === 'trialPicker') {
    return (
      <TrialPicker
        onPick={(mode) => {
          primeAudio()
          setPublicView({ name: 'trialActive', mode, topic: getRandomPrompt('general') })
        }}
        onBack={goLanding}
      />
    )
  }

  if (publicView.name === 'trialActive') {
    const { mode, topic } = publicView
    return (
      <SessionLock
        mode={mode}
        topic={topic}
        durationMinutes={3}
        dangerEnabled={false}
        dangerSeconds={30}
        disablePause
        onComplete={(content) => setPublicView({ name: 'trialComplete', mode, topic, content })}
        onFail={() => setPublicView({ name: 'trialFailed' })}
        onPause={() => {}}
        onLeaveNeutral={goLanding}
        onLeaveTimeout={(content) => setPublicView({ name: 'trialFailed', mode, topic, content })}
      />
    )
  }

  if (publicView.name === 'trialComplete') {
    return (
      <TrialComplete
        mode={publicView.mode}
        topic={publicView.topic}
        content={publicView.content}
        onSignUp={() => setPublicView({ name: 'auth' })}
        onBack={goLanding}
      />
    )
  }

  if (publicView.name === 'trialFailed') {
    return (
      <TrialFailed
        mode={publicView.mode}
        topic={publicView.topic}
        content={publicView.content}
        onRetry={() => setPublicView({ name: 'trialPicker' })}
        onSignUp={() => setPublicView({ name: 'auth' })}
        onBack={goLanding}
      />
    )
  }

  return <LandingPage onEnter={() => setPublicView({ name: 'auth' })} onTryFree={() => setPublicView({ name: 'trialPicker' })} />
}

export default App
