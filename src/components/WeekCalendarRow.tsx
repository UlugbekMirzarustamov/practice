const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface WeekCalendarRowProps {
  activeDates: Set<string>
}

/** Sun-Sat row, today ringed, days with at least one completed session filled in. UTC-based, matching the rest of the streak system. */
export function WeekCalendarRow({ activeDates }: WeekCalendarRowProps) {
  const today = new Date()
  const todayIndex = today.getUTCDay()
  const days = DAY_LABELS.map((label, i) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - todayIndex + i))
    return { label, dateStr: d.toISOString().slice(0, 10), isToday: i === todayIndex, isFuture: i > todayIndex }
  })

  return (
    <div className="week-calendar">
      {days.map((d) => {
        const active = activeDates.has(d.dateStr)
        return (
          <div key={d.dateStr} className={['week-calendar-day', d.isToday ? 'today' : '', d.isFuture ? 'future' : ''].filter(Boolean).join(' ')}>
            <span className="week-calendar-day-label">{d.label}</span>
            <span className={['week-calendar-dot', active ? 'active' : ''].filter(Boolean).join(' ')} />
          </div>
        )
      })}
    </div>
  )
}
