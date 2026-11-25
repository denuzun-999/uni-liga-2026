import { useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Check,
  ChevronRight,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  GitBranch,
  GripVertical,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import { supabase } from './supabaseClient'

export type BracketTeam = {
  id: number
  name: string
  short_name: string | null
  logo_url: string | null
}

export type BracketGroup = {
  id: number
  league_id: number
  name: string
}

export type BracketMatch = {
  id: number
  league_id: number | null
  group_id: number | null
  home_team_id: number | null
  away_team_id: number | null
  home_goals: number
  away_goals: number
  status: 'scheduled' | 'played'
  round_label: string | null
  match_date: string | null
  pitch: number | null
  stage?: 'group' | 'knockout' | 'custom' | null
  bracket_round?: string | null
  bracket_slot?: number | null
}

type RoundMeta = {
  side: 'L' | 'R' | 'C'
  order: number
  isFinal: boolean
  columnKey: string
}

type RoundColumn = {
  columnKey: string
  side: 'L' | 'R'
  order: number
  title: string
  matches: BracketMatch[]
}

const DARK_CARD =
  'relative overflow-hidden bg-gradient-to-br from-[#0B1120]/94 via-[#13203A]/94 to-[#0B1120]/94 backdrop-blur-md border border-slate-700/65 shadow-[0_14px_38px_rgba(2,6,23,0.45)] text-slate-100'

const DARK_INPUT =
  'w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 placeholder:text-slate-500 rounded-xl px-3 py-2 text-sm transition'

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

function parseRoundMeta(m: BracketMatch): RoundMeta {
  const raw = (m.bracket_round || '').trim()
  if (raw.startsWith('L:')) {
    const order = Math.max(1, Number(raw.slice(2)) || 1)
    return { side: 'L', order, isFinal: false, columnKey: `L:${order}` }
  }
  if (raw.startsWith('R:')) {
    const order = Math.max(1, Number(raw.slice(2)) || 1)
    return { side: 'R', order, isFinal: false, columnKey: `R:${order}` }
  }
  if (raw === 'C:FINAL' || raw === 'F') {
    return { side: 'C', order: 0, isFinal: true, columnKey: 'C:FINAL' }
  }
  if (raw === 'C:EXTRA' || raw === 'THIRD') {
    return { side: 'C', order: 1, isFinal: false, columnKey: 'C:EXTRA' }
  }
  if (raw === 'QF') {
    const side = (m.bracket_slot ?? 0) < 2 ? 'L' : 'R'
    return { side, order: 1, isFinal: false, columnKey: `${side}:1` }
  }
  if (raw === 'SF') {
    const side = (m.bracket_slot ?? 0) === 0 ? 'L' : 'R'
    return { side, order: 2, isFinal: false, columnKey: `${side}:2` }
  }
  return { side: 'L', order: 1, isFinal: false, columnKey: 'L:1' }
}

function formatShortDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getWinnerAndLoser(match: BracketMatch): {
  winnerId: number | null
  loserId: number | null
} {
  if (
    match.status !== 'played' ||
    match.home_team_id === null ||
    match.away_team_id === null ||
    match.home_goals === match.away_goals
  ) {
    return { winnerId: null, loserId: null }
  }
  if (match.home_goals > match.away_goals) {
    return { winnerId: match.home_team_id, loserId: match.away_team_id }
  }
  return { winnerId: match.away_team_id, loserId: match.home_team_id }
}

function CrestBadge({
  team,
  size = 'md',
  highlighted = false,
}: {
  team?: BracketTeam
  size?: 'xs' | 'md' | 'lg'
  highlighted?: boolean
}) {
  const dim =
    size === 'xs'
      ? 'w-5 h-5 text-[8px]'
      : size === 'lg'
        ? 'w-14 h-14 text-sm'
        : 'w-11 h-11 text-xs'

  if (!team) {
    return (
      <span
        className={`${dim} rounded-full border-2 border-dashed border-sky-300/35 bg-white/5 flex items-center justify-center font-bold text-sky-200/50 shrink-0`}
      >
        ?
      </span>
    )
  }

  return (
    <span
      className={`${dim} rounded-full border-2 ${
        highlighted ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-white/85'
      } bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-md`}
    >
      {team.logo_url ? (
        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-black text-[#0B1120]">
          {(team.short_name || team.name.slice(0, 2)).toUpperCase()}
        </span>
      )}
    </span>
  )
}

function CenterTrophyArtwork({ hasChampion }: { hasChampion: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center border ${
          hasChampion
            ? 'bg-amber-400/15 border-amber-300/40 shadow-[0_0_40px_rgba(251,191,36,0.28)]'
            : 'bg-sky-400/10 border-sky-300/25 shadow-[0_0_35px_rgba(56,189,248,0.18)]'
        }`}
      >
        <Trophy
          className={`w-12 h-12 ${
            hasChampion ? 'text-amber-300' : 'text-slate-100'
          } drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]`}
          strokeWidth={1.6}
        />
      </div>
    </div>
  )
}

export default function KnockoutBracketSection({
  leagueId,
  leagueName,
  showOnHome,
  leagueTeams,
  allTeams,
  groups,
  matches,
  rankedTeamIds,
  editable,
  compactHomeMode = false,
  onOpenMatch,
  refreshAll,
}: {
  leagueId: number
  leagueName: string
  showOnHome: boolean
  leagueTeams: BracketTeam[]
  allTeams: BracketTeam[]
  groups: BracketGroup[]
  matches: BracketMatch[]
  rankedTeamIds: number[]
  editable: boolean
  compactHomeMode?: boolean
  onOpenMatch: (matchId: number) => void
  refreshAll: () => Promise<void>
}) {
  const [newRoundName, setNewRoundName] = useState('Play-In')
  const [newRoundPlacement, setNewRoundPlacement] = useState<
    'BOTH' | 'L' | 'R' | 'C:FINAL' | 'C:EXTRA'
  >('BOTH')
  const [newRoundMatchCount, setNewRoundMatchCount] = useState<number>(1)

  const [renamingColKey, setRenamingColKey] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  const [showAllPortalTeams, setShowAllPortalTeams] = useState(false)
  const [selectedChipTeamId, setSelectedChipTeamId] = useState<number | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)

  const [customHomeId, setCustomHomeId] = useState<number | ''>('')
  const [customAwayId, setCustomAwayId] = useState<number | ''>('')
  const [customGroupId, setCustomGroupId] = useState<string>('CUSTOM')
  const [customLabel, setCustomLabel] = useState('Play-In / Custom Match')
  const [customDate, setCustomDate] = useState('')
  const [customPitch, setCustomPitch] = useState<string>('')

  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const teamMap = useMemo(() => new Map(allTeams.map((t) => [t.id, t])), [allTeams])

  const teamPointsMap = useMemo(() => {
    const pts = new Map<number, number>()
    for (const m of matches) {
      if (
        m.league_id !== leagueId ||
        m.status !== 'played' ||
        m.stage === 'knockout' ||
        m.home_team_id === null ||
        m.away_team_id === null
      ) {
        continue
      }
      if (m.home_goals > m.away_goals) {
        pts.set(m.home_team_id, (pts.get(m.home_team_id) ?? 0) + 3)
      } else if (m.home_goals < m.away_goals) {
        pts.set(m.away_team_id, (pts.get(m.away_team_id) ?? 0) + 3)
      } else {
        pts.set(m.home_team_id, (pts.get(m.home_team_id) ?? 0) + 1)
        pts.set(m.away_team_id, (pts.get(m.away_team_id) ?? 0) + 1)
      }
    }
    return pts
  }, [matches, leagueId])

  const knockoutMatches = useMemo(() => {
    return matches
      .filter((m) => m.league_id === leagueId && m.stage === 'knockout')
      .sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0) || a.id - b.id)
  }, [matches, leagueId])

  const { leftColumns, rightColumns, finalMatch, extraCenterMatches } = useMemo(() => {
    const leftMap = new Map<number, BracketMatch[]>()
    const rightMap = new Map<number, BracketMatch[]>()
    let foundFinal: BracketMatch | null = null
    const extras: BracketMatch[] = []

    for (const m of knockoutMatches) {
      const meta = parseRoundMeta(m)
      if (meta.side === 'L') {
        const arr = leftMap.get(meta.order) ?? []
        arr.push(m)
        leftMap.set(meta.order, arr)
      } else if (meta.side === 'R') {
        const arr = rightMap.get(meta.order) ?? []
        arr.push(m)
        rightMap.set(meta.order, arr)
      } else if (meta.isFinal && !foundFinal) {
        foundFinal = m
      } else {
        extras.push(m)
      }
    }

    const lCols: RoundColumn[] = Array.from(leftMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([order, list]) => ({
        columnKey: `L:${order}`,
        side: 'L',
        order,
        title: list[0]?.round_label || `Round ${order}`,
        matches: list,
      }))

    const rCols: RoundColumn[] = Array.from(rightMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([order, list]) => ({
        columnKey: `R:${order}`,
        side: 'R',
        order,
        title: list[0]?.round_label || `Round ${order}`,
        matches: list,
      }))

    return {
      leftColumns: lCols,
      rightColumns: rCols,
      finalMatch: foundFinal,
      extraCenterMatches: extras,
    }
  }, [knockoutMatches])

  const hasBracket = knockoutMatches.length > 0

  const championTeam = useMemo(() => {
    if (!finalMatch) return null
    const { winnerId } = getWinnerAndLoser(finalMatch)
    return winnerId ? teamMap.get(winnerId) ?? null : null
  }, [finalMatch, teamMap])

  const draggableTeams = useMemo(() => {
    if (showAllPortalTeams || leagueTeams.length === 0) return allTeams
    return leagueTeams
  }, [showAllPortalTeams, leagueTeams, allTeams])

  if (compactHomeMode && !hasBracket) {
    return null
  }

  async function handleQuickPreset(preset: '6' | '8' | '4') {
    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    try {
      const rows: Array<{
        league_id: number
        group_id: null
        home_team_id: null
        away_team_id: null
        home_goals: number
        away_goals: number
        status: 'scheduled'
        round_label: string
        stage: 'knockout'
        bracket_round: string
        bracket_slot: number
      }> = []

      if (preset === '8') {
        rows.push(
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Quarter-Final',
            stage: 'knockout',
            bracket_round: 'L:1',
            bracket_slot: 0,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Quarter-Final',
            stage: 'knockout',
            bracket_round: 'L:1',
            bracket_slot: 1,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Quarter-Final',
            stage: 'knockout',
            bracket_round: 'R:1',
            bracket_slot: 0,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Quarter-Final',
            stage: 'knockout',
            bracket_round: 'R:1',
            bracket_slot: 1,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Semi-Final',
            stage: 'knockout',
            bracket_round: 'L:2',
            bracket_slot: 0,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Semi-Final',
            stage: 'knockout',
            bracket_round: 'R:2',
            bracket_slot: 0,
          }
        )
      } else if (preset === '6') {
        rows.push(
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Play-In',
            stage: 'knockout',
            bracket_round: 'L:1',
            bracket_slot: 0,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Play-In',
            stage: 'knockout',
            bracket_round: 'R:1',
            bracket_slot: 0,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Semi-Final',
            stage: 'knockout',
            bracket_round: 'L:2',
            bracket_slot: 0,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Semi-Final',
            stage: 'knockout',
            bracket_round: 'R:2',
            bracket_slot: 0,
          }
        )
      } else {
        rows.push(
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Semi-Final',
            stage: 'knockout',
            bracket_round: 'L:1',
            bracket_slot: 0,
          },
          {
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: 'Semi-Final',
            stage: 'knockout',
            bracket_round: 'R:1',
            bracket_slot: 0,
          }
        )
      }

      rows.push({
        league_id: leagueId,
        group_id: null,
        home_team_id: null,
        away_team_id: null,
        home_goals: 0,
        away_goals: 0,
        status: 'scheduled',
        round_label: 'Final',
        stage: 'knockout',
        bracket_round: 'C:FINAL',
        bracket_slot: 0,
      })

      const { error } = await supabase.from('matches').insert(rows)
      if (error) throw new Error(error.message)

      await supabase
        .from('leagues')
        .update({ show_bracket_on_home: true })
        .eq('id', leagueId)

      setFeedback(
        'Bracket template created! You can rename any round, add/remove matches, and drag teams into slots.'
      )
      await refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create bracket')
    } finally {
      setBusy(false)
    }
  }

  async function handleAddCustomRound(e: FormEvent) {
    e.preventDefault()
    const label = newRoundName.trim()
    if (!label) {
      setErrorMsg('Please enter a round name.')
      return
    }

    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    try {
      const leftOrders = leftColumns.map((c) => c.order)
      const rightOrders = rightColumns.map((c) => c.order)
      const count = Math.max(1, Math.min(4, Number(newRoundMatchCount) || 1))

      const rows: Array<{
        league_id: number
        group_id: null
        home_team_id: null
        away_team_id: null
        home_goals: number
        away_goals: number
        status: 'scheduled'
        round_label: string
        stage: 'knockout'
        bracket_round: string
        bracket_slot: number
      }> = []

      if (newRoundPlacement === 'C:FINAL') {
        if (finalMatch) {
          throw new Error('A Final match already exists in the center. Rename or edit it directly.')
        }
        rows.push({
          league_id: leagueId,
          group_id: null,
          home_team_id: null,
          away_team_id: null,
          home_goals: 0,
          away_goals: 0,
          status: 'scheduled',
          round_label: label,
          stage: 'knockout',
          bracket_round: 'C:FINAL',
          bracket_slot: 0,
        })
      } else if (newRoundPlacement === 'C:EXTRA') {
        rows.push({
          league_id: leagueId,
          group_id: null,
          home_team_id: null,
          away_team_id: null,
          home_goals: 0,
          away_goals: 0,
          status: 'scheduled',
          round_label: label,
          stage: 'knockout',
          bracket_round: 'C:EXTRA',
          bracket_slot: extraCenterMatches.length,
        })
      } else if (newRoundPlacement === 'BOTH') {
        const nextOrder = Math.max(0, ...leftOrders, ...rightOrders) + 1
        for (let i = 0; i < count; i++) {
          rows.push({
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: label,
            stage: 'knockout',
            bracket_round: `L:${nextOrder}`,
            bracket_slot: i,
          })
          rows.push({
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: label,
            stage: 'knockout',
            bracket_round: `R:${nextOrder}`,
            bracket_slot: i,
          })
        }
      } else if (newRoundPlacement === 'L') {
        const nextOrder = Math.max(0, ...leftOrders) + 1
        for (let i = 0; i < count; i++) {
          rows.push({
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: label,
            stage: 'knockout',
            bracket_round: `L:${nextOrder}`,
            bracket_slot: i,
          })
        }
      } else {
        const nextOrder = Math.max(0, ...rightOrders) + 1
        for (let i = 0; i < count; i++) {
          rows.push({
            league_id: leagueId,
            group_id: null,
            home_team_id: null,
            away_team_id: null,
            home_goals: 0,
            away_goals: 0,
            status: 'scheduled',
            round_label: label,
            stage: 'knockout',
            bracket_round: `R:${nextOrder}`,
            bracket_slot: i,
          })
        }
      }

      const { error } = await supabase.from('matches').insert(rows)
      if (error) throw new Error(error.message)

      if (!hasBracket) {
        await supabase
          .from('leagues')
          .update({ show_bracket_on_home: true })
          .eq('id', leagueId)
      }

      setFeedback(`Round "${label}" added to the bracket!`)
      await refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not add round')
    } finally {
      setBusy(false)
    }
  }

  async function handleAddMatchToColumn(col: RoundColumn) {
    setBusy(true)
    setErrorMsg(null)
    const nextSlot =
      col.matches.reduce((max, m) => Math.max(max, m.bracket_slot ?? 0), -1) + 1
    const { error } = await supabase.from('matches').insert({
      league_id: leagueId,
      group_id: null,
      home_team_id: null,
      away_team_id: null,
      home_goals: 0,
      away_goals: 0,
      status: 'scheduled',
      round_label: col.title,
      stage: 'knockout',
      bracket_round: col.columnKey,
      bracket_slot: nextSlot,
    })
    if (error) setErrorMsg(error.message)
    else await refreshAll()
    setBusy(false)
  }

  async function handleSaveColumnRename(colMatches: BracketMatch[]) {
    const clean = renameDraft.trim()
    if (!clean) {
      setRenamingColKey(null)
      return
    }
    setBusy(true)
    setErrorMsg(null)
    const ids = colMatches.map((m) => m.id)
    const { error } = await supabase
      .from('matches')
      .update({ round_label: clean })
      .in('id', ids)
    if (error) setErrorMsg(error.message)
    else {
      setRenamingColKey(null)
      await refreshAll()
    }
    setBusy(false)
  }

  async function handleDeleteSingleBracketMatch(matchId: number) {
    const ok = window.confirm('Remove this matchup from the bracket?')
    if (!ok) return
    setBusy(true)
    setErrorMsg(null)
    const { error } = await supabase.from('matches').delete().eq('id', matchId)
    if (error) setErrorMsg(error.message)
    else await refreshAll()
    setBusy(false)
  }

  async function handleResetBracket() {
    const ok = window.confirm(
      'Delete the entire knockout bracket for this competition? Group matches will NOT be affected.'
    )
    if (!ok) return

    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('league_id', leagueId)
      .eq('stage', 'knockout')

    if (error) {
      setErrorMsg(error.message)
    } else {
      await supabase
        .from('leagues')
        .update({ show_bracket_on_home: false })
        .eq('id', leagueId)
      setFeedback('Knockout bracket cleared.')
      await refreshAll()
    }
    setBusy(false)
  }

  async function handleToggleHomeVisibility() {
    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)
    const nextVal = !showOnHome
    const { error } = await supabase
      .from('leagues')
      .update({ show_bracket_on_home: nextVal })
      .eq('id', leagueId)

    if (error) setErrorMsg(error.message)
    else {
      setFeedback(
        nextVal
          ? 'Bracket is now shown on the Homepage below Group Standings.'
          : 'Bracket hidden from the Homepage (still visible here).'
      )
      await refreshAll()
    }
    setBusy(false)
  }

  async function assignTeamToSlot(
    matchId: number,
    side: 'home' | 'away',
    teamId: number | null
  ) {
    setBusy(true)
    setErrorMsg(null)
    const patch = side === 'home' ? { home_team_id: teamId } : { away_team_id: teamId }
    const { error } = await supabase.from('matches').update(patch).eq('id', matchId)
    if (error) setErrorMsg(error.message)
    else {
      setSelectedChipTeamId(null)
      await refreshAll()
    }
    setBusy(false)
  }

  async function handleAutoFillFromStandings() {
    const outerLeft = leftColumns[0]?.matches ?? []
    const outerRight = rightColumns[rightColumns.length - 1]?.matches ?? []

    const opening: BracketMatch[] = []
    const maxLen = Math.max(outerLeft.length, outerRight.length)
    for (let i = 0; i < maxLen; i++) {
      if (outerLeft[i]) opening.push(outerLeft[i])
      if (outerRight[i]) opening.push(outerRight[i])
    }
    if (opening.length === 0 && finalMatch) {
      opening.push(finalMatch)
    }
    if (opening.length === 0) return

    const needed = opening.length * 2
    const pool = rankedTeamIds.length > 0 ? rankedTeamIds : leagueTeams.map((t) => t.id)
    const seeds = pool.slice(0, needed)

    if (seeds.length < 2) {
      setErrorMsg('Not enough teams available to auto-fill.')
      return
    }

    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    try {
      for (let i = 0; i < opening.length; i++) {
        const homeId = seeds[i] ?? null
        const awayId = seeds[seeds.length - 1 - i] ?? null
        const cleanAway = awayId !== homeId ? awayId : null
        const { error } = await supabase
          .from('matches')
          .update({ home_team_id: homeId, away_team_id: cleanAway })
          .eq('id', opening[i].id)
        if (error) throw new Error(error.message)
      }
      setFeedback(
        'Opening round auto-filled from standings! Drag & drop any team to fine-tune matchups.'
      )
      await refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Auto-fill failed')
    } finally {
      setBusy(false)
    }
  }

  function findAdvanceTarget(
    _match: BracketMatch,
    col: RoundColumn,
    indexInCol: number
  ): { targetMatchId: number; side: 'home' | 'away' } | null {
    if (col.side === 'L') {
      const nextCol = leftColumns.find((c) => c.order > col.order)
      if (nextCol && nextCol.matches.length > 0) {
        const target = nextCol.matches[Math.floor(indexInCol / 2)] ?? nextCol.matches[0]
        return { targetMatchId: target.id, side: indexInCol % 2 === 0 ? 'home' : 'away' }
      }
      if (finalMatch) {
        return { targetMatchId: finalMatch.id, side: 'home' }
      }
      return null
    } else {
      const nextCol = [...rightColumns]
        .sort((a, b) => a.order - b.order)
        .find((c) => c.order > col.order)
      if (nextCol && nextCol.matches.length > 0) {
        const target = nextCol.matches[Math.floor(indexInCol / 2)] ?? nextCol.matches[0]
        return { targetMatchId: target.id, side: indexInCol % 2 === 0 ? 'home' : 'away' }
      }
      if (finalMatch) {
        return { targetMatchId: finalMatch.id, side: 'away' }
      }
      return null
    }
  }

  async function handleAdvanceWinner(match: BracketMatch, col: RoundColumn, indexInCol: number) {
    const { winnerId } = getWinnerAndLoser(match)
    if (!winnerId) return
    const target = findAdvanceTarget(match, col, indexInCol)
    if (!target) return
    await assignTeamToSlot(target.targetMatchId, target.side, winnerId)
    setFeedback('Winner advanced to the next round!')
  }

  async function handleCreateCustomMatch(e: FormEvent) {
    e.preventDefault()
    if (!customHomeId || !customAwayId) {
      setErrorMsg('Please select both Home and Away teams.')
      return
    }
    if (customHomeId === customAwayId) {
      setErrorMsg('Home and Away teams must be different.')
      return
    }

    setBusy(true)
    setFeedback(null)
    setErrorMsg(null)

    const isGroupMatch = customGroupId !== 'CUSTOM'
    const { error } = await supabase.from('matches').insert({
      league_id: leagueId,
      group_id: isGroupMatch ? Number(customGroupId) : null,
      home_team_id: Number(customHomeId),
      away_team_id: Number(customAwayId),
      home_goals: 0,
      away_goals: 0,
      status: 'scheduled',
      round_label: customLabel.trim() || 'Custom Match',
      match_date: customDate ? new Date(customDate).toISOString() : null,
      pitch: customPitch ? Number(customPitch) : null,
      stage: isGroupMatch ? 'group' : 'custom',
    })

    if (error) {
      setErrorMsg(`Could not add match: ${error.message}`)
    } else {
      setCustomHomeId('')
      setCustomAwayId('')
      setCustomDate('')
      setCustomPitch('')
      setFeedback('Custom match created! Click it in Fixtures to enter scores, goals, and assists.')
      await refreshAll()
    }
    setBusy(false)
  }

  function handleChipDragStart(e: DragEvent, teamId: number) {
    e.dataTransfer.setData('text/plain', String(teamId))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleSlotDrop(e: DragEvent, matchId: number, side: 'home' | 'away') {
    e.preventDefault()
    setDragOverTarget(null)
    const raw = e.dataTransfer.getData('text/plain')
    const teamId = Number(raw)
    if (!Number.isNaN(teamId) && teamId > 0) {
      assignTeamToSlot(matchId, side, teamId)
    }
  }

  function getTeamSubline(team?: BracketTeam) {
    if (!team) return editable ? 'Drop team' : 'TBD'
    const pts = teamPointsMap.get(team.id)
    if (pts !== undefined) return `${pts} PTS`
    return team.short_name ? team.short_name.toUpperCase() : 'CLUB'
  }

  function renderTeamNode({
    match,
    slotSide,
    teamId,
    align,
    isWinner,
    size = 'md',
  }: {
    match: BracketMatch
    slotSide: 'home' | 'away'
    teamId: number | null
    align: 'left-wing' | 'right-wing' | 'center-stack'
    isWinner: boolean
    size?: 'md' | 'lg'
  }) {
    const team = teamId ? teamMap.get(teamId) : undefined
    const targetKey = `${match.id}-${slotSide}`
    const isOver = dragOverTarget === targetKey
    const canDropHere = editable

    const commonProps = {
      onDragOver: (e: DragEvent) => {
        if (!canDropHere) return
        e.preventDefault()
        setDragOverTarget(targetKey)
      },
      onDragLeave: () => {
        if (dragOverTarget === targetKey) setDragOverTarget(null)
      },
      onDrop: (e: DragEvent) => {
        if (!canDropHere) return
        handleSlotDrop(e, match.id, slotSide)
      },
      onClick: () => {
        if (editable && selectedChipTeamId !== null) {
          assignTeamToSlot(match.id, slotSide, selectedChipTeamId)
        }
      },
    }

    const highlightClass = isOver
      ? 'ring-2 ring-[#D50C2F] bg-[#D50C2F]/20'
      : editable && selectedChipTeamId !== null
        ? 'hover:bg-amber-400/15 cursor-pointer ring-1 ring-amber-300/40'
        : isWinner
          ? 'bg-emerald-400/10'
          : 'hover:bg-white/5'

    if (align === 'center-stack') {
      return (
        <div
          {...commonProps}
          draggable={editable && !!teamId}
          onDragStart={(e) => {
            if (teamId) handleChipDragStart(e, teamId)
          }}
          className={`relative flex flex-col items-center text-center gap-1.5 px-3 py-2 rounded-2xl transition w-32 ${highlightClass}`}
        >
          <CrestBadge team={team} size={size} highlighted={isWinner} />
          <div className="w-full">
            <div
              className={`text-xs font-extrabold uppercase tracking-wide truncate ${
                team ? 'text-white' : 'text-sky-200/50 italic'
              }`}
            >
              {team ? team.name : editable ? 'Drop Finalist' : 'TBD'}
            </div>
            <div className="text-[10px] font-bold text-sky-300/80 uppercase">
              {getTeamSubline(team)}
            </div>
          </div>
          {editable && teamId && (
            <button
              type="button"
              disabled={busy}
              title="Clear slot"
              onClick={(e) => {
                e.stopPropagation()
                assignTeamToSlot(match.id, slotSide, null)
              }}
              className="absolute top-1 right-1 text-slate-300 hover:text-red-400 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }

    const isLeftWing = align === 'left-wing'

    return (
      <div
        {...commonProps}
        draggable={editable && !!teamId}
        onDragStart={(e) => {
          if (teamId) handleChipDragStart(e, teamId)
        }}
        className={`group/slot relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition ${
          isLeftWing ? 'flex-row justify-end text-right' : 'flex-row-reverse justify-end text-left'
        } ${editable && teamId ? 'cursor-grab active:cursor-grabbing' : ''} ${highlightClass}`}
      >
        <div className="min-w-0 flex-1 max-w-[130px]">
          <div
            className={`text-xs font-extrabold uppercase tracking-tight truncate ${
              team ? 'text-white' : 'text-sky-200/45 italic font-semibold normal-case'
            }`}
          >
            {team ? team.name : editable ? 'Drop team...' : 'TBD'}
          </div>
          <div className="text-[10px] font-bold text-sky-300/80">{getTeamSubline(team)}</div>
        </div>

        <CrestBadge team={team} size="md" highlighted={isWinner} />

        {editable && teamId && (
          <button
            type="button"
            disabled={busy}
            title="Clear slot"
            onClick={(e) => {
              e.stopPropagation()
              assignTeamToSlot(match.id, slotSide, null)
            }}
            className={`absolute -top-1 ${
              isLeftWing ? '-right-1' : '-left-1'
            } bg-[#0B1120] border border-white/20 text-slate-300 hover:text-red-400 rounded-full p-0.5 opacity-0 group-hover/slot:opacity-100 transition cursor-pointer`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  function renderWingMatchup(match: BracketMatch, col: RoundColumn, idx: number) {
    const isLeft = col.side === 'L'
    const { winnerId } = getWinnerAndLoser(match)
    const bothAssigned = match.home_team_id !== null && match.away_team_id !== null
    const formattedDate = formatShortDate(match.match_date)
    const advanceTarget =
      editable && winnerId !== null ? findAdvanceTarget(match, col, idx) : null

    return (
      <div
        key={match.id}
        className={`flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
      >
        <div className="flex flex-col gap-1 py-1 min-w-[195px]">
          {renderTeamNode({
            match,
            slotSide: 'home',
            teamId: match.home_team_id,
            align: isLeft ? 'left-wing' : 'right-wing',
            isWinner: winnerId !== null && winnerId === match.home_team_id,
          })}

          <div
            className={`flex items-center gap-2 px-3 ${
              isLeft ? 'justify-end pr-6' : 'justify-start pl-6'
            }`}
          >
            {bothAssigned ? (
              <button
                type="button"
                onClick={() => onOpenMatch(match.id)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider tabular-nums transition cursor-pointer ${
                  match.status === 'played'
                    ? 'bg-[#D50C2F] hover:bg-[#b80927] text-white shadow-sm'
                    : 'bg-sky-400/15 hover:bg-sky-400/30 text-sky-300 border border-sky-400/30'
                }`}
              >
                {match.status === 'played' ? `${match.home_goals} - ${match.away_goals}` : 'V'}
              </button>
            ) : (
              <span className="text-xs font-black text-sky-400/60 px-2">V</span>
            )}

            {advanceTarget && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleAdvanceWinner(match, col, idx)}
                title="Advance winner to next round"
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5 cursor-pointer"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            )}

            {editable && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDeleteSingleBracketMatch(match.id)}
                title="Delete matchup"
                className="text-slate-400 hover:text-red-400 p-0.5 rounded cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {renderTeamNode({
            match,
            slotSide: 'away',
            teamId: match.away_team_id,
            align: isLeft ? 'left-wing' : 'right-wing',
            isWinner: winnerId !== null && winnerId === match.away_team_id,
          })}

          {(formattedDate || match.pitch) && (
            <div
              className={`flex items-center gap-2 text-[10px] text-sky-200/60 px-3 ${
                isLeft ? 'justify-end' : 'justify-start'
              }`}
            >
              {formattedDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" /> {formattedDate}
                </span>
              )}
              {match.pitch && (
                <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold">
                  <MapPin className="w-2.5 h-2.5" /> P{match.pitch}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className={`w-6 h-24 shrink-0 relative flex items-center ${
            isLeft ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`w-3.5 h-full border-sky-300/35 ${
              isLeft
                ? 'border-t-2 border-b-2 border-r-2 rounded-r-md'
                : 'border-t-2 border-b-2 border-l-2 rounded-l-md'
            }`}
          />
          <div className="w-2.5 h-[2px] bg-sky-300/35" />
        </div>
      </div>
    )
  }

  function renderColumnHeader(col: RoundColumn) {
    const isRenaming = renamingColKey === col.columnKey

    return (
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {isRenaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSaveColumnRename(col.matches)
            }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              className="bg-white/10 border border-sky-300/40 text-white text-xs font-bold px-2 py-1 rounded-lg w-28 focus:outline-none"
            />
            <button
              type="submit"
              className="text-emerald-400 hover:text-emerald-300 p-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRenamingColKey(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sky-300">
              {col.title}
            </span>
            {editable && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRenamingColKey(col.columnKey)
                    setRenameDraft(col.title)
                  }}
                  title="Rename round"
                  className="text-sky-200/50 hover:text-white p-0.5 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAddMatchToColumn(col)}
                  title="Add another matchup to this round"
                  className="text-emerald-400/80 hover:text-emerald-300 p-0.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-500/15 border border-red-400/40 text-red-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {errorMsg}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {feedback}
        </div>
      )}

      {/* ADMIN CUSTOM MATCH CREATOR */}
      {editable && (
        <section className={`${DARK_CARD} rounded-2xl p-6 space-y-4`}>
          <AmbientGlow />
          <div className="relative z-10 border-b border-white/10 pb-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-400">
              FLEXIBLE SCHEDULING
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Add Custom Match (Any Two Teams)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Schedule extra group games, tiebreakers, play-ins, or standalone matches anytime.
            </p>
          </div>

          <form
            onSubmit={handleCreateCustomMatch}
            className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
          >
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1">Home Team</label>
              <select
                value={customHomeId}
                onChange={(e) => setCustomHomeId(e.target.value ? Number(e.target.value) : '')}
                className={DARK_INPUT}
              >
                <option value="" className="bg-[#0B1120] text-white">
                  Select home team...
                </option>
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0B1120] text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1">Away Team</label>
              <select
                value={customAwayId}
                onChange={(e) => setCustomAwayId(e.target.value ? Number(e.target.value) : '')}
                className={DARK_INPUT}
              >
                <option value="" className="bg-[#0B1120] text-white">
                  Select away team...
                </option>
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0B1120] text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Match Type / Group
              </label>
              <select
                value={customGroupId}
                onChange={(e) => setCustomGroupId(e.target.value)}
                className={DARK_INPUT}
              >
                <option value="CUSTOM" className="bg-[#0B1120] text-white">
                  Custom / Play-In
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={String(g.id)} className="bg-[#0B1120] text-white">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Round Label</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Play-In / Matchday"
                className={DARK_INPUT}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Pitch (Opt.)</label>
              <select
                value={customPitch}
                onChange={(e) => setCustomPitch(e.target.value)}
                className={DARK_INPUT}
              >
                <option value="" className="bg-[#0B1120] text-white">
                  Any
                </option>
                <option value="1" className="bg-[#0B1120] text-white">
                  Pitch 1
                </option>
                <option value="2" className="bg-[#0B1120] text-white">
                  Pitch 2
                </option>
              </select>
            </div>

            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kickoff Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className={DARK_INPUT}
              />
            </div>

            <div className="lg:col-span-8 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="bg-[#D50C2F] hover:bg-[#b80927] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Plus className="w-4 h-4" /> Add Custom Match
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ADMIN FLEXIBLE BRACKET BUILDER PANEL */}
      {editable && (
        <section className={`${DARK_CARD} rounded-2xl p-6 space-y-5`}>
          <AmbientGlow />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                CUSTOM BRACKET BUILDER
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Design Your Own Knockout Tree
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add any round with your own title (e.g. Play-In, Round of 6, Semi-Final, Final), or start from a quick preset and customize freely.
              </p>
            </div>

            {hasBracket && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleAutoFillFromStandings}
                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Fill from Standings
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleToggleHomeVisibility}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border cursor-pointer transition ${
                    showOnHome
                      ? 'bg-white text-[#0B1120] border-white'
                      : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/15'
                  }`}
                >
                  {showOnHome ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#16A34A]" /> Shown on Home
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hidden on Home
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResetBracket}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/25 px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Bracket
                </button>
              </div>
            )}
          </div>

          {!hasBracket && (
            <div className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-semibold text-white">
                Quick Starters (Optional — you can edit round names & matches anytime):
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleQuickPreset('6')}
                  className="bg-white/10 hover:bg-white/15 hover:border-rose-400 border border-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  6 Teams (Play-In → SF → Final)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleQuickPreset('8')}
                  className="bg-white/10 hover:bg-white/15 hover:border-rose-400 border border-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  8 Teams (QF → SF → Final)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleQuickPreset('4')}
                  className="bg-white/10 hover:bg-white/15 hover:border-rose-400 border border-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  4 Teams (SF → Final)
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleAddCustomRound}
            className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end bg-white/[0.04] border border-white/10 rounded-2xl p-4"
          >
            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Custom Round Name
              </label>
              <input
                type="text"
                required
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="e.g. Play-In, Wildcard, Semi-Final, Final"
                className={DARK_INPUT}
              />
            </div>

            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Placement in Tree
              </label>
              <select
                value={newRoundPlacement}
                onChange={(e) =>
                  setNewRoundPlacement(
                    e.target.value as 'BOTH' | 'L' | 'R' | 'C:FINAL' | 'C:EXTRA'
                  )
                }
                className={DARK_INPUT}
              >
                <option value="BOTH" className="bg-[#0B1120] text-white">
                  Both Sides (Symmetrical Left & Right)
                </option>
                <option value="L" className="bg-[#0B1120] text-white">
                  Left Side Only
                </option>
                <option value="R" className="bg-[#0B1120] text-white">
                  Right Side Only
                </option>
                <option value="C:FINAL" className="bg-[#0B1120] text-white">
                  Center — Final (with Trophy)
                </option>
                <option value="C:EXTRA" className="bg-[#0B1120] text-white">
                  Center — Extra Match (e.g. 3rd Place)
                </option>
              </select>
            </div>

            {newRoundPlacement !== 'C:FINAL' && newRoundPlacement !== 'C:EXTRA' && (
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Matches {newRoundPlacement === 'BOTH' ? '(Each Side)' : ''}
                </label>
                <select
                  value={newRoundMatchCount}
                  onChange={(e) => setNewRoundMatchCount(Number(e.target.value))}
                  className={DARK_INPUT}
                >
                  <option value={1} className="bg-[#0B1120] text-white">
                    1 Match
                  </option>
                  <option value={2} className="bg-[#0B1120] text-white">
                    2 Matches
                  </option>
                  <option value={3} className="bg-[#0B1120] text-white">
                    3 Matches
                  </option>
                  <option value={4} className="bg-[#0B1120] text-white">
                    4 Matches
                  </option>
                </select>
              </div>
            )}

            <div
              className={
                newRoundPlacement !== 'C:FINAL' && newRoundPlacement !== 'C:EXTRA'
                  ? 'lg:col-span-2'
                  : 'lg:col-span-4'
              }
            >
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#D50C2F] hover:bg-[#b80927] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Plus className="w-4 h-4" /> Add Round
              </button>
            </div>
          </form>

          {hasBracket && (
            <div className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-white">
                  Drag a team into any crest slot below (or click a team, then click a slot):
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllPortalTeams((v) => !v)}
                  className="text-[11px] font-semibold text-rose-400 hover:underline cursor-pointer"
                >
                  {showAllPortalTeams ? 'Show Competition Teams Only' : 'Show All Portal Teams'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {draggableTeams.map((team) => {
                  const isSelected = selectedChipTeamId === team.id
                  return (
                    <div
                      key={team.id}
                      draggable
                      onDragStart={(e) => handleChipDragStart(e, team.id)}
                      onClick={() =>
                        setSelectedChipTeamId((prev) => (prev === team.id ? null : team.id))
                      }
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold select-none cursor-grab active:cursor-grabbing transition ${
                        isSelected
                          ? 'bg-[#D50C2F] text-white border-[#D50C2F] shadow-xs'
                          : 'bg-white/10 text-white border-white/15 hover:border-rose-400/70'
                      }`}
                    >
                      <GripVertical
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white/80' : 'text-slate-400'
                        }`}
                      />
                      <CrestBadge team={team} size="xs" />
                      <span>{team.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* SYMMETRICAL "ROAD TO THE FINAL" BRACKET GRAPHIC */}
      {hasBracket && (
        <section className={`${DARK_CARD} rounded-3xl text-white`}>
          <AmbientGlow />

          <div className="relative z-10 p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="w-24 hidden sm:block" />
              <div className="text-center flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
                  {leagueName}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-[0.08em] text-white mt-0.5">
                  ROAD TO THE FINAL
                </h2>
              </div>
              <div className="w-24 flex justify-end">
                {compactHomeMode && (
                  <Link
                    to={`/leagues/${leagueId}`}
                    className="text-xs font-semibold text-sky-300 hover:text-white transition whitespace-nowrap"
                  >
                    Open →
                  </Link>
                )}
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="flex items-stretch justify-center gap-2 min-w-max mx-auto px-2 py-2">
                {leftColumns.map((col) => (
                  <div
                    key={col.columnKey}
                    className="flex flex-col justify-between min-w-[225px]"
                  >
                    {renderColumnHeader(col)}
                    <div className="flex-1 flex flex-col justify-around gap-6">
                      {col.matches.map((m, idx) => renderWingMatchup(m, col, idx))}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col items-center justify-center px-3 sm:px-5 min-w-[270px] space-y-5">
                  {finalMatch ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-1.5">
                        {renamingColKey === 'C:FINAL' ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              handleSaveColumnRename([finalMatch])
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              className="bg-white/10 border border-sky-300/40 text-white text-xs font-bold px-2 py-1 rounded-lg w-28 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="text-emerald-400 hover:text-emerald-300 p-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                              {finalMatch.round_label || 'FINAL'}
                            </span>
                            {editable && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingColKey('C:FINAL')
                                  setRenameDraft(finalMatch.round_label || 'Final')
                                }}
                                title="Rename Final"
                                className="text-sky-200/50 hover:text-white p-0.5 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        {renderTeamNode({
                          match: finalMatch,
                          slotSide: 'home',
                          teamId: finalMatch.home_team_id,
                          align: 'center-stack',
                          isWinner:
                            championTeam !== null &&
                            championTeam.id === finalMatch.home_team_id,
                          size: 'lg',
                        })}

                        <CenterTrophyArtwork hasChampion={!!championTeam} />

                        {renderTeamNode({
                          match: finalMatch,
                          slotSide: 'away',
                          teamId: finalMatch.away_team_id,
                          align: 'center-stack',
                          isWinner:
                            championTeam !== null &&
                            championTeam.id === finalMatch.away_team_id,
                          size: 'lg',
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        {finalMatch.home_team_id !== null && finalMatch.away_team_id !== null ? (
                          <button
                            type="button"
                            onClick={() => onOpenMatch(finalMatch.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider tabular-nums transition cursor-pointer ${
                              finalMatch.status === 'played'
                                ? 'bg-[#D50C2F] hover:bg-[#b80927] text-white shadow-md'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                            }`}
                          >
                            {finalMatch.status === 'played'
                              ? `FINAL ${finalMatch.home_goals} - ${finalMatch.away_goals}`
                              : 'ENTER FINAL SCORE'}
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-200/50">
                            Awaiting Finalists
                          </span>
                        )}

                        {editable && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDeleteSingleBracketMatch(finalMatch.id)}
                            title="Delete Final"
                            className="text-slate-400 hover:text-red-400 p-1 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {championTeam && (
                        <div className="mt-2 bg-amber-400/15 border border-amber-300/40 px-4 py-2 rounded-2xl inline-flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
                            Champion:
                          </span>
                          <Link
                            to={`/teams/${championTeam.id}`}
                            className="text-sm font-black text-white hover:text-amber-200 transition"
                          >
                            {championTeam.name}
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CenterTrophyArtwork hasChampion={false} />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-sky-200/50">
                        Add a Center Final Round
                      </span>
                    </div>
                  )}

                  {extraCenterMatches.length > 0 && (
                    <div className="w-full space-y-3 pt-4 border-t border-white/10">
                      {extraCenterMatches.map((em) => {
                        const { winnerId } = getWinnerAndLoser(em)
                        const bothAssigned =
                          em.home_team_id !== null && em.away_team_id !== null
                        return (
                          <div
                            key={em.id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-300">
                              <span>{em.round_label || 'Extra Match'}</span>
                              <div className="flex items-center gap-1.5">
                                {bothAssigned && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenMatch(em.id)}
                                    className="text-emerald-400 hover:underline font-bold cursor-pointer"
                                  >
                                    {em.status === 'played'
                                      ? `${em.home_goals} - ${em.away_goals}`
                                      : 'Score'}
                                  </button>
                                )}
                                {editable && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleDeleteSingleBracketMatch(em.id)}
                                    className="text-slate-400 hover:text-red-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              {renderTeamNode({
                                match: em,
                                slotSide: 'home',
                                teamId: em.home_team_id,
                                align: 'center-stack',
                                isWinner: winnerId !== null && winnerId === em.home_team_id,
                              })}
                              <span className="text-xs font-black text-sky-300/70">V</span>
                              {renderTeamNode({
                                match: em,
                                slotSide: 'away',
                                teamId: em.away_team_id,
                                align: 'center-stack',
                                isWinner: winnerId !== null && winnerId === em.away_team_id,
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {rightColumns.map((col) => (
                  <div
                    key={col.columnKey}
                    className="flex flex-col justify-between min-w-[225px]"
                  >
                    {renderColumnHeader(col)}
                    <div className="flex-1 flex flex-col justify-around gap-6">
                      {col.matches.map((m, idx) => renderWingMatchup(m, col, idx))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[11px] font-semibold tracking-wider text-sky-200/45 pt-2 border-t border-white/10">
              UNI LIGA KNOCKOUT TREE · CLICK ANY SCORE OR “V” TO VIEW GOALS & ASSISTS
            </div>
          </div>
        </section>
      )}
    </div>
  )
}