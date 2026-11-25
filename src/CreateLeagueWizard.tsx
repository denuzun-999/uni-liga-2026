import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, Layers, Plus, Shuffle, Trophy, Users } from 'lucide-react'
import { supabase } from './supabaseClient'

type WizardTeam = {
  id: number
  name: string
  short_name: string | null
  logo_url: string | null
}

const DARK_CARD =
  'relative overflow-hidden bg-gradient-to-br from-[#0B1120]/94 via-[#13203A]/94 to-[#0B1120]/94 backdrop-blur-md border border-slate-700/65 shadow-[0_14px_38px_rgba(2,6,23,0.45)] text-slate-100'

const DARK_INPUT =
  'w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-sm transition'

const DARK_SELECT =
  'w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 rounded-xl px-3.5 py-2.5 text-sm transition'

function AmbientGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        background:
          'radial-gradient(circle at 12% 14%, rgba(225,29,72,0.14), transparent 45%), radial-gradient(circle at 88% 86%, rgba(22,163,74,0.12), transparent 48%)',
      }}
    />
  )
}

function defaultGroupName(index: number) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return `Group ${letters[index] ?? index + 1}`
}

function generateRoundRobinPairs(teamIds: number[], meetingsCount: number) {
  if (teamIds.length < 2) return []
  const list = [...teamIds]
  if (list.length % 2 === 1) list.push(-1)

  const n = list.length
  const roundsPerMeeting = n - 1
  const half = n / 2
  const fixtures: Array<{ homeTeamId: number; awayTeamId: number; roundNumber: number }> = []

  for (let meeting = 0; meeting < meetingsCount; meeting++) {
    const arr = [...list]
    for (let r = 0; r < roundsPerMeeting; r++) {
      const roundNumber = meeting * roundsPerMeeting + r + 1
      for (let i = 0; i < half; i++) {
        const a = arr[i]
        const b = arr[n - 1 - i]
        if (a === -1 || b === -1) continue
        const swap = meeting % 2 === 1
        fixtures.push({
          homeTeamId: swap ? b : a,
          awayTeamId: swap ? a : b,
          roundNumber,
        })
      }
      const last = arr.pop()!
      arr.splice(1, 0, last)
    }
  }

  return fixtures
}

