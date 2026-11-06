// Zachary Allarey Code Section
// helpers for the weekly schedule view

// uf fall/spring class periods
export const PERIODS = [
  { id: '1', label: 'P1', start: '7:25', end: '8:15' },
  { id: '2', label: 'P2', start: '8:30', end: '9:20' },
  { id: '3', label: 'P3', start: '9:35', end: '10:25' },
  { id: '4', label: 'P4', start: '10:40', end: '11:30' },
  { id: '5', label: 'P5', start: '11:45', end: '12:35' },
  { id: '6', label: 'P6', start: '12:50', end: '1:40' },
  { id: '7', label: 'P7', start: '1:55', end: '2:45' },
  { id: '8', label: 'P8', start: '3:00', end: '3:50' },
  { id: '9', label: 'P9', start: '4:05', end: '4:55' },
  { id: '10', label: 'P10', start: '5:10', end: '6:00' },
  { id: '11', label: 'P11', start: '6:15', end: '7:05' },
  { id: 'E1', label: 'E1', start: '7:20', end: '8:10' },
  { id: 'E2', label: 'E2', start: '8:20', end: '9:10' },
  { id: 'E3', label: 'E3', start: '9:20', end: '10:10' },
]

export const DAYS = [
  { id: 'M', label: 'Mon' },
  { id: 'T', label: 'Tue' },
  { id: 'W', label: 'Wed' },
  { id: 'R', label: 'Thu' },
  { id: 'F', label: 'Fri' },
]

const periodIndex = Object.fromEntries(PERIODS.map((p, i) => [p.id, i]))
const dayIndexMap = Object.fromEntries(DAYS.map((d, i) => [d.id, i]))

// one.uf sends days as ["M","W","F"] or sometimes "MWF"
function normalizeDays(days) {
  const list = Array.isArray(days) ? days : String(days || '').split('')
  return list.map((d) => String(d).trim().toUpperCase()).filter((d) => d in dayIndexMap)
}

// turns a period like "4" or "E1" into a row index, null if unknown
function toPeriodIndex(value) {
  if (value === null || value === undefined) return null
  const key = String(value).trim().toUpperCase()
  return key in periodIndex ? periodIndex[key] : null
}

// flattens a section's meeting times into blocks: { day, start, end, building, room }
export function sectionBlocks(section) {
  const blocks = []
  for (const meet of section?.meetTimes || []) {
    const start = toPeriodIndex(meet.periodBegin)
    const end = toPeriodIndex(meet.periodEnd ?? meet.periodBegin)
    if (start === null || end === null) continue
    for (const day of normalizeDays(meet.days)) {
      blocks.push({
        day: dayIndexMap[day],
        start: Math.min(start, end),
        end: Math.max(start, end),
        building: meet.building,
        room: meet.room,
      })
    }
  }
  return blocks
}

// short text like "MWF P4 · TR P6–P7"
export function describeSection(section) {
  const parts = (section?.meetTimes || [])
    .map((meet) => {
      const days = normalizeDays(meet.days).join('')
      const start = toPeriodIndex(meet.periodBegin)
      const end = toPeriodIndex(meet.periodEnd ?? meet.periodBegin)
      if (!days || start === null) return null
      const range =
        end !== null && end !== start
          ? `${PERIODS[start].label}–${PERIODS[end].label}`
          : PERIODS[start].label
      return `${days} ${range}`
    })
    .filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Online / TBA'
}

// finds overlapping courses, one entry per pair like
// { codes: ["CDA 3101", "CAP 4630"], ids: [...], days: "Mon, Wed, Fri", period: "P4" }
export function findConflicts(placed) {
  const byPair = new Map()
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i]
      const b = placed[j]
      if (a.courseId === b.courseId || a.day !== b.day) continue
      if (a.start > b.end || b.start > a.end) continue

      const key = [a.courseId, b.courseId].sort().join('|')
      if (!byPair.has(key)) {
        byPair.set(key, {
          codes: [a.code, b.code],
          ids: [a.courseId, b.courseId],
          dayIndexes: new Set(),
          period: PERIODS[Math.max(a.start, b.start)].label,
        })
      }
      byPair.get(key).dayIndexes.add(a.day)
    }
  }

  return [...byPair.values()].map((c) => ({
    ...c,
    days: [...c.dayIndexes].sort().map((d) => DAYS[d].label).join(', '),
  }))
}