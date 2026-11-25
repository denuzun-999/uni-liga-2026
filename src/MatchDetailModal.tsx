import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Award, Calendar, Check, MapPin, Plus, Target, Trash2, X } from 'lucide-react'
import { supabase } from './supabaseClient'

export type ModalTeam = {
  id: number
  name: string
  short_name: string | null
  logo_url: string | null
  captain_id: string | null
}

export type ModalMatch = {
  id: number
  league_id: number | null
  group_id: number | null
  home_team_id: number
  away_team_id: number
  home_goals: number
  away_goals: number
  status: 'scheduled' | 'played'
  round_label: string | null
  match_date: string | null
  pitch: number | null
}

export type ModalPlayer = {
  id: number
  team_id: number | null
  full_name: string
  jersey_number: number | null
  goals: number
}

export type MatchGoalRow = {
  id: number
  match_id: number
  league_id: number | null
  player_id: number
  team_id: number
  minute: number | null
  period_key: string
}

export type MatchAssistRow = {
  id: number
  match_id: number
  league_id: number | null
  player_id: number
  team_id: number
  minute: number | null
  period_key: string
}

const DARK_INPUT =
  'w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 placeholder:text-slate-500 rounded-lg px-2.5 py-2 text-xs transition'

export function getCurrentPeriodKey(date = new Date()) {
  const year = date.getFullYear()
  const half = date.getMonth() < 6 ? 'H1' : 'H2'
  return `${year}-${half}`
}

export function formatPeriodLabel(periodKey: string) {
  if (periodKey === 'ALL') return 'All Time (Career)'
  const [year, half] = periodKey.split('-')
  if (half === 'H1') return `${year} • Half 1 (Jan–Jun)`
  if (half === 'H2') return `${year} • Half 2 (Jul–Dec)`
  return periodKey
}

