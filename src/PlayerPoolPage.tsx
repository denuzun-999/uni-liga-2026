import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import {
  Award,
  CheckCircle2,
  Clock,
  Filter,
  LogIn,
  Mail,
  Search,
  Send,
  Shield,
  Target,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import type { MatchAssistRow, MatchGoalRow } from './MatchDetailModal'

export type PoolLeague = {
  id: number
  name: string
  type: 'league' | 'tournament'
  season: string
  status?: 'active' | 'archived' | null
  is_active?: boolean | null
}

export type PoolTeam = {
  id: number
  name: string
  short_name: string | null
  captain_id: string | null
  co_captain_id?: string | null
}

export type PoolPlayer = {
  id: number
  team_id: number | null
  full_name: string
  email: string | null
  user_id: string | null
  jersey_number: number | null
  position: string | null
  photo_url: string | null
}

export type FreeAgentApplication = {
  id: number
  league_id: number
  player_id: number
  user_id: string
  preferred_position: string | null
  note: string | null
  status: 'open' | 'accepted' | 'withdrawn'
  created_at: string
}

export type TeamInvite = {
  id: number
  team_id: number
  player_id: number
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
}

export type ConfirmRequest = {
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'warning'
  onConfirm: () => Promise<void> | void
}

const POSITIONS = [
  'Goalkeeper',
  'Center Back',
  'Left Back',
  'Right Back',
  'Midfielder',
  'Winger',
  'Forward',
  'Any',
]

const DARK_CARD =
  'relative overflow-hidden bg-gradient-to-br from-[#0B1120]/94 via-[#13203A]/94 to-[#0B1120]/94 backdrop-blur-md border border-slate-700/65 shadow-[0_14px_38px_rgba(2,6,23,0.45)] text-slate-100'

const DARK_INPUT =
  'w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-sm transition'

function PoolGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        background:
          'radial-gradient(circle at 12% 14%, rgba(225,29,72,0.13), transparent 45%), radial-gradient(circle at 88% 86%, rgba(22,163,74,0.11), transparent 48%)',
      }}
    />
  )
}