export default function CreateLeagueWizard({
  teams,
  isAdmin,
  refreshAll,
}: {
  teams: WizardTeam[]
  isAdmin: boolean
  refreshAll: () => Promise<void>
}) {
  const navigate = useNavigate()

  const [seriesName, setSeriesName] = useState('Uni Liga')
  const [name, setName] = useState('')
  const [type, setType] = useState<'league' | 'tournament'>('league')
  const [season, setSeason] = useState('2026/27')
  const [description, setDescription] = useState('')

  const [groupCount, setGroupCount] = useState(1)
  const [groupNames, setGroupNames] = useState<string[]>(['Group A'])
  const [meetingsCount, setMeetingsCount] = useState(1)
  const [autoGenerateFixtures, setAutoGenerateFixtures] = useState(true)
  const [pitchMode, setPitchMode] = useState<'none' | '1' | '2' | 'alternate'>('alternate')
  const [startDateTime, setStartDateTime] = useState('')

  // Map of teamId -> groupIndex (0-based)
  const [assignments, setAssignments] = useState<Record<number, number>>({})

  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const selectedTeamIds = useMemo(
    () => Object.keys(assignments).map((k) => Number(k)),
    [assignments]
  )

  function handleGroupCountChange(nextCount: number) {
    const clamped = Math.max(1, Math.min(8, nextCount))
    setGroupCount(clamped)
    setGroupNames((prev) =>
      Array.from({ length: clamped }, (_, i) => prev[i] || defaultGroupName(i))
    )
    setAssignments((prev) => {
      const updated: Record<number, number> = {}
      for (const [k, gIdx] of Object.entries(prev)) {
        updated[Number(k)] = gIdx < clamped ? gIdx : 0
      }
      return updated
    })
  }

  function toggleTeamSelection(teamId: number) {
    setAssignments((prev) => {
      const next = { ...prev }
      if (next[teamId] !== undefined) {
        delete next[teamId]
      } else {
        // Assign to the group with fewest teams currently
        const counts = Array.from({ length: groupCount }, () => 0)
        for (const gIdx of Object.values(next)) {
          if (gIdx >= 0 && gIdx < groupCount) counts[gIdx]++
        }
        let minIdx = 0
        for (let i = 1; i < counts.length; i++) {
          if (counts[i] < counts[minIdx]) minIdx = i
        }
        next[teamId] = minIdx
      }
      return next
    })
  }

  function handleSelectAllTeams() {
    const next: Record<number, number> = {}
    teams.forEach((t, idx) => {
      next[t.id] = idx % groupCount
    })
    setAssignments(next)
  }

  function handleClearSelection() {
    setAssignments({})
  }

  function handleShuffleGroups() {
    const ids = [...selectedTeamIds]
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
    }
    const next: Record<number, number> = {}
    ids.forEach((id, idx) => {
      next[id] = idx % groupCount
    })
    setAssignments(next)
  }

  const previewGroups = useMemo(() => {
    return Array.from({ length: groupCount }, (_, idx) => {
      const members = teams.filter((t) => assignments[t.id] === idx)
      return {
        index: idx,
        name: groupNames[idx] || defaultGroupName(idx),
        members,
      }
    })
  }, [groupCount, groupNames, teams, assignments])

  const estimatedMatchCount = useMemo(() => {
    if (!autoGenerateFixtures) return 0
    return previewGroups.reduce((sum, g) => {
      const k = g.members.length
      if (k < 2) return sum
      return sum + ((k * (k - 1)) / 2) * meetingsCount
    }, 0)
  }, [autoGenerateFixtures, previewGroups, meetingsCount])

  if (!isAdmin) {
    return (
      <div className={`${DARK_CARD} rounded-2xl p-7 space-y-4`}>
        <h1 className="text-xl font-bold text-white">Create League / Tournament</h1>
        <p className="text-sm text-slate-300">
          Only administrators can create new competitions.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-400 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Please enter a competition name.')
      return
    }
    if (selectedTeamIds.length < 2) {
      setErrorMsg('Please select at least 2 teams to create a competition.')
      return
    }

    setBusy(true)
    setErrorMsg(null)

    try {
      const maxPerGroup = Math.max(1, ...previewGroups.map((g) => g.members.length))

      const { data: createdLeague, error: lgErr } = await supabase
        .from('leagues')
        .insert({
          series_name: seriesName.trim() || 'Uni Liga',
          name: name.trim(),
          type,
          season: season.trim() || '2026/27',
          team_count: selectedTeamIds.length,
          group_count: groupCount,
          teams_per_group: maxPerGroup,
          meetings_count: meetingsCount,
          status: 'active',
          is_active: true,
          description: description.trim() || null,
        })
        .select()
        .single()

      if (lgErr || !createdLeague) {
        throw new Error(lgErr?.message || 'Could not create competition')
      }

      const groupRowsToInsert = previewGroups.map((g, i) => ({
        league_id: createdLeague.id,
        name: g.name.trim() || defaultGroupName(i),
        sort_order: i + 1,
      }))

      const { data: createdGroups, error: grpErr } = await supabase
        .from('groups')
        .insert(groupRowsToInsert)
        .select()

      if (grpErr || !createdGroups) {
        throw new Error(grpErr?.message || 'Could not create groups')
      }

      const sortedGroups = [...createdGroups].sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      )

      const leagueTeamRows: Array<{
        league_id: number
        group_id: number
        team_id: number
      }> = []

      previewGroups.forEach((g, idx) => {
        const dbGroup = sortedGroups[idx]
        if (!dbGroup) return
        for (const tm of g.members) {
          leagueTeamRows.push({
            league_id: createdLeague.id,
            group_id: dbGroup.id,
            team_id: tm.id,
          })
        }
      })

      if (leagueTeamRows.length > 0) {
        const { error: ltErr } = await supabase.from('league_teams').insert(leagueTeamRows)
        if (ltErr) throw new Error(ltErr.message)
      }

      if (autoGenerateFixtures) {
        const matchRows: Array<{
          league_id: number
          group_id: number
          home_team_id: number
          away_team_id: number
          home_goals: number
          away_goals: number
          status: 'scheduled'
          round_label: string
          match_date: string | null
          pitch: number | null
          stage: 'group'
        }> = []

        const baseDate = startDateTime ? new Date(startDateTime) : null
        let pitchCounter = 0

        previewGroups.forEach((g, idx) => {
          const dbGroup = sortedGroups[idx]
          if (!dbGroup || g.members.length < 2) return
          const pairs = generateRoundRobinPairs(
            g.members.map((m) => m.id),
            meetingsCount
          )

          for (const pair of pairs) {
            let pitchVal: number | null = null
            if (pitchMode === '1') pitchVal = 1
            else if (pitchMode === '2') pitchVal = 2
            else if (pitchMode === 'alternate') {
              pitchVal = (pitchCounter % 2) + 1
              pitchCounter++
            }

            let matchDateIso: string | null = null
            if (baseDate && !Number.isNaN(baseDate.getTime())) {
              const dt = new Date(baseDate.getTime())
              dt.setDate(dt.getDate() + (pair.roundNumber - 1) * 7)
              matchDateIso = dt.toISOString()
            }

            matchRows.push({
              league_id: createdLeague.id,
              group_id: dbGroup.id,
              home_team_id: pair.homeTeamId,
              away_team_id: pair.awayTeamId,
              home_goals: 0,
              away_goals: 0,
              status: 'scheduled',
              round_label:
                groupCount > 1
                  ? `${g.name} · Matchday ${pair.roundNumber}`
                  : `Matchday ${pair.roundNumber}`,
              match_date: matchDateIso,
              pitch: pitchVal,
              stage: 'group',
            })
          }
        })

        if (matchRows.length > 0) {
          const { error: mtErr } = await supabase.from('matches').insert(matchRows)
          if (mtErr) throw new Error(mtErr.message)
        }
      }

      await refreshAll()
      navigate(`/leagues/${createdLeague.id}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create competition')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] bg-[#0B1120]/90 backdrop-blur-md border border-slate-700/70 text-slate-200 hover:text-white hover:border-slate-500 px-3.5 py-2 rounded-xl shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Panel
        </Link>
      </div>

      <div className={`${DARK_CARD} rounded-2xl px-6 sm:px-8 py-6`}>
        <AmbientGlow />
        <div className="relative z-10 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-rose-400">
            COMPETITION WIZARD
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-white">
            Create New League or Tournament
          </h1>
          <p className="text-sm text-slate-400">
            Configure groups, assign teams, and optionally auto-generate round-robin fixtures. You can add custom matches or a knockout bracket anytime afterwards.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/15 border border-red-400/40 text-red-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Competition Info */}
        <section className={`${DARK_CARD} rounded-2xl p-6 sm:p-7 space-y-5`}>
          <AmbientGlow />
          <div className="relative z-10 flex items-center gap-2 border-b border-white/10 pb-3">
            <Trophy className="w-4 h-4 text-rose-400" />
            <h2 className="text-base font-bold text-white">1. Competition Details</h2>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Competition Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Uni Liga 2026/27 Wintersemester"
                className={DARK_INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Series Name
              </label>
              <input
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="Uni Liga"
                className={DARK_INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Season</label>
              <input
                type="text"
                required
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2026/27"
                className={DARK_INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Format</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'league' | 'tournament')}
                className={DARK_SELECT}
              >
                <option value="league" className="bg-[#0B1120] text-white">
                  League (Group Stage)
                </option>
                <option value="tournament" className="bg-[#0B1120] text-white">
                  Tournament / Cup
                </option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note about format, matchday rules, or pitch location..."
                className={DARK_INPUT}
              />
            </div>
          </div>
        </section>

        {/* Step 2: Groups & Fixtures */}
        <section className={`${DARK_CARD} rounded-2xl p-6 sm:p-7 space-y-5`}>
          <AmbientGlow />
          <div className="relative z-10 flex items-center gap-2 border-b border-white/10 pb-3">
            <Layers className="w-4 h-4 text-rose-400" />
            <h2 className="text-base font-bold text-white">2. Groups & Fixture Settings</h2>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Number of Groups
              </label>
              <select
                value={groupCount}
                onChange={(e) => handleGroupCountChange(Number(e.target.value))}
                className={DARK_SELECT}
              >
                {[1, 2, 3, 4, 6, 8].map((n) => (
                  <option key={n} value={n} className="bg-[#0B1120] text-white">
                    {n} {n === 1 ? 'Group' : 'Groups'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Meetings per Pair
              </label>
              <select
                value={meetingsCount}
                onChange={(e) => setMeetingsCount(Number(e.target.value))}
                className={DARK_SELECT}
              >
                <option value={1} className="bg-[#0B1120] text-white">
                  1x (Single Round-Robin)
                </option>
                <option value={2} className="bg-[#0B1120] text-white">
                  2x (Home & Away)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Default Pitch Assignment
              </label>
              <select
                value={pitchMode}
                onChange={(e) =>
                  setPitchMode(e.target.value as 'none' | '1' | '2' | 'alternate')
                }
                className={DARK_SELECT}
              >
                <option value="alternate" className="bg-[#0B1120] text-white">
                  Alternate Pitch 1 & Pitch 2
                </option>
                <option value="1" className="bg-[#0B1120] text-white">
                  Pitch 1 Only
                </option>
                <option value="2" className="bg-[#0B1120] text-white">
                  Pitch 2 Only
                </option>
                <option value="none" className="bg-[#0B1120] text-white">
                  No Pitch Assigned
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                First Matchday Date (Opt.)
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className={DARK_INPUT}
              />
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {groupNames.map((gName, idx) => (
              <div key={idx}>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Group #{idx + 1} Label
                </label>
                <input
                  type="text"
                  value={gName}
                  onChange={(e) => {
                    const val = e.target.value
                    setGroupNames((prev) => prev.map((item, i) => (i === idx ? val : item)))
                  }}
                  className={DARK_INPUT}
                />
              </div>
            ))}
          </div>

          <label className="relative z-10 inline-flex items-center gap-2.5 text-xs font-semibold text-slate-200 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={autoGenerateFixtures}
              onChange={(e) => setAutoGenerateFixtures(e.target.checked)}
              className="rounded accent-[#D50C2F]"
            />
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            Automatically generate group fixtures ({estimatedMatchCount} matches)
          </label>
        </section>

        {/* Step 3: Team Selection & Group Assignment */}
        <section className={`${DARK_CARD} rounded-2xl p-6 sm:p-7 space-y-5`}>
          <AmbientGlow />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-400" />
              <h2 className="text-base font-bold text-white">
                3. Select Teams & Assign Groups ({selectedTeamIds.length} Selected)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllTeams}
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Select All ({teams.length})
              </button>
              <button
                type="button"
                disabled={selectedTeamIds.length < 2}
                onClick={handleShuffleGroups}
                className="bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle Groups
              </button>
              {selectedTeamIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/25 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative z-10">
            {teams.length === 0 ? (
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 text-sm text-slate-300 flex flex-wrap items-center justify-between gap-3">
                <span>No teams registered yet. Add teams in the Admin Panel first.</span>
                <Link
                  to="/admin"
                  className="bg-[#D50C2F] text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Go to Admin Panel
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map((tm) => {
                  const assignedIdx = assignments[tm.id]
                  const isSelected = assignedIdx !== undefined

                  return (
                    <div
                      key={tm.id}
                      className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 transition ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-400/45'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTeamSelection(tm.id)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-[#16A34A] border-[#16A34A] text-white'
                              : 'border-slate-500 bg-[#070D1B]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div className="w-9 h-9 rounded-full bg-white border border-white/25 overflow-hidden flex items-center justify-center shrink-0">
                          {tm.logo_url ? (
                            <img
                              src={tm.logo_url}
                              alt={tm.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-[#0B1120]">
                              {(tm.short_name || tm.name.slice(0, 2)).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <span className="text-sm font-semibold text-white truncate">{tm.name}</span>
                      </button>

                      {isSelected && groupCount > 1 && (
                        <select
                          value={assignedIdx}
                          onChange={(e) =>
                            setAssignments((prev) => ({
                              ...prev,
                              [tm.id]: Number(e.target.value),
                            }))
                          }
                          className="bg-[#070D1B] border border-white/15 rounded-lg px-2 py-1 text-xs text-slate-200 shrink-0"
                        >
                          {groupNames.map((gName, idx) => (
                            <option key={idx} value={idx} className="bg-[#0B1120] text-white">
                              {gName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Group Preview */}
          {selectedTeamIds.length > 0 && (
            <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewGroups.map((grp) => (
                <div
                  key={grp.index}
                  className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{grp.name}</span>
                    <span className="text-slate-400">
                      {grp.members.length} {grp.members.length === 1 ? 'Team' : 'Teams'}
                    </span>
                  </div>
                  {grp.members.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No teams assigned</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-slate-300">
                      {grp.members.map((m) => (
                        <li key={m.id} className="truncate">
                          • {m.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit Bar */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            to="/admin"
            className="bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy || selectedTeamIds.length < 2}
            className="bg-[#D50C2F] hover:bg-[#b80927] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            {busy ? 'Creating Competition...' : 'Create Competition'}
          </button>
        </div>
      </form>
    </div>
  )
}