export default function MatchDetailModal({
  match,
  homeTeam,
  awayTeam,
  players,
  matchGoals,
  matchAssists,
  canEdit,
  onClose,
  onSaved,
}: {
  match: ModalMatch | null
  homeTeam?: ModalTeam
  awayTeam?: ModalTeam
  players: ModalPlayer[]
  matchGoals: MatchGoalRow[]
  matchAssists: MatchAssistRow[]
  canEdit: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [homeGoals, setHomeGoals] = useState(0)
  const [awayGoals, setAwayGoals] = useState(0)
  const [status, setStatus] = useState<'scheduled' | 'played'>('scheduled')

  const [goalTeamId, setGoalTeamId] = useState<number>(0)
  const [goalPlayerId, setGoalPlayerId] = useState<number | ''>('')
  const [goalMinute, setGoalMinute] = useState('')
  const [autoSyncScore, setAutoSyncScore] = useState(true)

  const [assistTeamId, setAssistTeamId] = useState<number>(0)
  const [assistPlayerId, setAssistPlayerId] = useState<number | ''>('')
  const [assistMinute, setAssistMinute] = useState('')

  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!match) return
    setHomeGoals(match.home_goals)
    setAwayGoals(match.away_goals)
    setStatus(match.status)
    setGoalTeamId(match.home_team_id)
    setAssistTeamId(match.home_team_id)
    setGoalPlayerId('')
    setGoalMinute('')
    setAssistPlayerId('')
    setAssistMinute('')
    setFeedback(null)
    setErrorMsg(null)
  }, [match])

  const goalTeamPlayers = useMemo(
    () => players.filter((p) => p.team_id === goalTeamId),
    [players, goalTeamId]
  )

  const assistTeamPlayers = useMemo(
    () => players.filter((p) => p.team_id === assistTeamId),
    [players, assistTeamId]
  )

  const goalsOfThisMatch = useMemo(() => {
    if (!match) return []
    return matchGoals
      .filter((g) => g.match_id === match.id)
      .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999) || a.id - b.id)
  }, [matchGoals, match])

  const assistsOfThisMatch = useMemo(() => {
    if (!match) return []
    return matchAssists
      .filter((a) => a.match_id === match.id)
      .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999) || a.id - b.id)
  }, [matchAssists, match])

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  if (!match) return null

  const currentMatch = match
  const formattedDate = currentMatch.match_date
    ? new Date(currentMatch.match_date).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  async function handleSaveScore(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    const { error } = await supabase
      .from('matches')
      .update({
        home_goals: Math.max(0, Number(homeGoals)),
        away_goals: Math.max(0, Number(awayGoals)),
        status,
      })
      .eq('id', currentMatch.id)

    if (error) {
      setErrorMsg(`Failed to save score: ${error.message}`)
    } else {
      setFeedback('Match score and status saved.')
      await onSaved()
    }
    setBusy(false)
  }

  async function handleAddGoal(e: FormEvent) {
    e.preventDefault()
    if (!goalPlayerId) {
      setErrorMsg('Please select the goalscorer.')
      return
    }
    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    try {
      const periodKey = getCurrentPeriodKey()
      const { error: insErr } = await supabase.from('match_goals').insert({
        match_id: currentMatch.id,
        league_id: currentMatch.league_id,
        player_id: Number(goalPlayerId),
        team_id: goalTeamId,
        minute: goalMinute.trim() ? Number(goalMinute) : null,
        period_key: periodKey,
      })
      if (insErr) throw new Error(insErr.message)

      if (autoSyncScore) {
        const nextHome = goalTeamId === currentMatch.home_team_id ? homeGoals + 1 : homeGoals
        const nextAway = goalTeamId === currentMatch.away_team_id ? awayGoals + 1 : awayGoals
        const { error: scoreErr } = await supabase
          .from('matches')
          .update({
            home_goals: nextHome,
            away_goals: nextAway,
            status: 'played',
          })
          .eq('id', currentMatch.id)
        if (!scoreErr) {
          setHomeGoals(nextHome)
          setAwayGoals(nextAway)
          setStatus('played')
        }
      }

      setGoalPlayerId('')
      setGoalMinute('')
      setFeedback('Goal recorded and added to the 6-month Golden Boot leaderboard.')
      await onSaved()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add goal')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteGoal(goal: MatchGoalRow) {
    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    try {
      const { error: delErr } = await supabase.from('match_goals').delete().eq('id', goal.id)
      if (delErr) throw new Error(delErr.message)

      if (autoSyncScore) {
        const nextHome =
          goal.team_id === currentMatch.home_team_id ? Math.max(0, homeGoals - 1) : homeGoals
        const nextAway =
          goal.team_id === currentMatch.away_team_id ? Math.max(0, awayGoals - 1) : awayGoals
        const { error: scoreErr } = await supabase
          .from('matches')
          .update({
            home_goals: nextHome,
            away_goals: nextAway,
          })
          .eq('id', currentMatch.id)
        if (!scoreErr) {
          setHomeGoals(nextHome)
          setAwayGoals(nextAway)
        }
      }

      setFeedback('Goal entry removed.')
      await onSaved()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete goal')
    } finally {
      setBusy(false)
    }
  }

  async function handleAddAssist(e: FormEvent) {
    e.preventDefault()
    if (!assistPlayerId) {
      setErrorMsg('Please select the player who made the assist.')
      return
    }
    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    try {
      const periodKey = getCurrentPeriodKey()
      const { error: insErr } = await supabase.from('match_assists').insert({
        match_id: currentMatch.id,
        league_id: currentMatch.league_id,
        player_id: Number(assistPlayerId),
        team_id: assistTeamId,
        minute: assistMinute.trim() ? Number(assistMinute) : null,
        period_key: periodKey,
      })
      if (insErr) throw new Error(insErr.message)

      setAssistPlayerId('')
      setAssistMinute('')
      setFeedback('Assist recorded and added to the leaderboards.')
      await onSaved()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add assist')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteAssist(assistId: number) {
    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    const { error } = await supabase.from('match_assists').delete().eq('id', assistId)
    if (error) setErrorMsg(error.message)
    else {
      setFeedback('Assist entry removed.')
      await onSaved()
    }
    setBusy(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-[#0B1120] via-[#13203A] to-[#0B1120] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-8 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            {currentMatch.round_label && (
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {currentMatch.round_label}
              </div>
            )}
            <h2 className="text-xl font-bold text-white">
              {homeTeam?.name ?? 'Home Team'}{' '}
              <span className="text-rose-400 mx-1.5 tabular-nums">
                {status === 'played' ? `${homeGoals} - ${awayGoals}` : 'vs'}
              </span>{' '}
              {awayTeam?.name ?? 'Away Team'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {formattedDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                </span>
              )}
              {currentMatch.pitch && (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" /> Pitch {currentMatch.pitch}
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                  status === 'played'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {status === 'played' ? 'Played' : 'Scheduled'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-500/15 border border-red-400/40 text-red-200 px-3.5 py-2.5 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {feedback && (
          <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-3.5 py-2.5 rounded-xl text-xs font-medium">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-rose-400" />
              Goals ({goalsOfThisMatch.length})
            </h3>
            {goalsOfThisMatch.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white/[0.04] border border-white/10 rounded-xl p-3">
                No goals recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.08] border border-white/10 rounded-xl overflow-hidden bg-white/[0.04]">
                {goalsOfThisMatch.map((g) => {
                  const scorer = playerMap.get(g.player_id)
                  const tName =
                    g.team_id === currentMatch.home_team_id ? homeTeam?.name : awayTeam?.name
                  return (
                    <div
                      key={g.id}
                      className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-white">
                          {g.minute ? `${g.minute}' ` : ''}
                          {scorer?.full_name ?? `Player #${g.player_id}`}
                        </span>{' '}
                        <span className="text-slate-400">({tName})</span>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDeleteGoal(g)}
                          className="text-rose-400 hover:bg-rose-500/15 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              Assists ({assistsOfThisMatch.length})
            </h3>
            {assistsOfThisMatch.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white/[0.04] border border-white/10 rounded-xl p-3">
                No assists recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.08] border border-white/10 rounded-xl overflow-hidden bg-white/[0.04]">
                {assistsOfThisMatch.map((a) => {
                  const assister = playerMap.get(a.player_id)
                  const tName =
                    a.team_id === currentMatch.home_team_id ? homeTeam?.name : awayTeam?.name
                  return (
                    <div
                      key={a.id}
                      className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-white">
                          {a.minute ? `${a.minute}' ` : ''}
                          {assister?.full_name ?? `Player #${a.player_id}`}
                        </span>{' '}
                        <span className="text-slate-400">({tName})</span>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDeleteAssist(a.id)}
                          className="text-rose-400 hover:bg-rose-500/15 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {canEdit ? (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <form
              onSubmit={handleAddGoal}
              className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-white">Add Goal</h4>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncScore}
                    onChange={(e) => setAutoSyncScore(e.target.checked)}
                    className="accent-[#D50C2F]"
                  />
                  Update score automatically
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Team</label>
                  <select
                    value={goalTeamId}
                    onChange={(e) => {
                      setGoalTeamId(Number(e.target.value))
                      setGoalPlayerId('')
                    }}
                    className={DARK_INPUT}
                  >
                    <option value={currentMatch.home_team_id} className="bg-[#0B1120] text-white">
                      {homeTeam?.name ?? 'Home Team'}
                    </option>
                    <option value={currentMatch.away_team_id} className="bg-[#0B1120] text-white">
                      {awayTeam?.name ?? 'Away Team'}
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Goalscorer
                  </label>
                  <select
                    value={goalPlayerId}
                    onChange={(e) =>
                      setGoalPlayerId(e.target.value ? Number(e.target.value) : '')
                    }
                    className={DARK_INPUT}
                  >
                    <option value="" className="bg-[#0B1120] text-white">
                      {goalTeamPlayers.length === 0 ? 'No players in team' : 'Select player...'}
                    </option>
                    {goalTeamPlayers.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0B1120] text-white">
                        {p.jersey_number ? `#${p.jersey_number} ` : ''}
                        {p.full_name} (ID #{p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Minute (Opt.)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={goalMinute}
                    onChange={(e) => setGoalMinute(e.target.value)}
                    placeholder="34"
                    className={DARK_INPUT}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || goalTeamPlayers.length === 0}
                className="bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Goal
              </button>
            </form>

            <form
              onSubmit={handleAddAssist}
              className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wide text-white">Add Assist</h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Team</label>
                  <select
                    value={assistTeamId}
                    onChange={(e) => {
                      setAssistTeamId(Number(e.target.value))
                      setAssistPlayerId('')
                    }}
                    className={DARK_INPUT}
                  >
                    <option value={currentMatch.home_team_id} className="bg-[#0B1120] text-white">
                      {homeTeam?.name ?? 'Home Team'}
                    </option>
                    <option value={currentMatch.away_team_id} className="bg-[#0B1120] text-white">
                      {awayTeam?.name ?? 'Away Team'}
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Assister
                  </label>
                  <select
                    value={assistPlayerId}
                    onChange={(e) =>
                      setAssistPlayerId(e.target.value ? Number(e.target.value) : '')
                    }
                    className={DARK_INPUT}
                  >
                    <option value="" className="bg-[#0B1120] text-white">
                      {assistTeamPlayers.length === 0 ? 'No players in team' : 'Select player...'}
                    </option>
                    {assistTeamPlayers.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0B1120] text-white">
                        {p.jersey_number ? `#${p.jersey_number} ` : ''}
                        {p.full_name} (ID #{p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Minute (Opt.)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={assistMinute}
                    onChange={(e) => setAssistMinute(e.target.value)}
                    placeholder="34"
                    className={DARK_INPUT}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || assistTeamPlayers.length === 0}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Assist
              </button>
            </form>

            <form
              onSubmit={handleSaveScore}
              className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wide text-white">
                Match Score & Status (Manual)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1 truncate">
                    {homeTeam?.name ?? 'Home'} Goals
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={homeGoals}
                    onChange={(e) => setHomeGoals(Number(e.target.value))}
                    className={`${DARK_INPUT} text-sm`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1 truncate">
                    {awayTeam?.name ?? 'Away'} Goals
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={awayGoals}
                    onChange={(e) => setAwayGoals(Number(e.target.value))}
                    className={`${DARK_INPUT} text-sm`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Match Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'scheduled' | 'played')}
                    className={`${DARK_INPUT} text-sm`}
                  >
                    <option value="played" className="bg-[#0B1120] text-white">
                      Played (Update Standings)
                    </option>
                    <option value="scheduled" className="bg-[#0B1120] text-white">
                      Scheduled
                    </option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="bg-[#D50C2F] hover:bg-[#b80927] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Save Score
              </button>
            </form>
          </div>
        ) : (
          <p className="text-xs text-slate-400 border-t border-white/10 pt-3">
            Editing scores, goals, and assists is available to Admins and the captains of both teams.
          </p>
        )}
      </div>
    </div>
  )
}