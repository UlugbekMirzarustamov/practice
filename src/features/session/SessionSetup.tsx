import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { Category, Difficulty } from '../../data/prompts'
import { DIFFICULTIES } from '../../data/prompts'
import type { Format } from '../../types/flow'
import type { Mode } from '../../types/session'
import type { Stats } from '../../lib/gamification'
import type { IeltsPart } from '../../data/ielts'
import { IELTS_PARTS } from '../../data/ielts'
import { Button } from '../../components/Button'
import { OptionToggle } from '../../components/OptionToggle'
import { TextEffect } from '../../components/TextEffect'
import { GlowEffect } from '../../components/GlowEffect'
import { CategoryDropdown } from './CategoryDropdown'
import { primeAudio } from '../../lib/sound'
import { usePageMeta } from '../../lib/usePageMeta'
import { getTodaysChallenge, hasCompletedDailyChallenge, loadDailyChallengeLeaderboard, type DailyChallengeEntry } from '../../lib/dailyChallenge'
import { loadRival, type Rival } from '../../lib/rival'
import { loadRecentActivity, type RecentActivity } from '../../lib/storage'
import { loadLeaderboard, type LeaderboardEntry } from '../../lib/leaderboard'
import { useAuth } from '../../lib/auth'
import { WeekCalendarRow } from '../../components/WeekCalendarRow'

type PracticeType = 'general' | 'ielts'

type TopicSource = 'random' | 'custom'