export default function PlayerPoolPage({
  user,
  isAdmin,
  leagues,
  teams,
  players,
  applications,
  teamInvites,
  matchGoals,
  matchAssists,
  refreshAll,
  openAuthModal,
  askConfirm,
}: {
  user: User | null
  isAdmin: boolean
  leagues: PoolLeague[]
  teams: PoolTeam[]
  players: PoolPlayer[]
  applications: FreeAgentApplication[]
  teamInvites: TeamInvite[]
  matchGoals: MatchGoalRow[]
  matchAssists: MatchAssistRow[]
  refreshAll: () => Promise<void>
  openAuthModal: () => void
  askConfirm: (req: ConfirmRequest) => void
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'free_agents'>('all')

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTeamId, setFilterTeamId] = useState<string>('ALL')
  const [filterPosition, setFilterPosition] = useState<string>('ALL')

  const [filterLeagueId, setFilterLeagueId] = useState<number | 'ALL'>('ALL')
  const [applyLeagueId, setApplyLeagueId] = useState<number | ''>('')
  const [preferredPosition, setPreferredPosition] = useState('Midfielder')
  const [note, setNote] = useState('')
  const [recruitTeamId, setRecruitTeamId] = useState<number | ''>('')

  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  const activeLeagues = useMemo(
    () => leagues.filter((l) => l.status !== 'archived' && l.is_active !== false),
    [leagues]
  )

  const managedTeams = useMemo(() => {
    if (!user) return []
    if (isAdmin) return teams
    return teams.filter((t) => t.captain_id === user.id || t.co_captain_id === user.id)
  }, [user, isAdmin, teams])

  const myPlayer = useMemo(() => {
    if (!user) return null
    return (
      players.find((p) => p.user_id === user.id) ??
      players.find(
        (p) => p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()
      ) ??
      null
    )
  }, [user, players])

  const leagueMap = useMemo(() => new Map(leagues.map((l) => [l.id, l])), [leagues])
  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  const goalCountByPlayer = useMemo(() => {
    const map = new Map<number, number>()
    for (const g of matchGoals) {
      map.set(g.player_id, (map.get(g.player_id) ?? 0) + 1)
    }
    return map
  }, [matchGoals])

  const assistCountByPlayer = useMemo(() => {
    const map = new Map<number, number>()
    for (const a of matchAssists) {
      map.set(a.player_id, (map.get(a.player_id) ?? 0) + 1)
    }
    return map
  }, [matchAssists])

  const effectiveRecruitTeamId =
    recruitTeamId !== ''
      ? Number(recruitTeamId)
      : managedTeams.length > 0
        ? managedTeams[0].id
        : null

  const myPendingInvites = useMemo(() => {
    if (!myPlayer || myPlayer.team_id !== null) return []
    return teamInvites.filter(
      (inv) => inv.player_id === myPlayer.id && inv.status === 'pending'
    )
  }, [myPlayer, teamInvites])

  const pendingInviteByPlayerForTargetTeam = useMemo(() => {
    const map = new Map<number, TeamInvite>()
    if (!effectiveRecruitTeamId) return map
    for (const inv of teamInvites) {
      if (inv.team_id === effectiveRecruitTeamId && inv.status === 'pending') {
        map.set(inv.player_id, inv)
      }
    }
    return map
  }, [teamInvites, effectiveRecruitTeamId])

  const filteredAllPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return [...players]
      .filter((p) => {
        if (filterTeamId === 'FREE' && p.team_id !== null) return false
        if (
          filterTeamId !== 'ALL' &&
          filterTeamId !== 'FREE' &&
          p.team_id !== Number(filterTeamId)
        ) {
          return false
        }
        if (
          filterPosition !== 'ALL' &&
          (p.position ?? '').toLowerCase() !== filterPosition.toLowerCase()
        ) {
          return false
        }
        if (q) {
          const teamName = p.team_id
            ? (teamMap.get(p.team_id)?.name ?? '').toLowerCase()
            : ''
          const matchesName = p.full_name.toLowerCase().includes(q)
          const matchesId = String(p.id) === q || `#${p.id}` === q
          const matchesTeam = teamName.includes(q)
          if (!matchesName && !matchesId && !matchesTeam) return false
        }
        return true
      })
      .sort((a, b) => {
        const scoreA =
          (goalCountByPlayer.get(a.id) ?? 0) + (assistCountByPlayer.get(a.id) ?? 0)
        const scoreB =
          (goalCountByPlayer.get(b.id) ?? 0) + (assistCountByPlayer.get(b.id) ?? 0)
        return scoreB - scoreA || a.id - b.id
      })
  }, [
    players,
    searchQuery,
    filterTeamId,
    filterPosition,
    teamMap,
    goalCountByPlayer,
    assistCountByPlayer,
  ])

  const openApplications = useMemo(() => {
    return applications
      .filter((app) => {
        if (app.status !== 'open') return false
        if (filterLeagueId !== 'ALL' && app.league_id !== filterLeagueId) return false
        const pl = playerMap.get(app.player_id)
        if (pl && pl.team_id !== null) return false
        return true
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [applications, filterLeagueId, playerMap])

  const totalOpenApplicationsCount = useMemo(() => {
    return applications.filter((app) => {
      if (app.status !== 'open') return false
      const pl = playerMap.get(app.player_id)
      return !pl || pl.team_id === null
    }).length
  }, [applications, playerMap])

  const myApplications = useMemo(() => {
    if (!user) return []
    return applications.filter((a) => a.user_id === user.id && a.status === 'open')
  }, [applications, user])

  async function handleApply(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      openAuthModal()
      return
    }
    const targetLeague = applyLeagueId || activeLeagues[0]?.id
    if (!targetLeague) {
      setErrorMsg('There is no active league or tournament available to apply for.')
      return
    }

    setBusy(true)
    setErrorMsg(null)
    setInfoMsg(null)

    try {
      let playerId = myPlayer?.id

      if (!playerId) {
        const { data: createdPl, error: plErr } = await supabase
          .from('players')
          .insert({
            user_id: user.id,
            email: user.email ?? null,
            full_name:
              (user.user_metadata?.full_name as string | undefined) ||
              user.email?.split('@')[0] ||
              'Player',
            team_id: null,
            position: preferredPosition,
          })
          .select()
          .single()

        if (plErr || !createdPl) {
          throw new Error(plErr?.message || 'Could not create player profile')
        }
        playerId = createdPl.id
      }

      const existing = applications.find(
        (a) => a.league_id === Number(targetLeague) && a.player_id === playerId
      )

      if (existing) {
        const { error: updErr } = await supabase
          .from('free_agent_applications')
          .update({
            preferred_position: preferredPosition,
            note: note.trim() || null,
            status: 'open',
          })
          .eq('id', existing.id)
        if (updErr) throw new Error(updErr.message)
      } else {
        const { error: insErr } = await supabase.from('free_agent_applications').insert({
          league_id: Number(targetLeague),
          player_id: playerId,
          user_id: user.id,
          preferred_position: preferredPosition,
          note: note.trim() || null,
          status: 'open',
        })
        if (insErr) throw new Error(insErr.message)
      }

      setNote('')
      setInfoMsg('Your application is now listed under Looking for a Team.')
      await refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save application')
    } finally {
      setBusy(false)
    }
  }

  function handleWithdraw(appId: number) {
    askConfirm({
      title: 'Withdraw Application?',
      message: 'Are you sure you want to withdraw your free agent application?',
      confirmLabel: 'Yes, Withdraw',
      tone: 'warning',
      onConfirm: async () => {
        setBusy(true)
        setErrorMsg(null)
        setInfoMsg(null)

        const { error } = await supabase
          .from('free_agent_applications')
          .update({ status: 'withdrawn' })
          .eq('id', appId)

        if (error) setErrorMsg(error.message)
        else {
          setInfoMsg('Application withdrawn.')
          await refreshAll()
        }
        setBusy(false)
      },
    })
  }

  async function handleSendInvite(player: PoolPlayer) {
    if (!user || !effectiveRecruitTeamId) {
      setErrorMsg('No team available to send an invite from.')
      return
    }
    const targetTeam = teamMap.get(effectiveRecruitTeamId)

    setBusy(true)
    setErrorMsg(null)
    setInfoMsg(null)

    const { error } = await supabase.from('team_invites').insert({
      team_id: effectiveRecruitTeamId,
      player_id: player.id,
      invited_by: user.id,
      status: 'pending',
    })

    if (error) {
      setErrorMsg(`Could not send invite: ${error.message}`)
    } else {
      setInfoMsg(
        `Invite sent to ${player.full_name} for "${targetTeam?.name ?? 'Team'}".`
      )
      await refreshAll()
    }
    setBusy(false)
  }

  function handleCancelInvite(inv: TeamInvite, playerName: string) {
    askConfirm({
      title: 'Cancel Team Invite?',
      message: `Cancel the pending invite sent to ${playerName}?`,
      confirmLabel: 'Cancel Invite',
      tone: 'warning',
      onConfirm: async () => {
        setBusy(true)
        setErrorMsg(null)
        setInfoMsg(null)
        const { error } = await supabase
          .from('team_invites')
          .update({ status: 'cancelled' })
          .eq('id', inv.id)
        if (error) setErrorMsg(error.message)
        else {
          setInfoMsg(`Invite to ${playerName} cancelled.`)
          await refreshAll()
        }
        setBusy(false)
      },
    })
  }

  async function handleAcceptInvite(inv: TeamInvite) {
    if (!myPlayer) return
    const targetTeam = teamMap.get(inv.team_id)

    setBusy(true)
    setErrorMsg(null)
    setInfoMsg(null)

    try {
      const { error: plErr } = await supabase
        .from('players')
        .update({ team_id: inv.team_id })
        .eq('id', myPlayer.id)
      if (plErr) throw new Error(plErr.message)

      const { error: invErr } = await supabase
        .from('team_invites')
        .update({ status: 'accepted' })
        .eq('id', inv.id)
      if (invErr) throw new Error(invErr.message)

      await supabase
        .from('team_invites')
        .update({ status: 'declined' })
        .eq('player_id', myPlayer.id)
        .eq('status', 'pending')
        .neq('id', inv.id)

      await supabase
        .from('free_agent_applications')
        .update({ status: 'accepted' })
        .eq('player_id', myPlayer.id)
        .eq('status', 'open')

      setInfoMsg(`You have joined "${targetTeam?.name ?? 'Team'}"!`)
      await refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not accept invite')
    } finally {
      setBusy(false)
    }
  }

  function handleDeclineInvite(inv: TeamInvite) {
    const teamName = teamMap.get(inv.team_id)?.name ?? 'this team'
    askConfirm({
      title: 'Decline Team Invite?',
      message: `Are you sure you want to decline the invite from "${teamName}"?`,
      confirmLabel: 'Yes, Decline',
      tone: 'warning',
      onConfirm: async () => {
        setBusy(true)
        setErrorMsg(null)
        setInfoMsg(null)
        const { error } = await supabase
          .from('team_invites')
          .update({ status: 'declined' })
          .eq('id', inv.id)
        if (error) setErrorMsg(error.message)
        else {
          setInfoMsg(`Invite from "${teamName}" declined.`)
          await refreshAll()
        }
        setBusy(false)
      },
    })
  }

  const myCurrentTeam = myPlayer?.team_id ? teamMap.get(myPlayer.team_id) : null
  const canInvite = managedTeams.length > 0 && effectiveRecruitTeamId !== null

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div
        className={`rounded-2xl px-6 sm:px-7 py-5 flex flex-col md:flex-row md:items-end justify-between gap-4 ${DARK_CARD}`}
      >
        <PoolGlow />
        <div className="relative z-10 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-rose-400">
            UNIVERSITY FOOTBALL · SQUADS & FREE AGENTS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-white">
            Player Pool
          </h1>
          <p className="text-sm text-slate-400">
            All players are listed here. Free agents can apply or receive direct team invites from captains.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 self-start">
          {managedTeams.length > 1 && (
            <select
              value={effectiveRecruitTeamId ?? ''}
              onChange={(e) => setRecruitTeamId(Number(e.target.value))}
              className="bg-[#070D1B] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200"
            >
              {managedTeams.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0B1120] text-white">
                  Inviting as: {t.name}
                </option>
              ))}
            </select>
          )}

          <div className="inline-flex rounded-xl border border-white/10 bg-[#070D1B] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#0B1120] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              All Players ({players.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('free_agents')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'free_agents'
                  ? 'bg-[#D50C2F] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Looking for a Team ({totalOpenApplicationsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Pending Invites for Current User */}
      {myPendingInvites.length > 0 && (
        <section className={`rounded-2xl p-5 sm:p-6 space-y-3 border-emerald-400/40 ${DARK_CARD}`}>
          <PoolGlow />
          <div className="relative z-10 flex items-center gap-2 text-emerald-300 font-bold text-sm">
            <Mail className="w-4 h-4" />
            You have {myPendingInvites.length} pending team invite
            {myPendingInvites.length > 1 ? 's' : ''}!
          </div>
          <div className="relative z-10 space-y-2.5">
            {myPendingInvites.map((inv) => {
              const tm = teamMap.get(inv.team_id)
              return (
                <div
                  key={inv.id}
                  className="bg-white/[0.06] border border-white/15 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="text-sm text-slate-200">
                    <Link
                      to={`/teams/${inv.team_id}`}
                      className="font-bold text-white hover:text-rose-400"
                    >
                      {tm?.name ?? `Team #${inv.team_id}`}
                    </Link>{' '}
                    invited you to join their squad.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAcceptInvite(inv)}
                      className="bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeclineInvite(inv)}
                      className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {errorMsg && (
        <div className="bg-red-500/15 border border-red-400/40 text-red-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {errorMsg}
        </div>
      )}
      {infoMsg && (
        <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {infoMsg}
        </div>
      )}

      {/* TAB 1: ALL PLAYERS */}
      {activeTab === 'all' && (
        <section className={`rounded-2xl p-6 sm:p-7 space-y-6 ${DARK_CARD}`}>
          <PoolGlow />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 pb-5 border-b border-white/10">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by player name, team, or ID..."
                className="w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm transition"
              />
            </div>

            <div className="md:col-span-4">
              <select
                value={filterTeamId}
                onChange={(e) => setFilterTeamId(e.target.value)}
                className={DARK_INPUT}
              >
                <option value="ALL" className="bg-[#0B1120] text-white">
                  All Teams ({players.length} Players)
                </option>
                <option value="FREE" className="bg-[#0B1120] text-white">
                  Free Agents Only
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={String(t.id)} className="bg-[#0B1120] text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className={DARK_INPUT}
              >
                <option value="ALL" className="bg-[#0B1120] text-white">
                  All Positions
                </option>
                {POSITIONS.filter((pos) => pos !== 'Any').map((pos) => (
                  <option key={pos} value={pos} className="bg-[#0B1120] text-white">
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative z-10">
            {filteredAllPlayers.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">
                No players match the current filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAllPlayers.map((pl) => {
                  const tm = pl.team_id ? teamMap.get(pl.team_id) : null
                  const goals = goalCountByPlayer.get(pl.id) ?? 0
                  const assists = assistCountByPlayer.get(pl.id) ?? 0
                  const existingInvite = pendingInviteByPlayerForTargetTeam.get(pl.id)
                  const isFreeAgent = pl.team_id === null

                  return (
                    <div
                      key={pl.id}
                      className="group border border-white/10 hover:border-rose-500/60 rounded-2xl p-4 bg-white/[0.04] hover:bg-white/[0.08] transition flex flex-col justify-between gap-4"
                    >
                      <Link
                        to={`/players/${pl.id}`}
                        className="flex items-center gap-3.5 min-w-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                          {pl.photo_url ? (
                            <img
                              src={pl.photo_url}
                              alt={pl.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-semibold text-xs text-slate-300">
                              {pl.jersey_number
                                ? `#${pl.jersey_number}`
                                : pl.full_name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-white group-hover:text-rose-400 transition truncate">
                            {pl.full_name}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            ID #{pl.id} · {pl.position || 'No position'}
                            {pl.jersey_number ? ` · #${pl.jersey_number}` : ''}
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
                        {tm ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-lg truncate max-w-[58%]">
                            <Shield className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">{tm.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                            Free Agent
                          </span>
                        )}

                        <div className="flex items-center gap-3 shrink-0 font-bold tabular-nums">
                          <span
                            className="inline-flex items-center gap-1 text-emerald-400"
                            title="Goals"
                          >
                            <Target className="w-3.5 h-3.5" /> {goals}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-slate-200"
                            title="Assists"
                          >
                            <Award className="w-3.5 h-3.5 text-slate-400" /> {assists}
                          </span>
                        </div>
                      </div>

                      {canInvite && isFreeAgent && (
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          {existingInvite ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                                <Clock className="w-3.5 h-3.5" /> Invite Pending
                              </span>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleCancelInvite(existingInvite, pl.full_name)}
                                className="text-[11px] font-semibold text-rose-400 hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleSendInvite(pl)}
                              className="w-full bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white py-2 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Invite to {teamMap.get(effectiveRecruitTeamId!)?.short_name || teamMap.get(effectiveRecruitTeamId!)?.name}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: FREE AGENTS */}
      {activeTab === 'free_agents' && (
        <div className="space-y-6">
          <section className={`rounded-2xl p-6 sm:p-7 space-y-5 ${DARK_CARD}`}>
            <PoolGlow />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-rose-400">
                  FREE AGENT APPLICATION
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Looking for a Team — Apply to a Competition
                </h2>
                {myPlayer && (
                  <p className="text-xs text-slate-400 mt-1">
                    Your profile: <strong className="text-white">{myPlayer.full_name}</strong>{' '}
                    (Player ID #{myPlayer.id}) ·{' '}
                    {myCurrentTeam ? (
                      <span className="text-emerald-400 font-semibold">
                        Current Team: {myCurrentTeam.name}
                      </span>
                    ) : (
                      <span>Currently without a team</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="relative z-10">
              {!user ? (
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.04] border border-white/10 rounded-xl p-5">
                  <p className="text-sm text-slate-300">
                    Sign in or create an account to submit a free agent application.
                  </p>
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="bg-[#D50C2F] hover:bg-[#b80927] text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Sign In / Sign Up
                  </button>
                </div>
              ) : myCurrentTeam ? (
                <div className="bg-emerald-500/15 border border-emerald-400/30 rounded-xl p-4 text-sm text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    You are currently registered with <strong>{myCurrentTeam.name}</strong>.
                  </span>
                  <Link
                    to={`/teams/${myCurrentTeam.id}`}
                    className="text-xs font-semibold text-emerald-300 hover:underline"
                  >
                    Go to Team Page →
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={handleApply}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end"
                >
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Target League / Tournament
                    </label>
                    <select
                      value={applyLeagueId || activeLeagues[0]?.id || ''}
                      onChange={(e) =>
                        setApplyLeagueId(e.target.value ? Number(e.target.value) : '')
                      }
                      className={DARK_INPUT}
                    >
                      {activeLeagues.length === 0 ? (
                        <option value="" className="bg-[#0B1120] text-white">
                          No active competitions
                        </option>
                      ) : (
                        activeLeagues.map((lg) => (
                          <option key={lg.id} value={lg.id} className="bg-[#0B1120] text-white">
                            {lg.name} ({lg.season})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Position
                    </label>
                    <select
                      value={preferredPosition}
                      onChange={(e) => setPreferredPosition(e.target.value)}
                      className={DARK_INPUT}
                    >
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos} className="bg-[#0B1120] text-white">
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Short Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Left-footed, available weekdays"
                      className={DARK_INPUT}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={busy || activeLeagues.length === 0}
                      className="w-full bg-[#D50C2F] hover:bg-[#b80927] disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Apply
                    </button>
                  </div>
                </form>
              )}

              {myApplications.length > 0 && (
                <div className="pt-4 mt-4 border-t border-white/10 space-y-2.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Your Active Applications
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {myApplications.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2 text-xs flex items-center gap-2.5"
                      >
                        <span className="font-semibold text-white">
                          {leagueMap.get(app.league_id)?.name ?? `League #${app.league_id}`}
                        </span>
                        <span className="text-slate-400">({app.preferred_position})</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleWithdraw(app.id)}
                          className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Withdraw
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={`rounded-2xl p-6 sm:p-7 space-y-5 ${DARK_CARD}`}>
            <PoolGlow />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-rose-400" />
                <h2 className="text-base font-bold text-white">
                  Players Looking for a Team ({openApplications.length})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterLeagueId}
                  onChange={(e) =>
                    setFilterLeagueId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                  }
                  className="bg-[#070D1B] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200"
                >
                  <option value="ALL" className="bg-[#0B1120] text-white">
                    All Competitions
                  </option>
                  {activeLeagues.map((lg) => (
                    <option key={lg.id} value={lg.id} className="bg-[#0B1120] text-white">
                      {lg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative z-10">
              {openApplications.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  No free agents match the selected filter right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {openApplications.map((app) => {
                    const pl = playerMap.get(app.player_id)
                    const lg = leagueMap.get(app.league_id)
                    const careerGoals = goalCountByPlayer.get(app.player_id) ?? 0
                    const careerAssists = assistCountByPlayer.get(app.player_id) ?? 0
                    const existingInvite = pendingInviteByPlayerForTargetTeam.get(app.player_id)

                    return (
                      <div
                        key={app.id}
                        className="border border-white/10 rounded-2xl p-5 bg-white/[0.04] flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                              {pl?.photo_url ? (
                                <img
                                  src={pl.photo_url}
                                  alt={pl.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/players/${app.player_id}`}
                                className="font-semibold text-sm text-white hover:text-rose-400 block truncate"
                              >
                                {pl?.full_name ?? `Player #${app.player_id}`}
                              </Link>
                              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                                <span>ID #{app.player_id}</span>
                                <span>·</span>
                                <span className="font-medium text-slate-200">
                                  {app.preferred_position || pl?.position || 'Player'}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold tabular-nums">
                                  <Target className="w-3 h-3" /> {careerGoals}G {careerAssists}A
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-medium bg-white/[0.08] border border-white/10 text-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                            {lg?.name ?? `League #${app.league_id}`}
                          </span>
                        </div>

                        {app.note && (
                          <p className="text-xs text-slate-300 bg-black/25 border border-white/10 rounded-xl p-3">
                            “{app.note}”
                          </p>
                        )}

                        {canInvite && pl && (
                          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-400">
                              Target:{' '}
                              <strong className="text-white">
                                {teamMap.get(effectiveRecruitTeamId!)?.name}
                              </strong>
                            </span>
                            {existingInvite ? (
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                                  <Clock className="w-3.5 h-3.5" /> Invited
                                </span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleCancelInvite(existingInvite, pl.full_name)}
                                  className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleSendInvite(pl)}
                                className="bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" /> Send Invite
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