interface SessionSetupProps {
  stats: Stats
  onStart: (category: Category, format: Format, durationMinutes: number, customTopic?: string, difficulty?: Difficulty | null) => void
  onStartIelts: (part: IeltsPart, durationMinutes: number) => void
  onStartChallenge: (mode: Mode, topic: string) => void
  onOpenLeaderboard: () => void
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function SessionSetup({ stats, onStart, onStartIelts, onStartChallenge, onOpenLeaderboard }: SessionSetupProps) {
  usePageMeta({ title: 'Dashboard — Bema', description: 'Pick your focus and start a locked writing or speaking session.' })
  const [practiceType, setPracticeType] = useState<PracticeType>('general')
  const [category, setCategory] = useState<Category>('general')
  const [format, setFormat] = useState<Format>('cuff')
  const [ieltsPart, setIeltsPart] = useState<IeltsPart>('part1')
  const [duration, setDuration] = useState(5)
  const [topicSource, setTopicSource] = useState<TopicSource>('random')
  const [customTopic, setCustomTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)

  const trimmedCustomTopic = customTopic.trim()
  const canStart = practiceType === 'ielts' || topicSource === 'random' || trimmedCustomTopic.length > 0

  const handleStart = () => {
    if (!canStart) return
    primeAudio()
    if (practiceType === 'ielts') {
      onStartIelts(ieltsPart, duration)
    } else {
      onStart(category, format, duration, topicSource === 'custom' ? trimmedCustomTopic : undefined, difficulty)
    }
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="page-inner page-inner-wide">
        <span className="wordmark">Bema</span>

        <div className="dashboard-cards-row">
          <TodaysPlanCard stats={stats} onStartChallenge={onStartChallenge} />
          <WeekStreakCard stats={stats} />
        </div>

        <div className="dashboard-cards-row">
          <DailyChallengeCard onStartChallenge={onStartChallenge} />
          <RivalCard />
        </div>

        <LeaderboardCard onOpenLeaderboard={onOpenLeaderboard} />

        <h1 className="setup-title">
          <TextEffect speedReveal={1.2} speedSegment={0.6}>
            Pick your focus.
          </TextEffect>
        </h1>
        <p className="lede">Once you start, the session locks. Leave early, or go quiet too long, and it's gone.</p>

        <div className="field">
          <span className="field-label">Practice type</span>
          <div className="option-row">
            <OptionToggle
              groupId="practice-type"
              label="General"
              tagline="Any topic, your call"
              selected={practiceType === 'general'}
              onClick={() => setPracticeType('general')}
            />
            <OptionToggle
              groupId="practice-type"
              label="IELTS Speaking"
              tagline="Real exam-style questions"
              selected={practiceType === 'ielts'}
              onClick={() => setPracticeType('ielts')}
            />
          </div>
        </div>

        {practiceType === 'general' ? (
          <>
            <div className="field">
              <span className="field-label">Topic</span>
              <div className="option-row" style={{ marginBottom: 10 }}>
                <OptionToggle
                  groupId="topic-source"
                  label="Random"
                  tagline="Bema picks for you"
                  selected={topicSource === 'random'}
                  onClick={() => setTopicSource('random')}
                />
                <OptionToggle
                  groupId="topic-source"
                  label="Your own"
                  tagline="Type a prompt"
                  selected={topicSource === 'custom'}
                  onClick={() => setTopicSource('custom')}
                />
              </div>
              {topicSource === 'random' ? (
                <CategoryDropdown value={category} onChange={setCategory} />
              ) : (
                <input
                  className="search-input"
                  placeholder="Type your own topic or prompt..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  maxLength={200}
                />
              )}
            </div>

            {topicSource === 'random' && (
              <div className="field">
                <span className="field-label">Difficulty</span>
                <div className="option-row">
                  <OptionToggle groupId="difficulty" label="Any" selected={difficulty === null} onClick={() => setDifficulty(null)} />
                  {DIFFICULTIES.map((d) => (
                    <OptionToggle
                      key={d.id}
                      groupId="difficulty"
                      label={d.label}
                      selected={difficulty === d.id}
                      onClick={() => setDifficulty(d.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <span className="field-label">Format</span>
              <div className="option-row">
                <OptionToggle
                  groupId="format"
                  label="Off the Cuff"
                  tagline="No prep, speak or write now"
                  selected={format === 'cuff'}
                  onClick={() => setFormat('cuff')}
                />
                <OptionToggle
                  groupId="format"
                  label="Deep Research"
                  tagline="Think first, then respond"
                  selected={format === 'deep'}
                  onClick={() => setFormat('deep')}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="field">
            <span className="field-label">IELTS part</span>
            <p className="option-hint">Speaking only, matching the real test format for each part.</p>
            <div className="option-row">
              {IELTS_PARTS.map((p) => (
                <OptionToggle
                  key={p.id}
                  groupId="ielts-part"
                  label={p.label}
                  tagline={p.tagline}
                  selected={ieltsPart === p.id}
                  onClick={() => setIeltsPart(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <span className="field-label">Duration</span>
          <div className="duration-slider-row">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="research-slider"
            />
            <span className="tabular research-minutes">{duration} min</span>
          </div>
        </div>

        <div className="glow-cta-wrap">
          <GlowEffect />
          <Button variant="primary" block onClick={handleStart} disabled={!canStart}>
            {practiceType === 'general' && topicSource === 'custom' ? 'Use this topic' : 'Find my topic'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function WeekStreakCard({ stats }: { stats: Stats }) {
  const [activity, setActivity] = useState<RecentActivity | null>(null)

  useEffect(() => {
    loadRecentActivity()
      .then(setActivity)
      .catch(() => setActivity({ activeDates: new Set(), hasDeepResearchToday: false }))
  }, [])

  return (
    <motion.div className="dashboard-card streak-week-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <div className="dashboard-card-top">
        <span className="dashboard-card-eyebrow">Your Streak</span>
        {stats.streakFreezes > 0 && (
          <div className="freeze-badge" title="Miss a day with a freeze available and your streak survives">
            <SnowflakeIcon />
            <span>
              {stats.streakFreezes} freeze{stats.streakFreezes === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <div className="streak-count-display">
        <span className="streak-count-number tabular">{stats.streak}</span>
        <span className="streak-count-unit">day{stats.streak === 1 ? '' : 's'}</span>
      </div>

      <WeekCalendarRow activeDates={activity?.activeDates ?? new Set()} />
    </motion.div>
  )
}

function TodaysPlanCard({ stats, onStartChallenge }: { stats: Stats; onStartChallenge: (mode: Mode, topic: string) => void }) {
  const challenge = useMemo(() => getTodaysChallenge(), [])
  const [challengeDone, setChallengeDone] = useState<boolean | null>(null)
  const [activity, setActivity] = useState<RecentActivity | null>(null)

  useEffect(() => {
    hasCompletedDailyChallenge()
      .then(setChallengeDone)
      .catch(() => setChallengeDone(false))
    loadRecentActivity()
      .then(setActivity)
      .catch(() => setActivity({ activeDates: new Set(), hasDeepResearchToday: false }))
  }, [])

  const todayUtc = new Date().toISOString().slice(0, 10)
  const sessionToday = activity?.activeDates.has(todayUtc) ?? false
  const deepResearchToday = activity?.hasDeepResearchToday ?? false

  const items = [
    {
      id: 'challenge',
      title: "Complete today's Daily Challenge",
      detail: challenge.topic,
      done: challengeDone === true,
      action: challengeDone === false ? () => onStartChallenge(challenge.mode, challenge.topic) : undefined,
      actionLabel: 'Start',
    },
    {
      id: 'streak',
      title: 'Keep your streak alive',
      detail: stats.streak > 0 ? `${stats.streak}-day streak going` : 'Start a session today',
      done: sessionToday,
      action: undefined,
      actionLabel: undefined,
    },
    {
      id: 'deep',
      title: 'Try a Deep Research session',
      detail: 'Think first, then respond',
      done: deepResearchToday,
      action: undefined,
      actionLabel: undefined,
    },
  ]

  return (
    <motion.div className="dashboard-card plan-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <span className="dashboard-card-eyebrow">Today's Plan</span>
      <div className="plan-checklist">
        {items.map((item) => (
          <div key={item.id} className={['plan-checklist-item', item.done ? 'done' : ''].filter(Boolean).join(' ')}>
            <span className={['plan-checkbox', item.done ? 'checked' : ''].filter(Boolean).join(' ')} aria-hidden="true">
              {item.done && <CheckGlyph />}
            </span>
            <div className="plan-item-body">
              <span className="plan-item-title">{item.title}</span>
              <span className="plan-item-detail">{item.detail}</span>
            </div>
            {item.action && (
              <button type="button" className="text-link" onClick={item.action}>
                {item.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function LeaderboardCard({ onOpenLeaderboard }: { onOpenLeaderboard: () => void }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    loadLeaderboard()
      .then((all) => setEntries(all.slice(0, 5)))
      .catch(() => setEntries([]))
  }, [])

  if (entries && entries.length === 0) return null

  return (
    <motion.div className="dashboard-card leaderboard-mini-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="dashboard-card-top">
        <span className="dashboard-card-eyebrow">Leaderboard</span>
        <button type="button" className="text-link" onClick={onOpenLeaderboard}>
          View all
        </button>
      </div>
      {!entries ? (
        <span className="option-hint">Loading...</span>
      ) : (
        <div className="leaderboard-list">
          {entries.map((e, i) => (
            <div key={e.userId} className={['leaderboard-row', 'compact', e.userId === user?.id ? 'you' : ''].filter(Boolean).join(' ')}>
              <span className="leaderboard-rank tabular">#{i + 1}</span>
              {e.avatarUrl ? (
                <img src={e.avatarUrl} alt={`${e.displayName}'s avatar`} className="leaderboard-avatar" />
              ) : (
                <span className="leaderboard-avatar-fallback">{nameInitials(e.displayName)}</span>
              )}
              <div className="leaderboard-identity">
                <span className="leaderboard-name">
                  <span className="leaderboard-name-text">{e.displayName}</span>
                  {e.userId === user?.id && <span className="you-badge">You</span>}
                </span>
                <span className="leaderboard-handle tabular">@{e.handle}</span>
              </div>
              <span className="leaderboard-xp tabular">{e.totalXp.toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function DailyChallengeCard({ onStartChallenge }: { onStartChallenge: (mode: Mode, topic: string) => void }) {
  const challenge = useMemo(() => getTodaysChallenge(), [])
  const [completed, setCompleted] = useState<boolean | null>(null)
  const [leaderboard, setLeaderboard] = useState<DailyChallengeEntry[] | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    hasCompletedDailyChallenge()
      .then(setCompleted)
      .catch(() => setCompleted(false))
  }, [])

  useEffect(() => {
    if (showLeaderboard && !leaderboard) {
      loadDailyChallengeLeaderboard()
        .then(setLeaderboard)
        .catch(() => setLeaderboard([]))
    }
  }, [showLeaderboard, leaderboard])

  const handleStartChallenge = () => {
    primeAudio()
    onStartChallenge(challenge.mode, challenge.topic)
  }

  return (
    <motion.div className="dashboard-card challenge-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="dashboard-card-top">
        <span className="dashboard-card-eyebrow">Today's Challenge</span>
        <span className={`mode-pill ${challenge.mode}`}>{challenge.mode}</span>
      </div>
      <p className="challenge-topic">{challenge.topic}</p>
      <div className="challenge-actions">
        <Button variant="primary" onClick={handleStartChallenge}>
          {completed ? 'Practice again' : 'Start Challenge'}
        </Button>
        {completed && <span className="challenge-completed-badge">Completed today</span>}
      </div>
      <button type="button" className="text-link" onClick={() => setShowLeaderboard((v) => !v)}>
        {showLeaderboard ? 'Hide' : "See today's"} leaderboard
      </button>
      {showLeaderboard && (
        <div className="challenge-leaderboard">
          {!leaderboard ? (
            <span className="option-hint">Loading...</span>
          ) : leaderboard.length === 0 ? (
            <span className="option-hint">No one has completed today's challenge yet. Be first.</span>
          ) : (
            leaderboard.map((e, i) => (
              <div key={e.handle} className={['challenge-leaderboard-row', e.isMe ? 'you' : ''].filter(Boolean).join(' ')}>
                <span className="tabular">#{i + 1}</span>
                <span className="challenge-leaderboard-name">
                  {e.displayName} <span className="tabular challenge-leaderboard-handle">@{e.handle}</span>
                </span>
                <span className="tabular">{e.xpEarned} XP</span>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  )
}

function RivalCard() {
  const [rival, setRival] = useState<Rival | null | undefined>(undefined)

  useEffect(() => {
    loadRival()
      .then(setRival)
      .catch(() => setRival(null))
  }, [])

  if (!rival) return null

  const gap = rival.myXp - rival.rivalXp

  return (
    <motion.div className="dashboard-card rival-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="dashboard-card-top">
        <span className="dashboard-card-eyebrow">Your Rival</span>
        <span className="tabular">Lv {rival.level}</span>
      </div>
      <div className="rival-row">
        <span className="rival-name">You</span>
        <span className="rival-vs">vs</span>
        <span className="rival-name">@{rival.handle}</span>
      </div>
      <p className="rival-gap">
        {gap === 0
          ? "You're tied right now."
          : gap > 0
            ? `You're ahead by ${gap.toLocaleString()} XP.`
            : `You're behind by ${Math.abs(gap).toLocaleString()} XP.`}
      </p>
    </motion.div>
  )
}

function SnowflakeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v20M5 6l14 12M19 6L5 18M4 12h16M8 3l4 3 4-3M8 21l4-3 4 3M3 8l3 4-3 4M21 8l-3 4 3 4" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}
