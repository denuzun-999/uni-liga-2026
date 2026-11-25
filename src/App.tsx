import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import {
  Shield,
  ShieldCheck,
  Users,
  Trophy,
  Calendar,
  Plus,
  Trash2,
  Upload,
  LogIn,
  LogOut,
  Edit3,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Archive,
  RotateCcw,
  History,
  Target,
  UserPlus,
  UserMinus,
  Mail,
  Lock,
  Megaphone,
  CheckCircle2,
  UserCheck,
  Crown,
  KeyRound,
  Award,
  Image as ImageIcon,
  GitBranch,
  SlidersHorizontal,
  Monitor,
  Smartphone,
  Sparkles,
  Flame,
  Gem,
  Medal,
  Star,
  Zap,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import CreateLeagueWizard from './CreateLeagueWizard'
import MatchDetailModal, {
  formatPeriodLabel,
  getCurrentPeriodKey,
  type MatchAssistRow,
  type MatchGoalRow,
} from './MatchDetailModal'
import PlayerPoolPage, {
  type ConfirmRequest,
  type FreeAgentApplication,
  type TeamInvite,
} from './PlayerPoolPage'
import KnockoutBracketSection from './KnockoutBracketSection'
import ConfirmModal from './ConfirmModal'

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'captain' | 'member' | 'user' | 'player'
}

type League = {
  id: number
  series_name: string | null
  name: string
  type: 'league' | 'tournament'
  season: string
  team_count: number
  group_count: number
  teams_per_group?: number | null
  meetings_count?: number | null
  status?: 'active' | 'archived' | null
  is_active?: boolean | null
  show_bracket_on_home?: boolean | null
  description: string | null
}

type GroupRow = {
  id: number
  league_id: number
  name: string
  sort_order: number
}

type LeagueTeamRow = {
  id: number
  league_id: number
  group_id: number | null
  team_id: number
}

type Team = {
  id: number
  name: string
  short_name: string | null
  logo_url: string | null
  cover_url: string | null
  primary_color: string | null
  description: string | null
  captain_id: string | null
  co_captain_id: string | null
  captain_invite_code: string | null
  league_id: number | null
  group_id: number | null
}

type MatchRow = {
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

type Player = {
  id: number
  team_id: number | null
  full_name: string
  email: string | null
  user_id: string | null
  jersey_number: number | null
  position: string | null
  photo_url: string | null
  bio: string | null
  goals: number
  assists: number
}

type TeamAnnouncement = {
  id: number
  team_id: number
  author_id: string | null
  title: string
  content: string
  created_at: string
}

type SiteBackground = {
  id: number
  name: string
  desktop_url: string
  mobile_url: string | null
  is_active: boolean
  overlay_opacity: number
  created_at: string
}

type StandingRow = {
  teamId: number
  teamName: string
  shortName: string | null
  logoUrl: string | null
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

const DARK_CARD =
  'relative bg-gradient-to-br from-[#0B1120]/94 via-[#13203A]/94 to-[#0B1120]/94 backdrop-blur-md border border-slate-700/65 shadow-[0_14px_38px_rgba(2,6,23,0.45)] text-slate-100'

const DARK_INPUT =
  'w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-sm transition'

const DARK_SELECT =
  'w-full bg-[#070D1B] border border-slate-700/80 focus:border-rose-500/80 focus:outline-none text-slate-100 rounded-xl px-3.5 py-2.5 text-sm transition'

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

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

function FussballLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3.5 sm:gap-4 select-none ${className}`}>
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#E11D48]/20 via-white/5 to-transparent border border-[#E11D48]/45 shadow-[0_0_26px_rgba(225,29,72,0.28)] flex items-center justify-center shrink-0">
        <svg
          width="30"
          height="34"
          viewBox="0 0 36 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Uni Liga emblem"
        >
          <path
            d="M7 6.5V21.5A12 12 0 0 0 19 33.5"
            stroke="#F43F5E"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M15 6.5V21.5A4 4 0 0 0 19 25.5"
            stroke="#F43F5E"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M15 6.5H28.5"
            stroke="#F43F5E"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M15 15.5H25"
            stroke="#F43F5E"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="leading-none">
        <span className="font-display block text-[22px] sm:text-[28px] font-black tracking-[0.04em] text-white drop-shadow-xs">
          UNI LIGA
        </span>
        <span className="block text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-[0.24em] text-emerald-400 mt-1.5">
          FUßBALL PORTAL
        </span>
      </div>
    </div>
  )
}

function SiteBackgroundLayer({ background }: { background: SiteBackground | null }) {
  if (!background) return null
  const opacity = Math.min(0.85, Math.max(0.05, Number(background.overlay_opacity ?? 0.35)))

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 h-[100dvh] w-screen z-0 overflow-hidden pointer-events-none select-none bg-[#060B16]"
    >
      <style>{`
        @keyframes uniligaBgDesktop {
          0% { transform: scale(1.03) translate3d(0px, 0px, 0px); }
          50% { transform: scale(1.08) translate3d(-1%, -0.8%, 0px); }
          100% { transform: scale(1.03) translate3d(0px, 0px, 0px); }
        }
        @keyframes uniligaBgMobile {
          0% { transform: scale(1.01) translate3d(0px, 0px, 0px); }
          50% { transform: scale(1.035) translate3d(0px, -0.6%, 0px); }
          100% { transform: scale(1.01) translate3d(0px, 0px, 0px); }
        }
        .uniliga-bg-motion {
          animation: uniligaBgMobile 26s ease-in-out infinite;
          will-change: transform;
        }
        @media (min-width: 768px) {
          .uniliga-bg-motion {
            animation: uniligaBgDesktop 28s ease-in-out infinite;
          }
        }
      `}</style>

      {background.mobile_url ? (
        <>
          <img
            src={background.desktop_url}
            alt=""
            className="hidden md:block w-full h-full object-cover object-center uniliga-bg-motion"
          />
          <img
            src={background.mobile_url}
            alt=""
            className="block md:hidden w-full h-full object-cover object-center uniliga-bg-motion"
          />
        </>
      ) : (
        <img
          src={background.desktop_url}
          alt=""
          className="w-full h-full object-cover object-center uniliga-bg-motion"
        />
      )}

      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,11,22,0.78) 0%, rgba(11,17,32,0.56) 50%, rgba(6,11,22,0.82) 100%)',
          opacity,
        }}
      />
    </div>
  )
}

function buildSeamlessRow(list: Team[], minItems = 6): Team[] {
  if (list.length === 0) return []
  const repeats = Math.max(1, Math.ceil(minItems / list.length))
  const half: Team[] = []
  for (let i = 0; i < repeats; i++) {
    half.push(...list)
  }
  return [...half, ...half]
}

function RotatingTeamCrests({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/15 bg-white/5" />
      </div>
    )
  }

  const rowOneBase = teams.length >= 2 ? teams.filter((_, i) => i % 2 === 0) : teams
  const rowTwoBase =
    teams.length >= 2 ? teams.filter((_, i) => i % 2 === 1) : [...teams].reverse()

  const rowOne = buildSeamlessRow(rowOneBase, 6)
  const rowTwo = buildSeamlessRow(rowTwoBase, 6)

  const maskStyle = {
    WebkitMaskImage:
      'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
    maskImage:
      'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
  }

  return (
    <div className="relative flex-1 flex flex-col justify-center gap-5 py-3">
      <style>{`
        @keyframes uniligaCrestLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes uniligaCrestRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .uniliga-row-left {
          display: flex;
          width: max-content;
          animation: uniligaCrestLeft 26s linear infinite;
        }
        .uniliga-row-right {
          display: flex;
          width: max-content;
          animation: uniligaCrestRight 28s linear infinite;
        }
        .uniliga-row-left:hover,
        .uniliga-row-right:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="overflow-hidden py-1" style={maskStyle}>
        <div className="uniliga-row-left items-center">
          {rowOne.map((t, idx) => (
            <Link
              key={`r1-${t.id}-${idx}`}
              to={`/teams/${t.id}`}
              title={t.name}
              aria-label={t.name}
              className="pr-5 shrink-0 group"
            >
              <div className="w-[72px] h-[72px] rounded-full bg-white ring-2 ring-white/20 group-hover:ring-[#E11D48] group-hover:scale-105 flex items-center justify-center overflow-hidden transition duration-200 shadow-[0_8px_22px_rgba(0,0,0,0.4)]">
                {t.logo_url ? (
                  <img
                    src={t.logo_url}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display font-bold text-[13px] tracking-wide text-[#0B1120]">
                    {(t.short_name || t.name.slice(0, 2)).toUpperCase()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden py-1" style={maskStyle}>
        <div className="uniliga-row-right items-center">
          {rowTwo.map((t, idx) => (
            <Link
              key={`r2-${t.id}-${idx}`}
              to={`/teams/${t.id}`}
              title={t.name}
              aria-label={t.name}
              className="pr-5 shrink-0 group"
            >
              <div className="w-[72px] h-[72px] rounded-full bg-white ring-2 ring-white/20 group-hover:ring-emerald-400 group-hover:scale-105 flex items-center justify-center overflow-hidden transition duration-200 shadow-[0_8px_22px_rgba(0,0,0,0.4)]">
                {t.logo_url ? (
                  <img
                    src={t.logo_url}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display font-bold text-[13px] tracking-wide text-[#0B1120]">
                    {(t.short_name || t.name.slice(0, 2)).toUpperCase()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeaderboardRankBadge({
  statTab,
  rankIndex,
}: {
  statTab: 'goals' | 'assists' | 'combo'
  rankIndex: number
}) {
  if (rankIndex > 2) {
    return (
      <span className="text-xs font-bold tabular-nums w-7 text-center text-slate-500 shrink-0">
        {String(rankIndex + 1).padStart(2, '0')}
      </span>
    )
  }

  const tierStyles = [
    'bg-amber-400/15 border-amber-400/45 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.22)]',
    'bg-slate-300/15 border-slate-300/40 text-slate-200',
    'bg-orange-400/15 border-orange-400/40 text-orange-300',
  ][rankIndex]

  let IconComp = Crown
  let titleText = ''

  if (statTab === 'goals') {
    if (rankIndex === 0) {
      IconComp = Crown
      titleText = '1st — Top Scorer'
    } else if (rankIndex === 1) {
      IconComp = Trophy
      titleText = '2nd — Top Scorer'
    } else {
      IconComp = Target
      titleText = '3rd — Top Scorer'
    }
  } else if (statTab === 'assists') {
    if (rankIndex === 0) {
      IconComp = Sparkles
      titleText = '1st — Top Assists'
    } else if (rankIndex === 1) {
      IconComp = Award
      titleText = '2nd — Top Assists'
    } else {
      IconComp = Zap
      titleText = '3rd — Top Assists'
    }
  } else {
    if (rankIndex === 0) {
      IconComp = Gem
      titleText = '1st — Goals + Assists'
    } else if (rankIndex === 1) {
      IconComp = Star
      titleText = '2nd — Goals + Assists'
    } else {
      IconComp = Medal
      titleText = '3rd — Goals + Assists'
    }
  }

  return (
    <span
      title={titleText}
      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${tierStyles}`}
    >
      <IconComp className="w-3.5 h-3.5" />
    </span>
  )
}

function computeActiveGoalStreaks(
  players: Player[],
  matches: MatchRow[],
  matchGoals: MatchGoalRow[]
): Map<number, number> {
  const playedMatches = matches
    .filter((m) => m.status === 'played' && m.home_team_id !== null && m.away_team_id !== null)
    .sort((a, b) => {
      const timeA = a.match_date ? new Date(a.match_date).getTime() : 0
      const timeB = b.match_date ? new Date(b.match_date).getTime() : 0
      return timeA - timeB || a.id - b.id
    })

  const scorersByMatch = new Map<number, Set<number>>()
  const latestTeamByPlayer = new Map<number, number>()

  for (const g of matchGoals) {
    const set = scorersByMatch.get(g.match_id) ?? new Set<number>()
    set.add(g.player_id)
    scorersByMatch.set(g.match_id, set)
    latestTeamByPlayer.set(g.player_id, g.team_id)
  }

  const teamMatchesMap = new Map<number, MatchRow[]>()
  for (const m of playedMatches) {
    if (m.home_team_id !== null) {
      const arr = teamMatchesMap.get(m.home_team_id) ?? []
      arr.push(m)
      teamMatchesMap.set(m.home_team_id, arr)
    }
    if (m.away_team_id !== null) {
      const arr = teamMatchesMap.get(m.away_team_id) ?? []
      arr.push(m)
      teamMatchesMap.set(m.away_team_id, arr)
    }
  }

  const streaks = new Map<number, number>()
  for (const p of players) {
    const tId = p.team_id ?? latestTeamByPlayer.get(p.id)
    if (!tId) continue
    const tMatches = teamMatchesMap.get(tId) ?? []
    let streak = 0
    for (let i = tMatches.length - 1; i >= 0; i--) {
      const scorers = scorersByMatch.get(tMatches[i].id)
      if (scorers && scorers.has(p.id)) {
        streak++
      } else {
        break
      }
    }
    if (streak >= 2) {
      streaks.set(p.id, streak)
    }
  }

  return streaks
}

function isLeagueArchived(league: League) {
  return league.status === 'archived' || league.is_active === false
}

function getTeamsForLeague(
  leagueId: number,
  leagueTeams: LeagueTeamRow[],
  teams: Team[]
): Team[] {
  const links = leagueTeams.filter((lt) => lt.league_id === leagueId)
  if (links.length > 0) {
    const idSet = new Set(links.map((lt) => lt.team_id))
    return teams.filter((t) => idSet.has(t.id))
  }
  return teams.filter((t) => t.league_id === leagueId)
}

function getTeamsForGroup(
  leagueId: number,
  groupId: number,
  leagueTeams: LeagueTeamRow[],
  teams: Team[]
): Team[] {
  const leagueLinks = leagueTeams.filter((lt) => lt.league_id === leagueId)
  if (leagueLinks.length > 0) {
    const idSet = new Set(
      leagueLinks.filter((lt) => lt.group_id === groupId).map((lt) => lt.team_id)
    )
    return teams.filter((t) => idSet.has(t.id))
  }
  return teams.filter((t) => t.group_id === groupId)
}

function computeStandings(groupTeams: Team[], groupMatches: MatchRow[]): StandingRow[] {
  return groupTeams
    .map((team) => {
      let played = 0,
        won = 0,
        drawn = 0,
        lost = 0,
        gf = 0,
        ga = 0,
        points = 0

      for (const m of groupMatches) {
        if (m.status !== 'played') continue
        if (m.home_team_id === team.id) {
          played++
          gf += m.home_goals
          ga += m.away_goals
          if (m.home_goals > m.away_goals) {
            won++
            points += 3
          } else if (m.home_goals === m.away_goals) {
            drawn++
            points += 1
          } else {
            lost++
          }
        } else if (m.away_team_id === team.id) {
          played++
          gf += m.away_goals
          ga += m.home_goals
          if (m.away_goals > m.home_goals) {
            won++
            points += 3
          } else if (m.away_goals === m.home_goals) {
            drawn++
            points += 1
          } else {
            lost++
          }
        }
      }

      return {
        teamId: team.id,
        teamName: team.name,
        shortName: team.short_name,
        logoUrl: team.logo_url,
        played,
        won,
        drawn,
        lost,
        gf,
        ga,
        gd: gf - ga,
        points,
      }
    })
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
}

function getRankedTeamIdsForLeague(
  leagueId: number,
  groups: GroupRow[],
  leagueTeams: LeagueTeamRow[],
  teams: Team[],
  matches: MatchRow[]
): number[] {
  const lgGroups = groups.filter((g) => g.league_id === leagueId)
  const lgMatches = matches.filter((m) => m.league_id === leagueId)
  if (lgGroups.length === 0) {
    return getTeamsForLeague(leagueId, leagueTeams, teams).map((t) => t.id)
  }

  const perGroup = lgGroups.map((grp) => {
    const gTeams = getTeamsForGroup(leagueId, grp.id, leagueTeams, teams)
    const gMatches = lgMatches.filter((m) => m.group_id === grp.id)
    return computeStandings(gTeams, gMatches)
  })

  const maxLen = Math.max(0, ...perGroup.map((rows) => rows.length))
  const ordered: number[] = []
  for (let pos = 0; pos < maxLen; pos++) {
    const tier = perGroup
      .map((rows) => rows[pos])
      .filter((r): r is StandingRow => !!r)
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    for (const r of tier) {
      if (!ordered.includes(r.teamId)) ordered.push(r.teamId)
    }
  }
  return ordered
}

function getGroupGridClass(groupCount: number) {
  if (groupCount === 1) return 'grid grid-cols-1 max-w-xl mx-auto gap-5'
  if (groupCount === 2) return 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-5'
  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
}

function formatMatchDate(iso: string | null) {
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

async function uploadImageToBucket(bucket: string, file: File, prefix: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filePath = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    upsert: true,
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

function PlayerAvatar({
  photoUrl,
  name,
  jersey,
  size = 'md',
}: {
  photoUrl: string | null
  name: string
  jersey?: number | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim =
    size === 'sm' ? 'w-10 h-10 text-[11px]' : size === 'lg' ? 'w-28 h-28 text-2xl' : 'w-12 h-12 text-xs'
  return (
    <div
      className={`${dim} rounded-full border border-white/20 bg-slate-800 overflow-hidden flex items-center justify-center shrink-0`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-slate-300">
          {jersey ? `#${jersey}` : name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs tabular-nums">
        <thead className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 border-b border-white/10">
          <tr>
            <th className="py-2.5 pl-2 pr-1.5">#</th>
            <th className="py-2.5 pr-2">Team</th>
            <th className="py-2.5 px-1.5 text-center" title="Played">
              MP
            </th>
            <th className="py-2.5 px-1.5 text-center" title="Goals For">
              GF
            </th>
            <th className="py-2.5 px-1.5 text-center" title="Goals Against">
              GA
            </th>
            <th className="py-2.5 px-1.5 text-center" title="Goal Difference">
              GD
            </th>
            <th className="py-2.5 pl-1.5 pr-2 text-right" title="Points">
              PTS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08]">
          {rows.map((r, i) => (
            <tr key={r.teamId} className="transition hover:bg-white/[0.05]">
              <td className="py-3 pl-2 pr-1.5 font-semibold text-slate-400">{i + 1}</td>
              <td className="py-3 pr-2 font-semibold text-slate-100">
                <Link
                  to={`/teams/${r.teamId}`}
                  className="inline-flex items-center gap-2.5 hover:text-rose-400 transition min-w-0"
                >
                  <span className="w-6 h-6 rounded-full border border-white/25 bg-white overflow-hidden flex items-center justify-center shrink-0">
                    {r.logoUrl ? (
                      <img
                        src={r.logoUrl}
                        alt={r.teamName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-[#0B1120]">
                        {(r.shortName || r.teamName.slice(0, 2)).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="truncate">{r.teamName}</span>
                </Link>
              </td>
              <td className="py-3 px-1.5 text-center text-slate-300">{r.played}</td>
              <td className="py-3 px-1.5 text-center text-slate-300">{r.gf}</td>
              <td className="py-3 px-1.5 text-center text-slate-300">{r.ga}</td>
              <td className="py-3 px-1.5 text-center font-medium text-slate-200">
                {r.gd > 0 ? `+${r.gd}` : r.gd}
              </td>
              <td className="py-3 pl-1.5 pr-2 text-right font-bold text-white">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type PortalContext = {
  user: User | null
  profile: Profile | null
  leagues: League[]
  groups: GroupRow[]
  leagueTeams: LeagueTeamRow[]
  teams: Team[]
  matches: MatchRow[]
  matchGoals: MatchGoalRow[]
  matchAssists: MatchAssistRow[]
  players: Player[]
  freeAgents: FreeAgentApplication[]
  teamInvites: TeamInvite[]
  announcements: TeamAnnouncement[]
  backgrounds: SiteBackground[]
  loading: boolean
  refreshAll: () => Promise<void>
  openAuthModal: (initialMode?: 'login' | 'signup') => void
  openMatchModal: (matchId: number) => void
  askConfirm: (req: ConfirmRequest) => void
}

function isTeamManager(user: User | null, profile: Profile | null, team?: Team | null) {
  if (profile?.role === 'admin') return true
  if (!user || !team) return false
  return team.captain_id === user.id || team.co_captain_id === user.id
}

function getSurfaceClasses() {
  return {
    card: DARK_CARD,
    headerBox:
      'relative overflow-hidden bg-gradient-to-br from-[#0B1120]/94 via-[#13203A]/94 to-[#0B1120]/94 backdrop-blur-md border border-slate-700/65 rounded-2xl px-6 sm:px-7 py-4 shadow-[0_12px_34px_rgba(2,6,23,0.45)] text-white',
    backPill:
      'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] bg-[#0B1120]/90 backdrop-blur-md border border-slate-700/70 text-slate-200 hover:text-white hover:border-slate-500 px-3.5 py-2 rounded-xl shadow-sm transition',
  }
}

function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onSuccess,
}: {
  open: boolean
  initialMode?: 'login' | 'signup'
  onClose: () => void
  onSuccess: () => Promise<void>
}) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [captainCode, setCaptainCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setCaptainCode('')
      setMsg(null)
    }
  }, [open, initialMode])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMsg(error.message)
        setBusy(false)
        return
      }
      await onSuccess()
      onClose()
    } else {
      const cleanCode = captainCode.trim()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setMsg(error.message)
        setBusy(false)
        return
      }

      if (cleanCode) {
        if (data.session) {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('claim_captain_code', {
            invite_code: cleanCode,
          })
          if (rpcErr) {
            setMsg(`Account created, but captain code error: ${rpcErr.message}`)
            setBusy(false)
            return
          }
          await onSuccess()
          setMsg(
            `Registration complete! You are now captain of "${(rpcRes as { team_name?: string })?.team_name ?? 'Team'}".`
          )
          setBusy(false)
          return
        } else {
          setMsg(
            'Account created! If email confirmation is enabled, confirm your email and sign in, then enter your captain code in Profile.'
          )
          setBusy(false)
          return
        }
      }

      await onSuccess()
      setMsg(
        'Account created! If your captain added you with this email, your player profile has been linked automatically.'
      )
    }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#0B1120] via-[#13203A] to-[#0B1120] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">
              UNI LIGA ACCOUNT
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={DARK_INPUT}
                placeholder="e.g. Alex Miller"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={DARK_INPUT}
              placeholder="name@uni-bremen.de"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={DARK_INPUT}
              placeholder="••••••••"
            />
          </div>

          {mode === 'signup' && (
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 space-y-1.5">
              <label className="block text-xs font-semibold text-white">
                Do you have a Captain Invite Code? (Optional)
              </label>
              <input
                type="text"
                value={captainCode}
                onChange={(e) => setCaptainCode(e.target.value)}
                placeholder="e.g. CAP-2-A1B2"
                className={`${DARK_INPUT} uppercase`}
              />
              <span className="block text-[11px] text-slate-400">
                Enter the code provided by the admin to be assigned directly as that team’s captain.
              </span>
            </div>
          )}

          {msg && (
            <p className="text-xs bg-amber-500/15 border border-amber-400/35 text-amber-200 p-3 rounded-xl">
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#D50C2F] hover:bg-[#b80927] text-white font-semibold py-2.5 rounded-xl text-sm transition cursor-pointer"
          >
            {busy ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-1">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setMsg(null)
              }}
              className="underline hover:text-white cursor-pointer"
            >
              Don’t have an account? Sign up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setCaptainCode('')
                setMsg(null)
              }}
              className="underline hover:text-white cursor-pointer"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Layout({
  ctx,
  children,
}: {
  ctx: PortalContext
  children: React.ReactNode
}) {
  const location = useLocation()
  const isAdmin = ctx.profile?.role === 'admin'
  const myPlayer = ctx.user
    ? ctx.players.find((p) => p.user_id === ctx.user!.id) ??
      ctx.players.find(
        (p) =>
          p.email && ctx.user!.email && p.email.toLowerCase() === ctx.user!.email!.toLowerCase()
      )
    : null
  const myTeamId = myPlayer?.team_id ?? null

  const activeBackground = useMemo(
    () => ctx.backgrounds.find((b) => b.is_active) ?? null,
    [ctx.backgrounds]
  )
  const showSiteBg = !!activeBackground

  async function handleLogout() {
    await supabase.auth.signOut()
    await ctx.refreshAll()
  }

  function navLinkClass(isActive: boolean) {
    return `relative py-2 px-1 text-sm font-medium transition ${
      isActive
        ? 'text-white font-semibold after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-[2.5px] after:bg-[#E11D48] after:rounded-full'
        : 'text-slate-400 hover:text-white'
    }`
  }

  const isHomeActive = location.pathname === '/' || location.pathname.startsWith('/leagues')
  const isTeamsActive =
    location.pathname === '/teams' ||
    (location.pathname.startsWith('/teams/') && location.pathname !== `/teams/${myTeamId}`)
  const isPoolActive =
    location.pathname === '/pool' || location.pathname.startsWith('/players')
  const isProfileActive = location.pathname === '/profile'
  const isMyTeamActive = !!myTeamId && location.pathname === `/teams/${myTeamId}`

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${
        showSiteBg ? 'bg-transparent' : 'bg-[#060B16]'
      } text-slate-100 flex flex-col relative`}
    >
      {showSiteBg && <SiteBackgroundLayer background={activeBackground} />}

      <header className="bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800/90 sticky top-0 z-30 shadow-[0_6px_24px_rgba(2,6,23,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 min-h-[84px] sm:min-h-[92px] py-3.5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link to="/" aria-label="Uni Liga Home" className="shrink-0">
            <FussballLogo />
          </Link>

          <nav className="flex flex-wrap items-center gap-4 sm:gap-8">
            <Link to="/" className={navLinkClass(isHomeActive)}>
              Home
            </Link>
            <Link to="/teams" className={navLinkClass(isTeamsActive)}>
              Teams
            </Link>
            <Link to="/pool" className={navLinkClass(isPoolActive)}>
              Player Pool
            </Link>
            {myTeamId && (
              <Link to={`/teams/${myTeamId}`} className={navLinkClass(isMyTeamActive)}>
                My Team
              </Link>
            )}
            {ctx.user && (
              <Link to="/profile" className={navLinkClass(isProfileActive)}>
                Profile
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="hidden xl:inline text-xs font-semibold tracking-wider text-slate-400 mr-1">
              2026 / 27
            </span>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3.5 sm:px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold transition ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-white text-[#0B1120]'
                    : 'bg-[#D50C2F] hover:bg-[#b80927] text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}

            {ctx.user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <Link
                  to="/profile"
                  className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{ctx.profile?.full_name || ctx.user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => ctx.openAuthModal('login')}
                className="bg-[#D50C2F] hover:bg-[#b80927] text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 overflow-x-hidden max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1">
        {children}
      </main>
    </div>
  )
}

function HomePage({ ctx }: { ctx: PortalContext }) {
  const currentPeriod = getCurrentPeriodKey()
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPeriod)
  const [statTab, setStatTab] = useState<'goals' | 'assists' | 'combo'>('goals')

  const surfaces = getSurfaceClasses()

  const activeLeagues = useMemo(
    () => ctx.leagues.filter((l) => !isLeagueArchived(l)),
    [ctx.leagues]
  )

  const featuredLeague = activeLeagues[0] ?? null
  const otherActiveLeagues = activeLeagues.slice(1)

  const currentLeagueTeams = useMemo(() => {
    if (activeLeagues.length === 0) return ctx.teams
    const idSet = new Set<number>()
    for (const lg of activeLeagues) {
      for (const t of getTeamsForLeague(lg.id, ctx.leagueTeams, ctx.teams)) {
        idSet.add(t.id)
      }
    }
    const filtered = ctx.teams.filter((t) => idSet.has(t.id))
    return filtered.length > 0 ? filtered : ctx.teams
  }, [activeLeagues, ctx.leagueTeams, ctx.teams])

  const homeBracketLeagues = useMemo(() => {
    return activeLeagues.filter((lg) => {
      if (lg.show_bracket_on_home === false) return false
      return ctx.matches.some((m) => m.league_id === lg.id && m.stage === 'knockout')
    })
  }, [activeLeagues, ctx.matches])

  const featuredStats = useMemo(() => {
    if (!featuredLeague) return null
    const lgMatches = ctx.matches.filter(
      (m) =>
        m.league_id === featuredLeague.id &&
        m.home_team_id !== null &&
        m.away_team_id !== null
    )
    const playedMatches = lgMatches.filter((m) => m.status === 'played')
    const totalGoals = playedMatches.reduce((sum, m) => sum + m.home_goals + m.away_goals, 0)
    const nextScheduled = lgMatches.find((m) => m.status === 'scheduled') ?? null
    return {
      totalMatches: lgMatches.length,
      playedCount: playedMatches.length,
      totalGoals,
      nextScheduled,
    }
  }, [featuredLeague, ctx.matches])

  const teamMap = useMemo(() => new Map(ctx.teams.map((t) => [t.id, t.name])), [ctx.teams])

  const archivedLeaguesBySeries = useMemo(() => {
    const map = new Map<string, League[]>()
    for (const lg of ctx.leagues) {
      if (!isLeagueArchived(lg)) continue
      const key = lg.series_name?.trim() || 'Uni Liga'
      const list = map.get(key) ?? []
      list.push(lg)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [ctx.leagues])

  const activeLeagueIds = useMemo(() => new Set(activeLeagues.map((l) => l.id)), [activeLeagues])
  const activeGroups = useMemo(
    () => ctx.groups.filter((g) => activeLeagueIds.has(g.league_id)),
    [ctx.groups, activeLeagueIds]
  )

  const availablePeriods = useMemo(() => {
    const set = new Set<string>([currentPeriod])
    for (const g of ctx.matchGoals) {
      if (g.period_key) set.add(g.period_key)
    }
    for (const a of ctx.matchAssists) {
      if (a.period_key) set.add(a.period_key)
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [ctx.matchGoals, ctx.matchAssists, currentPeriod])

  const activeGoalStreaks = useMemo(
    () => computeActiveGoalStreaks(ctx.players, ctx.matches, ctx.matchGoals),
    [ctx.players, ctx.matches, ctx.matchGoals]
  )

  const leaderboardRows = useMemo(() => {
    const teamById = new Map(ctx.teams.map((t) => [t.id, t.name]))
    const goalCounts = new Map<number, number>()
    const assistCounts = new Map<number, number>()

    for (const g of ctx.matchGoals) {
      if (selectedPeriod !== 'ALL' && g.period_key !== selectedPeriod) continue
      goalCounts.set(g.player_id, (goalCounts.get(g.player_id) ?? 0) + 1)
    }

    for (const a of ctx.matchAssists) {
      if (selectedPeriod !== 'ALL' && a.period_key !== selectedPeriod) continue
      assistCounts.set(a.player_id, (assistCounts.get(a.player_id) ?? 0) + 1)
    }

    const combined = ctx.players
      .map((p) => {
        const g = goalCounts.get(p.id) ?? 0
        const a = assistCounts.get(p.id) ?? 0
        return {
          ...p,
          periodGoals: g,
          periodAssists: a,
          periodCombo: g + a,
          goalStreak: activeGoalStreaks.get(p.id) ?? 0,
          teamName: p.team_id ? teamById.get(p.team_id) ?? 'Free Agent' : 'Free Agent',
        }
      })
      .filter((row) => {
        if (statTab === 'goals') return row.periodGoals > 0
        if (statTab === 'assists') return row.periodAssists > 0
        return row.periodCombo > 0
      })

    combined.sort((a, b) => {
      if (statTab === 'goals') {
        return b.periodGoals - a.periodGoals || b.periodAssists - a.periodAssists || a.id - b.id
      }
      if (statTab === 'assists') {
        return b.periodAssists - a.periodAssists || b.periodGoals - a.periodGoals || a.id - b.id
      }
      return b.periodCombo - a.periodCombo || b.periodGoals - a.periodGoals || a.id - b.id
    })

    return combined.slice(0, 8)
  }, [ctx.matchGoals, ctx.matchAssists, ctx.players, ctx.teams, selectedPeriod, statTab, activeGoalStreaks])

  return (
    <div className="space-y-9">
      <div className="flex justify-center">
        <div className={`${surfaces.headerBox} text-center space-y-1 px-7 sm:px-10`}>
          <AmbientGlow />
          <div className="relative z-10 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-rose-400">
            UNIVERSITY FOOTBALL · SEASON {featuredLeague?.season || '2026/27'}
          </div>
          <h1 className="relative z-10 text-2xl sm:text-[32px] font-bold tracking-[-0.03em] text-white leading-tight">
            Leagues & Tournaments
          </h1>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col gap-5">
          {featuredLeague ? (
            <Link
              to={`/leagues/${featuredLeague.id}`}
              className={`group overflow-hidden rounded-2xl p-6 sm:p-7 hover:border-slate-500/80 transition flex flex-col justify-between flex-1 gap-6 ${surfaces.card}`}
            >
              <AmbientGlow />
              <div className="relative z-10 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-rose-400">
                    {featuredLeague.type === 'league'
                      ? 'FEATURED LEAGUE'
                      : 'FEATURED TOURNAMENT'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {ctx.matches.some(
                      (m) => m.league_id === featuredLeague.id && m.stage === 'knockout'
                    )
                      ? 'Knockout Stage'
                      : 'Group Stage'}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-[28px] font-bold tracking-[-0.025em] text-white group-hover:text-rose-400 transition leading-snug">
                    {featuredLeague.name}
                  </h2>
                  <div className="text-[13px] font-medium text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
                    <span>{pluralize(featuredLeague.team_count, 'Team', 'Teams')}</span>
                    <span className="text-slate-600">•</span>
                    <span>{pluralize(featuredLeague.group_count, 'Group', 'Groups')}</span>
                    <span className="text-slate-600">•</span>
                    <span>{featuredLeague.season}</span>
                  </div>
                  {featuredLeague.description && (
                    <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                      {featuredLeague.description}
                    </p>
                  )}
                </div>

                {featuredStats && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3.5 sm:px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Matches
                      </div>
                      <div className="font-display text-xl font-bold text-white tabular-nums mt-1">
                        {featuredStats.playedCount}
                        <span className="text-xs font-medium text-slate-400 ml-0.5">
                          /{featuredStats.totalMatches}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3.5 sm:px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Total Goals
                      </div>
                      <div className="font-display text-xl font-bold text-white tabular-nums mt-1">
                        {featuredStats.totalGoals}
                      </div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3.5 sm:px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Status
                      </div>
                      <div className="text-[13px] font-semibold text-emerald-400 mt-2 truncate">
                        {featuredStats.nextScheduled ? 'Fixtures Active' : 'Season Live'}
                      </div>
                    </div>
                  </div>
                )}

                {featuredStats?.nextScheduled && (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      Next Match
                    </span>
                    <span className="font-semibold text-white text-[13px]">
                      {(featuredStats.nextScheduled.home_team_id &&
                        teamMap.get(featuredStats.nextScheduled.home_team_id)) ||
                        'TBD'}{' '}
                      <span className="text-slate-500 font-normal mx-1">vs</span>{' '}
                      {(featuredStats.nextScheduled.away_team_id &&
                        teamMap.get(featuredStats.nextScheduled.away_team_id)) ||
                        'TBD'}
                    </span>
                    {featuredStats.nextScheduled.match_date && (
                      <span className="text-slate-400 font-medium tabular-nums">
                        {formatMatchDate(featuredStats.nextScheduled.match_date)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[13px] font-semibold text-rose-400 group-hover:text-rose-300 transition">
                <span>Explore league, groups, bracket & fixtures</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ) : (
            <div
              className={`overflow-hidden rounded-2xl p-8 flex flex-col justify-center gap-2 ${surfaces.card}`}
            >
              <AmbientGlow />
              <div className="relative z-10 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-rose-400">
                PRESEASON
              </div>
              <h2 className="relative z-10 text-xl font-bold text-white">No active leagues yet</h2>
              <p className="relative z-10 text-sm text-slate-400">
                Create a new league or tournament from the Admin panel to feature it here.
              </p>
            </div>
          )}
        </div>

        <div
          className={`lg:col-span-5 overflow-hidden rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-4 ${surfaces.card}`}
        >
          <AmbientGlow />
          <div className="relative z-10 text-center">
            <h2 className="text-lg font-bold tracking-[-0.02em] text-white">The Teams</h2>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <RotatingTeamCrests teams={currentLeagueTeams} />
          </div>

          <div className="relative z-10 pt-3 border-t border-white/10 flex justify-center">
            <Link
              to="/teams"
              className="text-[13px] font-semibold text-slate-200 hover:text-rose-400 inline-flex items-center gap-1.5 transition"
            >
              View All Teams <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {otherActiveLeagues.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {otherActiveLeagues.map((lg) => (
            <Link
              key={lg.id}
              to={`/leagues/${lg.id}`}
              className={`group overflow-hidden hover:border-rose-500/60 rounded-2xl p-6 transition flex items-center justify-between gap-4 ${surfaces.card}`}
            >
              <AmbientGlow />
              <div className="relative z-10 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {lg.type === 'league' ? 'LEAGUE' : 'TOURNAMENT'} · {lg.season}
                </div>
                <div className="font-display text-lg font-bold text-white group-hover:text-rose-400 transition">
                  {lg.name}
                </div>
                <div className="text-xs text-slate-400">
                  {pluralize(lg.team_count, 'Team', 'Teams')} ·{' '}
                  {pluralize(lg.group_count, 'Group', 'Groups')}
                  {lg.description ? ` · ${lg.description}` : ''}
                </div>
              </div>
              <ArrowRight className="relative z-10 w-4 h-4 text-slate-400 group-hover:text-rose-400 shrink-0 transition" />
            </Link>
          ))}
        </section>
      )}

      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] bg-[#0B1120]/90 backdrop-blur-md text-slate-300 px-4 py-1.5 rounded-full shadow-sm border border-slate-700/70">
          GROUP STANDINGS, KNOCKOUT BRACKET & LEADERBOARDS ↓
        </span>
        <div className="h-px bg-white/15 flex-1" />
      </div>

      <section className="space-y-5">
        <div
          className={`overflow-hidden flex flex-wrap items-end justify-between gap-2 rounded-2xl px-6 py-4 ${surfaces.card}`}
        >
          <AmbientGlow />
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.025em] text-white">
              {featuredLeague ? featuredLeague.name : 'Active Group Standings'}
            </h2>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400 mt-0.5">
              GROUP STAGE · LIVE STANDINGS
            </p>
          </div>
          {featuredLeague && (
            <Link
              to={`/leagues/${featuredLeague.id}`}
              className="relative z-10 text-xs font-semibold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 transition"
            >
              Fixtures & Results <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {activeGroups.length === 0 ? (
          <div className={`rounded-2xl p-6 text-sm text-slate-400 ${surfaces.card}`}>
            No groups available for active leagues.
          </div>
        ) : (
          <div className={getGroupGridClass(activeGroups.length)}>
            {activeGroups.map((grp) => {
              const grpTeams = getTeamsForGroup(grp.league_id, grp.id, ctx.leagueTeams, ctx.teams)
              const grpMatches = ctx.matches.filter((m) => m.group_id === grp.id)
              const rows = computeStandings(grpTeams, grpMatches)
              const leagueName = ctx.leagues.find((l) => l.id === grp.league_id)?.name

              return (
                <div
                  key={grp.id}
                  className={`overflow-hidden rounded-2xl p-5 space-y-3 ${surfaces.card}`}
                >
                  <AmbientGlow />
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-white">{grp.name}</h3>
                      {leagueName && (
                        <span className="text-[11px] text-slate-400">{leagueName}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {pluralize(grpTeams.length, 'TEAM', 'TEAMS')}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <StandingsTable rows={rows} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {homeBracketLeagues.map((lg) => (
        <KnockoutBracketSection
          key={lg.id}
          leagueId={lg.id}
          leagueName={lg.name}
          showOnHome={lg.show_bracket_on_home !== false}
          leagueTeams={getTeamsForLeague(lg.id, ctx.leagueTeams, ctx.teams)}
          allTeams={ctx.teams}
          groups={ctx.groups.filter((g) => g.league_id === lg.id)}
          matches={ctx.matches}
          rankedTeamIds={getRankedTeamIdsForLeague(
            lg.id,
            ctx.groups,
            ctx.leagueTeams,
            ctx.teams,
            ctx.matches
          )}
          editable={false}
          compactHomeMode={true}
          onOpenMatch={ctx.openMatchModal}
          refreshAll={ctx.refreshAll}
        />
      ))}

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-6 ${surfaces.card}`}>
        <AmbientGlow />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-rose-400 flex items-center gap-1.5">
              {statTab === 'assists' ? (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              ) : statTab === 'combo' ? (
                <Gem className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Target className="w-3.5 h-3.5 text-rose-400" />
              )}
              6-MONTH STATISTICAL LEADERS
            </div>
            <h2 className="text-2xl font-bold tracking-[-0.025em] text-white mt-1">
              {statTab === 'goals'
                ? 'Top Scorers'
                : statTab === 'assists'
                  ? 'Top Assists'
                  : 'Goals + Assists'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-xl border border-white/10 p-1 bg-[#070D1B]">
              <button
                type="button"
                onClick={() => setStatTab('goals')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statTab === 'goals'
                    ? 'bg-[#D50C2F] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Goals
              </button>
              <button
                type="button"
                onClick={() => setStatTab('assists')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statTab === 'assists'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Assists
              </button>
              <button
                type="button"
                onClick={() => setStatTab('combo')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statTab === 'combo'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Goals + Assists
              </button>
            </div>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-[#070D1B] border border-white/15 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-rose-500/80"
            >
              {availablePeriods.map((pk) => (
                <option key={pk} value={pk} className="bg-[#0B1120] text-white">
                  {formatPeriodLabel(pk)} {pk === currentPeriod ? '(Current)' : ''}
                </option>
              ))}
              <option value="ALL" className="bg-[#0B1120] text-white">
                All Time (Career)
              </option>
            </select>
          </div>
        </div>

        <div className="relative z-10">
          {leaderboardRows.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              No statistics recorded for {formatPeriodLabel(selectedPeriod)} yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {leaderboardRows.map((p, idx) => {
                const bigValue =
                  statTab === 'goals'
                    ? p.periodGoals
                    : statTab === 'assists'
                      ? p.periodAssists
                      : p.periodCombo

                const subValue =
                  statTab === 'combo' ? `${p.periodGoals}G + ${p.periodAssists}A` : p.teamName

                const isLeader = idx === 0
                const isOnFire = p.goalStreak >= 2

                return (
                  <Link
                    key={p.id}
                    to={`/players/${p.id}`}
                    className={`group rounded-2xl p-4 transition flex items-center justify-between gap-3 border ${
                      isLeader
                        ? 'bg-gradient-to-r from-[#E11D48]/18 via-white/[0.06] to-white/[0.03] border-[#E11D48]/45 hover:border-[#E11D48]/80'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <LeaderboardRankBadge statTab={statTab} rankIndex={idx} />
                      <PlayerAvatar
                        photoUrl={p.photo_url}
                        name={p.full_name}
                        jersey={p.jersey_number}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[14.5px] text-white group-hover:text-rose-400 truncate transition">
                            {p.full_name}
                          </span>
                          {isOnFire && (
                            <span
                              title={`On Fire! Scored in ${p.goalStreak} consecutive matches`}
                              className="inline-flex items-center gap-0.5 text-orange-400 bg-orange-500/15 border border-orange-400/35 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                            >
                              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">{subValue}</div>
                      </div>
                    </div>

                    <span
                      className={`font-display text-2xl font-bold tabular-nums shrink-0 pr-1 ${
                        isLeader ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {bigValue}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {archivedLeaguesBySeries.length > 0 && (
        <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-5 ${surfaces.card}`}>
          <AmbientGlow />
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Past Seasons (Archive)
            </h2>
            <span className="text-xs text-slate-400">Historical standings and results</span>
          </div>

          <div className="relative z-10 space-y-4">
            {archivedLeaguesBySeries.map(([series, list]) => (
              <div key={series} className="space-y-2.5">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {series} — Archive
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((lg) => (
                    <Link
                      key={lg.id}
                      to={`/leagues/${lg.id}`}
                      className="border border-white/10 hover:border-white/25 rounded-xl p-4 bg-white/[0.04] hover:bg-white/[0.08] transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-white truncate">{lg.name}</span>
                        <span className="text-[11px] font-medium bg-white/10 text-slate-200 px-2 py-0.5 rounded-md shrink-0">
                          {lg.season}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1.5">
                        Archived · {pluralize(lg.team_count, 'Team', 'Teams')} ·{' '}
                        {pluralize(lg.group_count, 'Group', 'Groups')}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TeamsPage({ ctx }: { ctx: PortalContext }) {
  const surfaces = getSurfaceClasses()

  return (
    <div className="space-y-8">
      <div className={`flex flex-wrap items-end justify-between gap-4 ${surfaces.headerBox}`}>
        <AmbientGlow />
        <div className="relative z-10 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-rose-400">
            UNIVERSITY FOOTBALL · CLUBS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-white">Teams</h1>
          <p className="text-sm text-slate-400">
            All participating clubs. Click a team to view its squad, announcements, and matches.
          </p>
        </div>
        <span className="relative z-10 text-xs font-semibold uppercase tracking-wider bg-white/[0.06] border border-white/15 text-slate-200 px-3.5 py-2 rounded-xl">
          Total {pluralize(ctx.teams.length, 'Team', 'Teams')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ctx.teams.map((team) => {
          const teamPlayerCount = ctx.players.filter((p) => p.team_id === team.id).length
          return (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className={`group overflow-hidden hover:border-rose-500/60 rounded-2xl p-5 flex items-center justify-between gap-4 transition ${surfaces.card}`}
            >
              <AmbientGlow />
              <div className="relative z-10 flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-full border-2 border-white/20 group-hover:border-[#E11D48] bg-white flex items-center justify-center overflow-hidden shrink-0 transition shadow-md">
                  {team.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display font-bold text-sm text-[#0B1120]">
                      {(team.short_name || team.name.slice(0, 2)).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-base text-white group-hover:text-rose-400 truncate transition">
                    {team.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {pluralize(teamPlayerCount, 'Registered Player', 'Registered Players')}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="relative z-10 w-4 h-4 text-slate-500 group-hover:text-rose-400 shrink-0 transition" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function LeagueDetailPage({ ctx }: { ctx: PortalContext }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const leagueId = Number(id)
  const isAdmin = ctx.profile?.role === 'admin'
  const surfaces = getSurfaceClasses()

  const [manageMode, setManageMode] = useState(() => searchParams.get('manage') === '1')
  const [deletingMatchId, setDeletingMatchId] = useState<number | null>(null)

  const league = ctx.leagues.find((l) => l.id === leagueId)
  const leagueGroups = ctx.groups.filter((g) => g.league_id === leagueId)
  const leagueTeams = getTeamsForLeague(leagueId, ctx.leagueTeams, ctx.teams)
  const leagueMatches = ctx.matches.filter((m) => m.league_id === leagueId)
  const playableLeagueMatches = leagueMatches.filter(
    (m) => m.home_team_id !== null && m.away_team_id !== null
  )
  const teamMap = new Map(ctx.teams.map((t) => [t.id, t.name]))

  const rankedTeamIds = useMemo(
    () =>
      getRankedTeamIdsForLeague(
        leagueId,
        ctx.groups,
        ctx.leagueTeams,
        ctx.teams,
        ctx.matches
      ),
    [leagueId, ctx.groups, ctx.leagueTeams, ctx.teams, ctx.matches]
  )

  if (!league) {
    return (
      <div className={`rounded-2xl p-7 space-y-3 ${surfaces.card}`}>
        <p className="text-slate-300">Competition not found.</p>
        <Link to="/" className="text-sm font-semibold text-rose-400 hover:underline">
          ← Back to Home
        </Link>
      </div>
    )
  }

  const archived = isLeagueArchived(league)
  const playedCount = playableLeagueMatches.filter((m) => m.status === 'played').length

  function handleDeleteMatch(matchId: number) {
    ctx.askConfirm({
      title: 'Delete Match?',
      message: 'Are you sure you want to delete this match along with its goals and assists?',
      confirmLabel: 'Yes, Delete Match',
      onConfirm: async () => {
        setDeletingMatchId(matchId)
        await supabase.from('matches').delete().eq('id', matchId)
        await ctx.refreshAll()
        setDeletingMatchId(null)
      },
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className={surfaces.backPill}>
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setManageMode((v) => !v)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
              manageMode
                ? 'bg-[#D50C2F] text-white'
                : 'bg-[#0B1120] border border-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {manageMode ? 'Done Managing' : 'Manage Matches & Bracket'}
          </button>
        )}
      </div>

      <section
        className={`overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 ${surfaces.card}`}
      >
        <AmbientGlow />
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-rose-400">
              {league.series_name || 'UNI LIGA'} · {league.season}
            </span>
            {archived ? (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 inline-flex items-center gap-1">
                <Archive className="w-3 h-3" /> Archived
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">{league.name}</h1>
          {league.description && <p className="text-sm text-slate-300">{league.description}</p>}
        </div>

        <div className="relative z-10 flex items-center gap-6 sm:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-white/10 tabular-nums shrink-0">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Teams
            </div>
            <div className="font-display text-2xl font-bold text-white">{leagueTeams.length}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Groups
            </div>
            <div className="font-display text-2xl font-bold text-white">{leagueGroups.length}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Played
            </div>
            <div className="font-display text-2xl font-bold text-emerald-400">
              {playedCount}
              <span className="text-sm font-medium text-slate-400">
                /{playableLeagueMatches.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {leagueGroups.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] bg-[#0B1120]/90 backdrop-blur-md text-slate-300 px-3.5 py-1.5 rounded-full shadow-sm border border-slate-700/70">
              GROUPS & STANDINGS
            </span>
          </div>
          <div className={getGroupGridClass(leagueGroups.length)}>
            {leagueGroups.map((grp) => {
              const gTeams = getTeamsForGroup(leagueId, grp.id, ctx.leagueTeams, ctx.teams)
              const gMatches = leagueMatches.filter((m) => m.group_id === grp.id)
              const rows = computeStandings(gTeams, gMatches)
              return (
                <div
                  key={grp.id}
                  className={`overflow-hidden rounded-2xl p-5 space-y-3 ${surfaces.card}`}
                >
                  <AmbientGlow />
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-bold text-base text-white">{grp.name}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {pluralize(gTeams.length, 'TEAM', 'TEAMS')}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <StandingsTable rows={rows} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <KnockoutBracketSection
        leagueId={league.id}
        leagueName={league.name}
        showOnHome={league.show_bracket_on_home !== false}
        leagueTeams={leagueTeams}
        allTeams={ctx.teams}
        groups={leagueGroups}
        matches={ctx.matches}
        rankedTeamIds={rankedTeamIds}
        editable={isAdmin && manageMode}
        onOpenMatch={ctx.openMatchModal}
        refreshAll={ctx.refreshAll}
      />

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-4 ${surfaces.card}`}>
        <AmbientGlow />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-400" /> Fixtures & Matches
          </h2>
          <span className="text-xs text-slate-400">
            Click a match to view goals/assists or enter scores
          </span>
        </div>

        <div className="relative z-10">
          {playableLeagueMatches.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              No matches scheduled for this competition yet.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.08]">
              {playableLeagueMatches.map((m) => {
                const formattedDate = formatMatchDate(m.match_date)
                const goalCount = ctx.matchGoals.filter((g) => g.match_id === m.id).length
                const assistCount = ctx.matchAssists.filter((a) => a.match_id === m.id).length
                return (
                  <div
                    key={m.id}
                    className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.05] flex flex-wrap items-center justify-between gap-4 transition"
                  >
                    <button
                      type="button"
                      onClick={() => ctx.openMatchModal(m.id)}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {m.round_label && (
                          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {m.round_label}
                          </span>
                        )}
                        {m.stage === 'knockout' && (
                          <span className="text-[10px] font-semibold uppercase bg-rose-500/15 text-rose-300 border border-rose-400/25 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <GitBranch className="w-3 h-3" /> Knockout
                          </span>
                        )}
                        {m.stage === 'custom' && (
                          <span className="text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-300 border border-amber-400/25 px-2 py-0.5 rounded-md">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[15px] font-semibold text-white mt-0.5">
                        {(m.home_team_id && teamMap.get(m.home_team_id)) || 'TBD'}{' '}
                        <span className="text-slate-500 font-normal mx-1.5">vs</span>{' '}
                        {(m.away_team_id && teamMap.get(m.away_team_id)) || 'TBD'}
                      </div>
                      {(formattedDate || m.pitch || goalCount > 0 || assistCount > 0) && (
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                          {formattedDate && <span>{formattedDate}</span>}
                          {m.pitch && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                              <MapPin className="w-3 h-3" /> Pitch {m.pitch}
                            </span>
                          )}
                          {goalCount > 0 && (
                            <span className="text-slate-400">
                              {pluralize(goalCount, 'goal', 'goals')}
                            </span>
                          )}
                          {assistCount > 0 && (
                            <span className="text-slate-400">
                              {pluralize(assistCount, 'assist', 'assists')}
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => ctx.openMatchModal(m.id)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        {m.status === 'played' ? (
                          <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-sm tabular-nums">
                            {m.home_goals} - {m.away_goals}
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] text-slate-300 text-xs font-medium">
                            Scheduled
                          </span>
                        )}
                        <span className="text-xs font-semibold text-rose-400 inline-flex items-center gap-1">
                          Details <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      {isAdmin && manageMode && m.stage !== 'knockout' && (
                        <button
                          type="button"
                          disabled={deletingMatchId === m.id}
                          onClick={() => handleDeleteMatch(m.id)}
                          title="Delete match"
                          className="text-rose-400 hover:bg-rose-500/15 p-1.5 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className={`overflow-hidden rounded-2xl p-6 space-y-4 ${surfaces.card}`}>
        <AmbientGlow />
        <h2 className="relative z-10 text-base font-bold text-white">Participating Teams</h2>
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {leagueTeams.map((t) => (
            <Link
              key={t.id}
              to={`/teams/${t.id}`}
              className="border border-white/10 hover:border-rose-500/60 rounded-xl p-3 flex items-center gap-3 transition bg-white/[0.04] hover:bg-white/[0.08]"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-white/25 overflow-hidden flex items-center justify-center shrink-0">
                {t.logo_url ? (
                  <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#0B1120]">
                    {t.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-white truncate">{t.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function TeamDetailPage({ ctx }: { ctx: PortalContext }) {
  const { id } = useParams()
  const teamId = Number(id)
  const surfaces = getSurfaceClasses()

  const team = ctx.teams.find((t) => t.id === teamId)
  const teamPlayers = ctx.players.filter((p) => p.team_id === teamId)
  const teamMatches = ctx.matches.filter(
    (m) =>
      (m.home_team_id === teamId || m.away_team_id === teamId) &&
      m.home_team_id !== null &&
      m.away_team_id !== null
  )
  const teamAnnouncements = ctx.announcements
    .filter((a) => a.team_id === teamId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const teamMap = new Map(ctx.teams.map((t) => [t.id, t.name]))

  const canManage = isTeamManager(ctx.user, ctx.profile, team)
  const isMainCaptainOrAdmin =
    ctx.profile?.role === 'admin' ||
    (!!ctx.user && !!team?.captain_id && ctx.user.id === team.captain_id)
  const myPlayerInTeam = ctx.user
    ? teamPlayers.find((p) => p.user_id === ctx.user!.id)
    : undefined

  const isTeamMember = canManage || !!myPlayerInTeam

  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  const [editingTeam, setEditingTeam] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerEmail, setNewPlayerEmail] = useState('')
  const [newJersey, setNewJersey] = useState('')
  const [newPosition, setNewPosition] = useState('Midfielder')
  const [newBio, setNewBio] = useState('')
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [savingPlayer, setSavingPlayer] = useState(false)

  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [savingAnn, setSavingAnn] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (team) {
      setTeamName(team.name)
      setTeamDesc(team.description ?? '')
    }
  }, [team])

  if (!team) {
    return (
      <div className={`rounded-2xl p-7 space-y-3 ${surfaces.card}`}>
        <p className="text-slate-300">Team not found.</p>
        <Link to="/teams" className="text-sm font-semibold text-rose-400 hover:underline">
          ← Back to Teams
        </Link>
      </div>
    )
  }

  async function handleSaveTeamInfo(e: FormEvent) {
    e.preventDefault()
    setFeedback(null)
    setErrorMsg(null)
    const { error } = await supabase
      .from('teams')
      .update({ name: teamName, description: teamDesc })
      .eq('id', team!.id)
    if (error) setErrorMsg(error.message)
    else {
      setEditingTeam(false)
      setFeedback('Team details updated.')
      await ctx.refreshAll()
    }
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    setFeedback(null)
    setErrorMsg(null)
    try {
      const url = await uploadImageToBucket('team-logos', file, `team-${team!.id}`)
      const { error } = await supabase.from('teams').update({ logo_url: url }).eq('id', team!.id)
      if (error) throw new Error(error.message)
      setFeedback('Team crest updated.')
      await ctx.refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not upload crest')
    } finally {
      setUploadingLogo(false)
    }
  }

  function handleRemoveLogo() {
    ctx.askConfirm({
      title: 'Remove Team Crest?',
      message: `Are you sure you want to remove the crest of "${team!.name}"?`,
      confirmLabel: 'Remove Crest',
      onConfirm: async () => {
        setUploadingLogo(true)
        setFeedback(null)
        setErrorMsg(null)
        const { error } = await supabase.from('teams').update({ logo_url: null }).eq('id', team!.id)
        if (error) setErrorMsg(error.message)
        else {
          setFeedback('Team crest removed.')
          await ctx.refreshAll()
        }
        setUploadingLogo(false)
      },
    })
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    setFeedback(null)
    setErrorMsg(null)
    try {
      const url = await uploadImageToBucket('team-logos', file, `cover-${team!.id}`)
      const { error } = await supabase.from('teams').update({ cover_url: url }).eq('id', team!.id)
      if (error) throw new Error(error.message)
      setFeedback('Cover photo updated.')
      await ctx.refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not upload cover photo')
    } finally {
      setUploadingCover(false)
    }
  }

  function handleRemoveCover() {
    ctx.askConfirm({
      title: 'Remove Cover Photo?',
      message: `Are you sure you want to remove the cover photo of "${team!.name}"?`,
      confirmLabel: 'Remove Cover',
      onConfirm: async () => {
        setUploadingCover(true)
        setFeedback(null)
        setErrorMsg(null)
        const { error } = await supabase.from('teams').update({ cover_url: null }).eq('id', team!.id)
        if (error) setErrorMsg(error.message)
        else {
          setFeedback('Cover photo removed.')
          await ctx.refreshAll()
        }
        setUploadingCover(false)
      },
    })
  }

  async function handleAddPlayer(e: FormEvent) {
    e.preventDefault()
    if (!newPlayerName.trim()) return
    setSavingPlayer(true)
    setFeedback(null)
    setErrorMsg(null)

    try {
      let photoUrl: string | null = null
      if (newPhotoFile) {
        photoUrl = await uploadImageToBucket('player-avatars', newPhotoFile, `team-${team!.id}`)
      }

      const cleanEmail = newPlayerEmail.trim().toLowerCase() || null

      if (cleanEmail) {
        const existingByEmail = ctx.players.find(
          (p) => p.email && p.email.toLowerCase() === cleanEmail
        )
        if (existingByEmail) {
          if (existingByEmail.team_id !== null && existingByEmail.team_id !== team!.id) {
            throw new Error(
              `This email (${cleanEmail}) is already assigned to another team (Player ID #${existingByEmail.id}).`
            )
          }
          const { error: updErr } = await supabase
            .from('players')
            .update({
              team_id: team!.id,
              full_name: newPlayerName.trim(),
              jersey_number: newJersey ? Number(newJersey) : existingByEmail.jersey_number,
              position: newPosition || existingByEmail.position,
              bio: newBio.trim() || existingByEmail.bio,
              photo_url: photoUrl || existingByEmail.photo_url,
            })
            .eq('id', existingByEmail.id)

          if (updErr) throw new Error(updErr.message)

          await supabase
            .from('free_agent_applications')
            .update({ status: 'accepted' })
            .eq('player_id', existingByEmail.id)
            .eq('status', 'open')

          setNewPlayerName('')
          setNewPlayerEmail('')
          setNewJersey('')
          setNewBio('')
          setNewPhotoFile(null)
          setFeedback(
            'Existing player account matched and linked to this squad while keeping ID and stats.'
          )
          await ctx.refreshAll()
          return
        }
      }

      const { error } = await supabase.from('players').insert({
        team_id: team!.id,
        full_name: newPlayerName.trim(),
        email: cleanEmail,
        jersey_number: newJersey ? Number(newJersey) : null,
        position: newPosition,
        bio: newBio.trim() || null,
        photo_url: photoUrl,
      })
      if (error) throw new Error(error.message)

      setNewPlayerName('')
      setNewPlayerEmail('')
      setNewJersey('')
      setNewBio('')
      setNewPhotoFile(null)
      setFeedback(
        cleanEmail
          ? 'Player added to squad and Player Pool. Will link automatically upon signing up with this email.'
          : 'Player added to squad and Player Pool.'
      )
      await ctx.refreshAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not add player')
    } finally {
      setSavingPlayer(false)
    }
  }

  function handleRemovePlayerFromTeam(player: Player) {
    if (team!.captain_id && player.user_id === team!.captain_id) {
      setErrorMsg('The main captain cannot be removed from the squad here.')
      return
    }
    ctx.askConfirm({
      title: 'Remove Player from Squad?',
      message: `Remove ${player.full_name} from "${team!.name}"? They will move to the general Player Pool as a Free Agent with all stats preserved.`,
      confirmLabel: 'Yes, Remove Player',
      onConfirm: async () => {
        setFeedback(null)
        setErrorMsg(null)
        const { error } = await supabase
          .from('players')
          .update({ team_id: null })
          .eq('id', player.id)
        if (error) {
          setErrorMsg(error.message)
          return
        }
        if (player.user_id && team!.co_captain_id === player.user_id) {
          await supabase.from('teams').update({ co_captain_id: null }).eq('id', team!.id)
        }
        setFeedback(
          `${player.full_name} was moved to the Player Pool (Free Agent). Stats and ID #${player.id} preserved.`
        )
        await ctx.refreshAll()
      },
    })
  }

  function handleLeaveTeam() {
    if (!myPlayerInTeam || !ctx.user) return
    const isLeavingMainCaptain = team!.captain_id === ctx.user.id
    ctx.askConfirm({
      title: 'Leave Team?',
      message: isLeavingMainCaptain
        ? `You are the main captain of "${team!.name}". If you leave, you will move to the Player Pool and the team will have no captain until reassigned. Continue?`
        : `Are you sure you want to leave "${team!.name}"? You will move to the general Player Pool as a Free Agent.`,
      confirmLabel: 'Yes, Leave Team',
      tone: 'warning',
      onConfirm: async () => {
        setFeedback(null)
        setErrorMsg(null)
        const { error } = await supabase
          .from('players')
          .update({ team_id: null })
          .eq('id', myPlayerInTeam.id)
        if (error) {
          setErrorMsg(error.message)
          return
        }
        if (team!.co_captain_id === ctx.user!.id) {
          await supabase.from('teams').update({ co_captain_id: null }).eq('id', team!.id)
        }
        if (team!.captain_id === ctx.user!.id) {
          await supabase.from('teams').update({ captain_id: null }).eq('id', team!.id)
        }
        setFeedback(`You left "${team!.name}" and moved to the Player Pool.`)
        await ctx.refreshAll()
      },
    })
  }

  function handleToggleCoCaptain(player: Player) {
    if (!player.user_id) return
    const isCurrentlyCoCaptain = team!.co_captain_id === player.user_id
    ctx.askConfirm({
      title: isCurrentlyCoCaptain ? 'Remove 2nd Captain?' : 'Appoint 2nd Captain?',
      message: isCurrentlyCoCaptain
        ? `Remove 2nd Captain permissions from ${player.full_name}?`
        : `Make ${player.full_name} the 2nd Captain of "${team!.name}"? They will be able to manage squad, invites, announcements, and match scores.`,
      confirmLabel: isCurrentlyCoCaptain ? 'Remove Role' : 'Appoint 2nd Captain',
      tone: 'warning',
      onConfirm: async () => {
        setFeedback(null)
        setErrorMsg(null)
        const { error } = await supabase
          .from('teams')
          .update({ co_captain_id: isCurrentlyCoCaptain ? null : player.user_id })
          .eq('id', team!.id)
        if (error) setErrorMsg(error.message)
        else {
          setFeedback(
            isCurrentlyCoCaptain
              ? `${player.full_name} is no longer 2nd Captain.`
              : `${player.full_name} is now 2nd Captain of "${team!.name}".`
          )
          await ctx.refreshAll()
        }
      },
    })
  }

  async function handlePostAnnouncement(e: FormEvent) {
    e.preventDefault()
    if (!annTitle.trim() || !annContent.trim()) return
    setSavingAnn(true)
    setFeedback(null)
    setErrorMsg(null)

    const { error } = await supabase.from('team_announcements').insert({
      team_id: team!.id,
      author_id: ctx.user?.id ?? null,
      title: annTitle.trim(),
      content: annContent.trim(),
    })

    if (error) setErrorMsg(`Could not post announcement: ${error.message}`)
    else {
      setAnnTitle('')
      setAnnContent('')
      setFeedback('Team announcement posted.')
      await ctx.refreshAll()
    }
    setSavingAnn(false)
  }

  function handleDeleteAnnouncement(annId: number) {
    ctx.askConfirm({
      title: 'Delete Announcement?',
      message: 'Are you sure you want to delete this team announcement?',
      confirmLabel: 'Yes, Delete',
      onConfirm: async () => {
        setFeedback(null)
        setErrorMsg(null)
        const { error } = await supabase.from('team_announcements').delete().eq('id', annId)
        if (error) setErrorMsg(error.message)
        else {
          setFeedback('Announcement deleted.')
          await ctx.refreshAll()
        }
      },
    })
  }

  return (
    <div className="space-y-8">
      <Link to="/teams" className={surfaces.backPill}>
        <ArrowLeft className="w-3.5 h-3.5" /> All Teams
      </Link>

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

      <section className={`overflow-hidden rounded-2xl ${surfaces.card}`}>
        <AmbientGlow />
        {team.cover_url && (
          <div className="relative z-10 h-44 sm:h-56 w-full bg-[#060B16] border-b border-white/10 overflow-hidden">
            <img
              src={team.cover_url}
              alt={`${team.name} cover`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full border-2 border-white/30 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                {team.logo_url ? (
                  <img
                    src={team.logo_url}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display font-bold text-xl text-[#0B1120]">
                    {(team.short_name || team.name.slice(0, 2)).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-rose-400">
                  CLUB PROFILE · {pluralize(teamPlayers.length, 'PLAYER', 'PLAYERS')}
                </div>
                <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">{team.name}</h1>
                <p className="text-sm text-slate-400">
                  {team.description || 'No description added for this team yet.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManage && (
                <>
                  <label className="cursor-pointer bg-white/10 border border-white/15 hover:bg-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {uploadingCover ? 'Uploading...' : 'Upload Cover'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleCoverUpload(f)
                      }}
                    />
                  </label>
                  {team.cover_url && (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/25 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Cover
                    </button>
                  )}

                  <label className="cursor-pointer bg-white/10 border border-white/15 hover:bg-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Crest'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleLogoUpload(f)
                      }}
                    />
                  </label>
                  {team.logo_url && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/25 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Crest
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingTeam((v) => !v)}
                    className="bg-[#D50C2F] hover:bg-[#b80927] text-white px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Team
                  </button>
                </>
              )}

              {myPlayerInTeam && (
                <button
                  type="button"
                  onClick={handleLeaveTeam}
                  className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Leave Team
                </button>
              )}
            </div>
          </div>

          {canManage && editingTeam && (
            <form
              onSubmit={handleSaveTeamInfo}
              className="mt-6 pt-5 border-t border-white/10 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={DARK_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className={DARK_INPUT}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-[#16A34A] hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeam(false)}
                  className="bg-white/10 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {isTeamMember && (
        <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-5 ${surfaces.card}`}>
          <AmbientGlow />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-rose-400" />
              Team Announcements & Notes
            </h2>
            <span className="text-[11px] font-semibold bg-white/10 text-slate-300 px-3 py-1 rounded-full inline-flex items-center gap-1">
              <Lock className="w-3 h-3" /> Team Members Only
            </span>
          </div>

          {canManage && (
            <form
              onSubmit={handlePostAnnouncement}
              className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Thursday 19:00 Training"
                    className={DARK_INPUT}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Message / Tactics / Meeting Point
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="e.g. Meet at Pitch 1 gate 30 mins before kickoff."
                      className={DARK_INPUT}
                    />
                    <button
                      type="submit"
                      disabled={savingAnn}
                      className="bg-[#D50C2F] hover:bg-[#b80927] text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition"
                    >
                      {savingAnn ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          <div className="relative z-10">
            {teamAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-400">No team announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {teamAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="border border-white/10 rounded-xl p-4 bg-white/[0.04] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-white">{ann.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {formatMatchDate(ann.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{ann.content}</p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        title="Delete Announcement"
                        className="text-rose-400 hover:bg-rose-500/15 p-1.5 rounded-lg shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-5 ${surfaces.card}`}>
        <AmbientGlow />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <h2 className="text-lg font-bold text-white">
            Squad ({pluralize(teamPlayers.length, 'Player', 'Players')})
          </h2>
          {canManage && (
            <Link
              to="/pool"
              className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite from Player Pool →
            </Link>
          )}
        </div>

        {canManage && (
          <form
            onSubmit={handleAddPlayer}
            className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Player Name</label>
              <input
                type="text"
                required
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Full Name"
                className={DARK_INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email (Auto-Link)
              </label>
              <input
                type="email"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
                placeholder="player@uni-bremen.de"
                className={DARK_INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Jersey #</label>
              <input
                type="number"
                min={1}
                max={99}
                value={newJersey}
                onChange={(e) => setNewJersey(e.target.value)}
                placeholder="10"
                className={DARK_INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Position</label>
              <input
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="Left Back / Forward"
                className={DARK_INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-slate-300"
              />
            </div>
            <button
              type="submit"
              disabled={savingPlayer}
              className="bg-[#D50C2F] hover:bg-[#b80927] text-white font-semibold py-2.5 px-4 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              {savingPlayer ? 'Adding...' : 'Add Player'}
            </button>
            <div className="sm:col-span-2 lg:col-span-6">
              <input
                type="text"
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Short player note or bio (optional)"
                className={DARK_INPUT}
              />
            </div>
          </form>
        )}

        <div className="relative z-10">
          {teamPlayers.length === 0 ? (
            <p className="text-sm text-slate-400">No players added to this squad yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamPlayers.map((p) => {
                const totalGoals = ctx.matchGoals.filter((g) => g.player_id === p.id).length
                const totalAssists = ctx.matchAssists.filter((a) => a.player_id === p.id).length
                const isSelf = !!ctx.user && p.user_id === ctx.user.id
                const isCaptain = !!team.captain_id && p.user_id === team.captain_id
                const isCoCaptain = !!team.co_captain_id && p.user_id === team.co_captain_id
                const canKickThisPlayer = canManage && !isSelf && !isCaptain
                const canPromoteCoCaptain = isMainCaptainOrAdmin && !!p.user_id && !isCaptain

                return (
                  <div
                    key={p.id}
                    className="border border-white/10 hover:border-rose-500/60 rounded-2xl p-4 flex items-center justify-between gap-3 transition bg-white/[0.04] hover:bg-white/[0.08]"
                  >
                    <Link
                      to={`/players/${p.id}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1"
                    >
                      <PlayerAvatar
                        photoUrl={p.photo_url}
                        name={p.full_name}
                        jersey={p.jersey_number}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-sm text-white truncate">
                            {p.full_name}
                          </span>
                          {isCaptain && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/35 px-1.5 py-0.5 rounded-md">
                              <Crown className="w-2.5 h-2.5" /> C
                            </span>
                          )}
                          {isCoCaptain && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-300 bg-sky-500/15 border border-sky-400/35 px-1.5 py-0.5 rounded-md">
                              <ShieldCheck className="w-2.5 h-2.5" /> 2C
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5 tabular-nums">
                          ID #{p.id} · {totalGoals}G {totalAssists}A
                        </div>
                        {canManage && (
                          <div className="mt-1.5">
                            {p.user_id ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Account Linked
                              </span>
                            ) : p.email ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md truncate max-w-full">
                                <Mail className="w-3 h-3 shrink-0" /> Pending ({p.email})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">No email</span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-1 shrink-0">
                      {canPromoteCoCaptain && (
                        <button
                          type="button"
                          onClick={() => handleToggleCoCaptain(p)}
                          title={isCoCaptain ? 'Remove 2nd Captain' : 'Make 2nd Captain'}
                          className={`p-2 rounded-xl cursor-pointer transition ${
                            isCoCaptain
                              ? 'text-sky-300 bg-sky-500/20 hover:bg-sky-500/30'
                              : 'text-slate-400 hover:text-sky-300 hover:bg-sky-500/15'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}
                      {canKickThisPlayer && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerFromTeam(p)}
                          title="Remove from Squad (Move to Player Pool)"
                          className="text-rose-400 hover:bg-rose-500/15 p-2 rounded-xl cursor-pointer transition"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-4 ${surfaces.card}`}>
        <AmbientGlow />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <h2 className="text-lg font-bold text-white">Matches</h2>
          {canManage && (
            <span className="text-xs text-emerald-400 font-semibold">
              Click a match to enter score, goals, and assists
            </span>
          )}
        </div>
        <div className="relative z-10">
          {teamMatches.length === 0 ? (
            <p className="text-sm text-slate-400">No matches found.</p>
          ) : (
            <div className="divide-y divide-white/[0.08] text-sm">
              {teamMatches.map((m) => {
                const formattedDate = formatMatchDate(m.match_date)
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => ctx.openMatchModal(m.id)}
                    className="w-full text-left py-3.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.05] flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {(m.home_team_id && teamMap.get(m.home_team_id)) || 'TBD'}{' '}
                        <span className="text-slate-500 font-normal mx-1">vs</span>{' '}
                        {(m.away_team_id && teamMap.get(m.away_team_id)) || 'TBD'}
                      </div>
                      {(formattedDate || m.pitch) && (
                        <div className="text-xs text-slate-400 flex gap-3 mt-1">
                          {formattedDate && <span>{formattedDate}</span>}
                          {m.pitch && (
                            <span className="text-emerald-400 font-semibold">Pitch {m.pitch}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs px-3 py-1.5 rounded-xl bg-white/10 text-white tabular-nums">
                        {m.status === 'played' ? `${m.home_goals} - ${m.away_goals}` : 'Scheduled'}
                      </span>
                      <span className="text-xs font-semibold text-rose-400">Details →</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function PlayerDetailPage({ ctx }: { ctx: PortalContext }) {
  const { id } = useParams()
  const playerId = Number(id)
  const surfaces = getSurfaceClasses()

  const player = ctx.players.find((p) => p.id === playerId)
  const team = player?.team_id ? ctx.teams.find((t) => t.id === player.team_id) : undefined

  const canManage =
    isTeamManager(ctx.user, ctx.profile, team) ||
    (!!ctx.user && !!player?.user_id && ctx.user.id === player.user_id)

  const [activeTab, setActiveTab] = useState<'career' | 'periods' | 'edit'>('career')

  const currentPeriod = getCurrentPeriodKey()
  const periodGoalCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const g of ctx.matchGoals) {
      if (g.period_key === currentPeriod) {
        map.set(g.player_id, (map.get(g.player_id) ?? 0) + 1)
      }
    }
    return map
  }, [ctx.matchGoals, currentPeriod])

  const maxPeriodGoals = Math.max(0, ...Array.from(periodGoalCounts.values()))
  const isGoldenBoot =
    maxPeriodGoals > 0 && (periodGoalCounts.get(playerId) ?? 0) === maxPeriodGoals

  const activeGoalStreaks = useMemo(
    () => computeActiveGoalStreaks(ctx.players, ctx.matches, ctx.matchGoals),
    [ctx.players, ctx.matches, ctx.matchGoals]
  )
  const playerStreak = activeGoalStreaks.get(playerId) ?? 0

  const periodGoals = periodGoalCounts.get(playerId) ?? 0
  const periodAssists = ctx.matchAssists.filter(
    (a) => a.player_id === playerId && a.period_key === currentPeriod
  ).length
  const careerGoals = ctx.matchGoals.filter((g) => g.player_id === playerId).length
  const careerAssists = ctx.matchAssists.filter((a) => a.player_id === playerId).length

  const careerSeasons = useMemo(() => {
    const matchById = new Map(ctx.matches.map((m) => [m.id, m]))
    const leagueById = new Map(ctx.leagues.map((l) => [l.id, l]))
    const teamById = new Map(ctx.teams.map((t) => [t.id, t.name]))

    type SeasonAgg = {
      key: string
      leagueId: number | null
      leagueName: string
      seasonLabel: string
      archived: boolean
      teamNames: Set<string>
      goals: number
      assists: number
    }

    const map = new Map<string, SeasonAgg>()

    function ensureBucket(leagueId: number | null): SeasonAgg {
      const key = leagueId !== null ? `league-${leagueId}` : 'other'
      const existing = map.get(key)
      if (existing) return existing
      const lg = leagueId !== null ? leagueById.get(leagueId) : undefined
      const created: SeasonAgg = {
        key,
        leagueId,
        leagueName: lg ? lg.name : 'General / Non-League Matches',
        seasonLabel: lg ? lg.season : '—',
        archived: lg ? isLeagueArchived(lg) : false,
        teamNames: new Set<string>(),
        goals: 0,
        assists: 0,
      }
      map.set(key, created)
      return created
    }

    if (player?.team_id) {
      const teamLinks = ctx.leagueTeams.filter((lt) => lt.team_id === player.team_id)
      const tName = teamById.get(player.team_id)
      for (const lt of teamLinks) {
        const bucket = ensureBucket(lt.league_id)
        if (tName) bucket.teamNames.add(tName)
      }
    }

    for (const g of ctx.matchGoals) {
      if (g.player_id !== playerId) continue
      const resolvedLeagueId = g.league_id ?? matchById.get(g.match_id)?.league_id ?? null
      const bucket = ensureBucket(resolvedLeagueId)
      bucket.goals += 1
      const tName = teamById.get(g.team_id)
      if (tName) bucket.teamNames.add(tName)
    }

    for (const a of ctx.matchAssists) {
      if (a.player_id !== playerId) continue
      const resolvedLeagueId = a.league_id ?? matchById.get(a.match_id)?.league_id ?? null
      const bucket = ensureBucket(resolvedLeagueId)
      bucket.assists += 1
      const tName = teamById.get(a.team_id)
      if (tName) bucket.teamNames.add(tName)
    }

    return Array.from(map.values()).sort((a, b) => (b.leagueId ?? -1) - (a.leagueId ?? -1))
  }, [
    ctx.matches,
    ctx.leagues,
    ctx.teams,
    ctx.leagueTeams,
    ctx.matchGoals,
    ctx.matchAssists,
    player,
    playerId,
  ])

  const careerPeriods = useMemo(() => {
    const map = new Map<string, { periodKey: string; goals: number; assists: number }>()
    for (const g of ctx.matchGoals) {
      if (g.player_id !== playerId) continue
      const entry = map.get(g.period_key) ?? { periodKey: g.period_key, goals: 0, assists: 0 }
      entry.goals += 1
      map.set(g.period_key, entry)
    }
    for (const a of ctx.matchAssists) {
      if (a.player_id !== playerId) continue
      const entry = map.get(a.period_key) ?? { periodKey: a.period_key, goals: 0, assists: 0 }
      entry.assists += 1
      map.set(a.period_key, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.periodKey.localeCompare(a.periodKey))
  }, [ctx.matchGoals, ctx.matchAssists, playerId])

  const [fullName, setFullName] = useState('')
  const [playerEmail, setPlayerEmail] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [position, setPosition] = useState('')
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (player) {
      setFullName(player.full_name)
      setPlayerEmail(player.email ?? '')
      setJerseyNumber(player.jersey_number ? String(player.jersey_number) : '')
      setPosition(player.position ?? '')
      setBio(player.bio ?? '')
    }
  }, [player])

  if (!player) {
    return (
      <div className={`rounded-2xl p-7 space-y-3 ${surfaces.card}`}>
        <p className="text-slate-300">Player not found.</p>
        <Link to="/pool" className="text-sm font-semibold text-rose-400 hover:underline">
          ← Back to Player Pool
        </Link>
      </div>
    )
  }

  async function handlePhotoUpload(file: File) {
    setBusy(true)
    setMsg(null)
    try {
      const url = await uploadImageToBucket('player-avatars', file, `player-${player!.id}`)
      const { error } = await supabase.from('players').update({ photo_url: url }).eq('id', player!.id)
      if (error) throw new Error(error.message)
      setMsg('Player photo updated.')
      await ctx.refreshAll()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not upload photo')
    } finally {
      setBusy(false)
    }
  }

  function handleRemovePhoto() {
    ctx.askConfirm({
      title: 'Remove Player Photo?',
      message: `Are you sure you want to remove the photo of ${player!.full_name}?`,
      confirmLabel: 'Remove Photo',
      onConfirm: async () => {
        setBusy(true)
        setMsg(null)
        const { error } = await supabase
          .from('players')
          .update({ photo_url: null })
          .eq('id', player!.id)
        if (error) setMsg(error.message)
        else {
          setMsg('Player photo removed.')
          await ctx.refreshAll()
        }
        setBusy(false)
      },
    })
  }

  async function handleUpdatePlayer(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } = await supabase
      .from('players')
      .update({
        full_name: fullName.trim(),
        email: playerEmail.trim().toLowerCase() || null,
        jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
        position: position.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', player!.id)
    if (error) setMsg(error.message)
    else {
      setMsg('Player profile saved.')
      await ctx.refreshAll()
    }
    setBusy(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        {team ? (
          <Link to={`/teams/${team.id}`} className={surfaces.backPill}>
            <ArrowLeft className="w-3.5 h-3.5" /> {team.name}
          </Link>
        ) : null}
        <Link to="/pool" className={surfaces.backPill}>
          <Users className="w-3.5 h-3.5" /> Player Pool
        </Link>
      </div>

      {msg && (
        <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {msg}
        </div>
      )}

      <section
        className={`overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center ${surfaces.card}`}
      >
        <AmbientGlow />
        <div className="relative z-10">
          <PlayerAvatar
            photoUrl={player.photo_url}
            name={player.full_name}
            jersey={player.jersey_number}
            size="lg"
          />
        </div>

        <div className="relative z-10 space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
              {player.full_name}
            </h1>
            {isGoldenBoot && (
              <span className="inline-flex items-center gap-1 bg-amber-400/15 text-amber-300 border border-amber-400/35 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Golden Boot
              </span>
            )}
            {playerStreak >= 2 && (
              <span className="inline-flex items-center gap-1 bg-orange-500/15 text-orange-300 border border-orange-400/35 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-400" /> {playerStreak}
                -Match Streak
              </span>
            )}
            <span className="text-xs font-semibold bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-lg">
              ID #{player.id}
            </span>
            {player.jersey_number && (
              <span className="text-xs font-semibold bg-[#D50C2F] text-white px-2.5 py-0.5 rounded-lg">
                #{player.jersey_number}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            {player.position || 'Position not set'} ·{' '}
            {team ? (
              <Link to={`/teams/${team.id}`} className="font-semibold text-white hover:text-rose-400">
                {team.name}
              </Link>
            ) : (
              'Free Agent'
            )}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-xs sm:text-sm font-semibold tabular-nums">
            <span className="text-emerald-400">
              {formatPeriodLabel(currentPeriod)}: {periodGoals}G · {periodAssists}A
            </span>
            <span className="text-slate-300">
              Career Total: {careerGoals}G · {careerAssists}A
            </span>
          </div>
          {player.bio && <p className="text-sm text-slate-300 pt-1">{player.bio}</p>}

          {canManage && (
            <div className="flex flex-wrap gap-2 pt-2">
              <label className="cursor-pointer bg-white/10 hover:bg-white/15 border border-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                {busy ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handlePhotoUpload(f)
                  }}
                />
              </label>
              {player.photo_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/25 px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className={`rounded-2xl overflow-hidden ${surfaces.card}`}>
        <div className="flex flex-wrap border-b border-white/10 bg-black/20 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('career')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 inline-flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'career'
                ? 'border-[#E11D48] text-rose-400 bg-white/[0.06]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Career (Seasons)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('periods')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 inline-flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'periods'
                ? 'border-emerald-400 text-emerald-400 bg-white/[0.06]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            6-Month Periods
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 inline-flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'edit'
                  ? 'border-white text-white bg-white/[0.06]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-6 sm:p-7">
          {activeTab === 'career' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 tabular-nums">
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Career Goals
                  </div>
                  <div className="font-display text-3xl font-bold text-rose-400 mt-1">
                    {careerGoals}
                  </div>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Career Assists
                  </div>
                  <div className="font-display text-3xl font-bold text-white mt-1">
                    {careerAssists}
                  </div>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Total G + A
                  </div>
                  <div className="font-display text-3xl font-bold text-emerald-400 mt-1">
                    {careerGoals + careerAssists}
                  </div>
                </div>
              </div>

              {careerSeasons.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No seasonal goal or assist records for this player yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm tabular-nums">
                    <thead className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="py-3 pr-3">Season</th>
                        <th className="py-3 pr-3">Competition</th>
                        <th className="py-3 pr-3">Team</th>
                        <th className="py-3 px-2 text-center">Goals</th>
                        <th className="py-3 px-2 text-center">Assists</th>
                        <th className="py-3 pl-2 text-right">G + A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.08]">
                      {careerSeasons.map((row) => (
                        <tr key={row.key} className="hover:bg-white/[0.04] transition">
                          <td className="py-3.5 pr-3 font-medium text-slate-400 whitespace-nowrap">
                            {row.seasonLabel}
                          </td>
                          <td className="py-3.5 pr-3">
                            {row.leagueId ? (
                              <Link
                                to={`/leagues/${row.leagueId}`}
                                className="font-semibold text-white hover:text-rose-400"
                              >
                                {row.leagueName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-200">{row.leagueName}</span>
                            )}
                            {row.archived && (
                              <span className="ml-2 text-[10px] font-semibold bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                                Past Season
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pr-3 text-slate-300">
                            {row.teamNames.size > 0
                              ? Array.from(row.teamNames).join(', ')
                              : team?.name || '—'}
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-rose-400">
                            {row.goals}
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-white">
                            {row.assists}
                          </td>
                          <td className="py-3.5 pl-2 text-right font-bold text-emerald-400">
                            {row.goals + row.assists}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-white/15 bg-white/[0.04] font-bold">
                      <tr>
                        <td
                          colSpan={3}
                          className="py-3 px-2 text-[10.5px] uppercase tracking-[0.14em] text-slate-400"
                        >
                          Career Total
                        </td>
                        <td className="py-3 px-2 text-center text-rose-400">{careerGoals}</td>
                        <td className="py-3 px-2 text-center text-white">{careerAssists}</td>
                        <td className="py-3 pl-2 pr-2 text-right text-emerald-400">
                          {careerGoals + careerAssists}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'periods' && (
            <div className="space-y-3">
              {careerPeriods.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No 6-month period statistics yet.
                </p>
              ) : (
                <div className="divide-y divide-white/[0.08] text-sm">
                  {careerPeriods.map((item) => (
                    <div
                      key={item.periodKey}
                      className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="font-semibold text-white">
                        {formatPeriodLabel(item.periodKey)}
                        {item.periodKey === currentPeriod && (
                          <span className="ml-2 text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                            Current Period
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs sm:text-sm font-bold tabular-nums">
                        <span className="text-rose-400">
                          {pluralize(item.goals, 'Goal', 'Goals')}
                        </span>
                        <span className="text-white">
                          {pluralize(item.assists, 'Assist', 'Assists')}
                        </span>
                        <span className="text-emerald-400">{item.goals + item.assists} G+A</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'edit' && canManage && (
            <form
              onSubmit={handleUpdatePlayer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={DARK_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email (Account Link)
                </label>
                <input
                  type="email"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  placeholder="player@uni-bremen.de"
                  className={DARK_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Jersey #</label>
                <input
                  type="number"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  className={DARK_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className={DARK_INPUT}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={DARK_INPUT}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-[#16A34A] hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

function MyProfilePage({ ctx }: { ctx: PortalContext }) {
  const surfaces = getSurfaceClasses()

  const myPlayer = useMemo(() => {
    if (!ctx.user) return null
    return (
      ctx.players.find((p) => p.user_id === ctx.user!.id) ??
      ctx.players.find(
        (p) =>
          p.email && ctx.user!.email && p.email.toLowerCase() === ctx.user!.email!.toLowerCase()
      ) ??
      null
    )
  }, [ctx.user, ctx.players])

  const myTeam = myPlayer?.team_id ? ctx.teams.find((t) => t.id === myPlayer.team_id) : undefined
  const captainedTeams = useMemo(
    () =>
      ctx.user
        ? ctx.teams.filter(
            (t) => t.captain_id === ctx.user!.id || t.co_captain_id === ctx.user!.id
          )
        : [],
    [ctx.user, ctx.teams]
  )

  const currentPeriod = getCurrentPeriodKey()
  const periodGoalCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const g of ctx.matchGoals) {
      if (g.period_key === currentPeriod) {
        map.set(g.player_id, (map.get(g.player_id) ?? 0) + 1)
      }
    }
    return map
  }, [ctx.matchGoals, currentPeriod])

  const maxPeriodGoals = Math.max(0, ...Array.from(periodGoalCounts.values()))
  const isGoldenBoot =
    !!myPlayer &&
    maxPeriodGoals > 0 &&
    (periodGoalCounts.get(myPlayer.id) ?? 0) === maxPeriodGoals

  const [fullName, setFullName] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [position, setPosition] = useState('')
  const [bio, setBio] = useState('')
  const [captainCodeInput, setCaptainCodeInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  useEffect(() => {
    if (myPlayer) {
      setFullName(myPlayer.full_name)
      setJerseyNumber(myPlayer.jersey_number ? String(myPlayer.jersey_number) : '')
      setPosition(myPlayer.position ?? '')
      setBio(myPlayer.bio ?? '')
    } else if (ctx.user) {
      setFullName(
        ctx.profile?.full_name ||
          (ctx.user.user_metadata?.full_name as string | undefined) ||
          ctx.user.email?.split('@')[0] ||
          ''
      )
    }
  }, [myPlayer, ctx.user, ctx.profile])

  if (!ctx.user) {
    return (
      <div className={`rounded-2xl p-7 space-y-4 ${surfaces.card}`}>
        <h1 className="text-xl font-bold text-white">Account & Profile</h1>
        <p className="text-sm text-slate-300">
          Sign in to edit your profile, update your avatar, or enter a captain code.
        </p>
        <button
          type="button"
          onClick={() => ctx.openAuthModal('login')}
          className="bg-[#D50C2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
        >
          Sign In / Sign Up
        </button>
      </div>
    )
  }

  async function ensurePlayerRecord(): Promise<number> {
    if (myPlayer) return myPlayer.id
    const { data, error } = await supabase
      .from('players')
      .insert({
        user_id: ctx.user!.id,
        email: ctx.user!.email ?? null,
        full_name: fullName.trim() || ctx.user!.email?.split('@')[0] || 'Player',
        team_id: null,
        jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
        position: position.trim() || 'Midfielder',
        bio: bio.trim() || null,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message || 'Could not create profile')
    return data.id
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    setErrMsg(null)

    try {
      const pId = await ensurePlayerRecord()
      const { error: plErr } = await supabase
        .from('players')
        .update({
          user_id: ctx.user!.id,
          full_name: fullName.trim(),
          jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
          position: position.trim() || null,
          bio: bio.trim() || null,
        })
        .eq('id', pId)
      if (plErr) throw new Error(plErr.message)

      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', ctx.user!.id)

      setMsg('Profile details updated.')
      await ctx.refreshAll()
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  async function handleAvatarUpload(file: File) {
    setBusy(true)
    setMsg(null)
    setErrMsg(null)
    try {
      const pId = await ensurePlayerRecord()
      const url = await uploadImageToBucket('player-avatars', file, `user-${ctx.user!.id}`)
      const { error } = await supabase.from('players').update({ photo_url: url }).eq('id', pId)
      if (error) throw new Error(error.message)
      setMsg('Profile photo updated.')
      await ctx.refreshAll()
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Could not upload photo')
    } finally {
      setBusy(false)
    }
  }

  async function handleClaimCaptainCode(e: FormEvent) {
    e.preventDefault()
    if (!captainCodeInput.trim()) return
    setBusy(true)
    setMsg(null)
    setErrMsg(null)

    const { data, error } = await supabase.rpc('claim_captain_code', {
      invite_code: captainCodeInput.trim(),
    })

    if (error) {
      setErrMsg(error.message)
    } else {
      setCaptainCodeInput('')
      setMsg(
        `You are now assigned as captain of "${(data as { team_name?: string })?.team_name ?? 'Team'}".`
      )
      await ctx.refreshAll()
    }
    setBusy(false)
  }

  const goalsCount = myPlayer
    ? ctx.matchGoals.filter((g) => g.player_id === myPlayer.id).length
    : 0
  const assistsCount = myPlayer
    ? ctx.matchAssists.filter((a) => a.player_id === myPlayer.id).length
    : 0

  return (
    <div className="space-y-8">
      <div className={`flex flex-wrap items-end justify-between gap-4 ${surfaces.headerBox}`}>
        <AmbientGlow />
        <div className="relative z-10 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-rose-400">
            PLAYER ACCOUNT · {(ctx.profile?.role ?? 'player').toUpperCase()}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-white">
            Account & Profile
          </h1>
          <p className="text-sm text-slate-400">
            {ctx.user.email}
            {myPlayer ? ` · Player ID #${myPlayer.id}` : ''}
          </p>
        </div>

        {myPlayer && (
          <Link
            to={`/players/${myPlayer.id}`}
            className="relative z-10 bg-white/10 border border-white/15 hover:border-rose-400 text-white px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition"
          >
            <Trophy className="w-3.5 h-3.5 text-rose-400" />
            View Career Page →
          </Link>
        )}
      </div>

      {errMsg && (
        <div className="bg-red-500/15 border border-red-400/40 text-red-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {errMsg}
        </div>
      )}
      {msg && (
        <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {msg}
        </div>
      )}

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between ${surfaces.card}`}>
        <AmbientGlow />
        <div className="relative z-10 flex items-center gap-5">
          <PlayerAvatar
            photoUrl={myPlayer?.photo_url ?? null}
            name={fullName || ctx.user.email || 'Player'}
            jersey={myPlayer?.jersey_number}
            size="lg"
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{fullName || ctx.user.email}</h2>
              {isGoldenBoot && (
                <span className="inline-flex items-center gap-1 bg-amber-400/15 text-amber-300 border border-amber-400/35 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Golden Boot
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              Team: <strong className="text-white">{myTeam?.name ?? 'Free Agent'}</strong> ·{' '}
              <strong className="text-rose-400">{pluralize(goalsCount, 'Goal', 'Goals')}</strong>,{' '}
              <strong className="text-white">
                {pluralize(assistsCount, 'Assist', 'Assists')}
              </strong>{' '}
              (<strong className="text-emerald-400">{goalsCount + assistsCount} G+A</strong>)
            </p>
            {captainedTeams.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {captainedTeams.map((ct) => {
                  const isMainCap = ct.captain_id === ctx.user!.id
                  return (
                    <Link
                      key={ct.id}
                      to={`/teams/${ct.id}`}
                      className="text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-lg hover:underline"
                    >
                      {isMainCap ? 'Captain of' : '2nd Captain of'}: {ct.name} →
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <label className="relative z-10 cursor-pointer bg-white/10 hover:bg-white/15 border border-white/15 text-white px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition">
          <Upload className="w-3.5 h-3.5" />
          {busy ? 'Uploading...' : 'Change Photo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleAvatarUpload(f)
            }}
          />
        </label>
      </section>

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 ${surfaces.card}`}>
        <AmbientGlow />
        <h2 className="relative z-10 text-base font-bold text-white mb-5">Update Profile Details</h2>
        <form
          onSubmit={handleSaveProfile}
          className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={DARK_INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Jersey #</label>
            <input
              type="number"
              min={1}
              max={99}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              className={DARK_INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Midfielder / Left Back"
              className={DARK_INPUT}
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio or playing style..."
              className={DARK_INPUT}
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="bg-[#16A34A] hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 ${surfaces.card}`}>
        <AmbientGlow />
        <h2 className="relative z-10 text-base font-bold text-white flex items-center gap-2 mb-1.5">
          <KeyRound className="w-4 h-4 text-rose-400" />
          Claim Captain Invite Code
        </h2>
        <p className="relative z-10 text-xs text-slate-400 mb-4">
          Enter the captain invite code generated by the admin to become that team’s captain.
        </p>
        <form
          onSubmit={handleClaimCaptainCode}
          className="relative z-10 flex flex-wrap gap-3 items-center"
        >
          <input
            type="text"
            value={captainCodeInput}
            onChange={(e) => setCaptainCodeInput(e.target.value)}
            placeholder="Captain Code (e.g. CAP-2-A1B2)"
            className="bg-[#070D1B] border border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm uppercase w-64"
          />
          <button
            type="submit"
            disabled={busy || !captainCodeInput.trim()}
            className="bg-[#D50C2F] hover:bg-[#b80927] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition"
          >
            Claim Code
          </button>
        </form>
      </section>
    </div>
  )
}

function AdminPage({ ctx }: { ctx: PortalContext }) {
  const navigate = useNavigate()
  const isAdmin = ctx.profile?.role === 'admin'
  const surfaces = getSurfaceClasses()

  const [teamName, setTeamName] = useState('')
  const [shortName, setShortName] = useState('')
  const [captainCode, setCaptainCode] = useState('')
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null)

  const [bgName, setBgName] = useState('')
  const [bgDesktopFile, setBgDesktopFile] = useState<File | null>(null)
  const [bgMobileFile, setBgMobileFile] = useState<File | null>(null)
  const [bgOverlay, setBgOverlay] = useState(0.35)
  const [bgBusy, setBgBusy] = useState(false)

  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const activeBg = useMemo(
    () => ctx.backgrounds.find((b) => b.is_active) ?? null,
    [ctx.backgrounds]
  )

  if (!isAdmin) {
    return (
      <div className={`rounded-2xl p-7 space-y-4 ${surfaces.card}`}>
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        <p className="text-sm text-slate-300">
          You must sign in with an <strong>admin</strong> account to access this page.
        </p>
        {!ctx.user ? (
          <button
            onClick={() => ctx.openAuthModal('login')}
            className="bg-[#D50C2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          >
            Sign In
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          >
            Back to Home
          </button>
        )}
      </div>
    )
  }

  async function handleSelectBackground(bgId: number | null) {
    setBgBusy(true)
    setStatusMsg(null)
    try {
      const { error: clearErr } = await supabase
        .from('site_backgrounds')
        .update({ is_active: false })
        .neq('id', -1)
      if (clearErr) throw new Error(clearErr.message)

      if (bgId !== null) {
        const { error: setErr } = await supabase
          .from('site_backgrounds')
          .update({ is_active: true })
          .eq('id', bgId)
        if (setErr) throw new Error(setErr.message)
        const chosen = ctx.backgrounds.find((b) => b.id === bgId)
        setStatusMsg(`Site background switched to "${chosen?.name ?? 'Selected Theme'}".`)
      } else {
        setStatusMsg('Site background disabled (Clean Slate mode).')
      }
      await ctx.refreshAll()
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Could not update background')
    } finally {
      setBgBusy(false)
    }
  }

  async function handleUploadNewBackground(e: FormEvent) {
    e.preventDefault()
    if (!bgName.trim() || !bgDesktopFile) {
      setStatusMsg('Please enter a background name and choose a Desktop (16:9) image or GIF.')
      return
    }
    setBgBusy(true)
    setStatusMsg(null)
    try {
      const desktopUrl = await uploadImageToBucket('site-backgrounds', bgDesktopFile, 'desktop')
      let mobileUrl: string | null = null
      if (bgMobileFile) {
        mobileUrl = await uploadImageToBucket('site-backgrounds', bgMobileFile, 'mobile')
      }

      const { error: clearErr } = await supabase
        .from('site_backgrounds')
        .update({ is_active: false })
        .neq('id', -1)
      if (clearErr) throw new Error(clearErr.message)

      const { error: insErr } = await supabase.from('site_backgrounds').insert({
        name: bgName.trim(),
        desktop_url: desktopUrl,
        mobile_url: mobileUrl,
        is_active: true,
        overlay_opacity: bgOverlay,
      })
      if (insErr) throw new Error(insErr.message)

      setBgName('')
      setBgDesktopFile(null)
      setBgMobileFile(null)
      setStatusMsg('New site background uploaded and activated!')
      await ctx.refreshAll()
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Could not upload background')
    } finally {
      setBgBusy(false)
    }
  }

  async function handleUploadMobileVariant(bg: SiteBackground, file: File) {
    setBgBusy(true)
    setStatusMsg(null)
    try {
      const mobileUrl = await uploadImageToBucket(
        'site-backgrounds',
        file,
        `mobile-bg-${bg.id}`
      )
      const { error } = await supabase
        .from('site_backgrounds')
        .update({ mobile_url: mobileUrl })
        .eq('id', bg.id)
      if (error) throw new Error(error.message)
      setStatusMsg(`9:16 mobile version attached to "${bg.name}".`)
      await ctx.refreshAll()
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Could not upload mobile variant')
    } finally {
      setBgBusy(false)
    }
  }

  async function handleUpdateOverlayOpacity(bg: SiteBackground, nextOpacity: number) {
    setBgBusy(true)
    const { error } = await supabase
      .from('site_backgrounds')
      .update({ overlay_opacity: nextOpacity })
      .eq('id', bg.id)
    if (error) setStatusMsg(error.message)
    else await ctx.refreshAll()
    setBgBusy(false)
  }

  function handleDeleteBackground(bg: SiteBackground) {
    ctx.askConfirm({
      title: 'Delete Background?',
      message: `Are you sure you want to permanently delete "${bg.name}"?`,
      confirmLabel: 'Yes, Delete',
      onConfirm: async () => {
        setBgBusy(true)
        setStatusMsg(null)
        const { error } = await supabase.from('site_backgrounds').delete().eq('id', bg.id)
        if (error) setStatusMsg(error.message)
        else {
          setStatusMsg(`Background "${bg.name}" removed.`)
          await ctx.refreshAll()
        }
        setBgBusy(false)
      },
    })
  }

  async function handleToggleArchive(lg: League) {
    const nextArchived = !isLeagueArchived(lg)
    setBusy(true)
    setStatusMsg(null)

    const { error } = await supabase
      .from('leagues')
      .update({
        status: nextArchived ? 'archived' : 'active',
        is_active: !nextArchived,
      })
      .eq('id', lg.id)

    if (error) setStatusMsg(`Could not update: ${error.message}`)
    else {
      setStatusMsg(
        nextArchived
          ? `"${lg.name}" moved to Past Seasons (Archive) on Home.`
          : `"${lg.name}" set back to Active.`
      )
      await ctx.refreshAll()
    }
    setBusy(false)
  }

  function handleSafeDeleteLeague(lg: League) {
    ctx.askConfirm({
      title: `Delete "${lg.name}"?`,
      message:
        'Groups and matches for this competition will be removed, while teams and players will be preserved.',
      confirmLabel: 'Yes, Delete Competition',
      onConfirm: async () => {
        setBusy(true)
        setStatusMsg(null)
        const { error } = await supabase.from('leagues').delete().eq('id', lg.id)
        if (error) setStatusMsg(`Could not delete competition: ${error.message}`)
        else {
          setStatusMsg(`"${lg.name}" deleted. All teams and player records were preserved.`)
          await ctx.refreshAll()
        }
        setBusy(false)
      },
    })
  }

  async function handleAddTeam(e: FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return

    setBusy(true)
    setStatusMsg(null)
    try {
      let logoUrl: string | null = null
      if (teamLogoFile) {
        logoUrl = await uploadImageToBucket('team-logos', teamLogoFile, 'pool')
      }
      const generatedCode =
        captainCode.trim().toUpperCase() ||
        `CAP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

      const { error } = await supabase.from('teams').insert({
        name: teamName.trim(),
        short_name: shortName.trim() || teamName.trim().slice(0, 3).toUpperCase(),
        captain_invite_code: generatedCode,
        logo_url: logoUrl,
      })
      if (error) throw new Error(error.message)
      setTeamName('')
      setShortName('')
      setCaptainCode('')
      setTeamLogoFile(null)
      setStatusMsg(`Team created! Captain invite code: ${generatedCode}`)
      await ctx.refreshAll()
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Could not create team')
    } finally {
      setBusy(false)
    }
  }

  function handleSafeDeleteTeam(tm: Team) {
    ctx.askConfirm({
      title: `Delete "${tm.name}"?`,
      message:
        'Player IDs, profiles, and goal/assist statistics will NOT be deleted — players will simply move to the Player Pool as Free Agents.',
      confirmLabel: 'Yes, Delete Team',
      onConfirm: async () => {
        setBusy(true)
        setStatusMsg(null)
        const { error } = await supabase.from('teams').delete().eq('id', tm.id)
        if (error) setStatusMsg(`Could not delete team: ${error.message}`)
        else {
          setStatusMsg(`"${tm.name}" deleted. Player IDs and statistics were preserved.`)
          await ctx.refreshAll()
        }
        setBusy(false)
      },
    })
  }

  const teamMap = new Map(ctx.teams.map((t) => [t.id, t.name]))
  const playableMatches = ctx.matches.filter(
    (m) => m.home_team_id !== null && m.away_team_id !== null
  )

  return (
    <div className="space-y-8">
      <div className={`flex flex-wrap items-end justify-between gap-4 ${surfaces.headerBox}`}>
        <AmbientGlow />
        <div className="relative z-10 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-rose-400">
            MANAGEMENT CONSOLE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-white">
            Admin Panel
          </h1>
          <p className="text-sm text-slate-400">
            Create competitions, switch site-wide pixel-art backgrounds, configure knockout brackets, or enter scores.
          </p>
        </div>
        <Link
          to="/admin/create-league"
          className="relative z-10 bg-[#D50C2F] hover:bg-[#b80927] text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          New League / Tournament
        </Link>
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-5 py-3.5 rounded-2xl text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-6 ${surfaces.card}`}>
        <AmbientGlow />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              VISUAL ATMOSPHERE
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Site-Wide Background (Pixel Art / GIF)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Applies across every page on the site. Switch themes or upload 16:9 desktop and 9:16 mobile images or GIFs.
            </p>
          </div>

          <button
            type="button"
            disabled={bgBusy || !activeBg}
            onClick={() => handleSelectBackground(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              !activeBg
                ? 'bg-white text-[#0B1120] border-white'
                : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
            }`}
          >
            {!activeBg ? 'Clean Slate Active' : 'Disable Background (Clean Slate)'}
          </button>
        </div>

        {activeBg && (
          <div className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-white">
                Active: {activeBg.name} — Readability Veil (
                {Math.round((activeBg.overlay_opacity ?? 0.35) * 100)}%)
              </div>
              <div className="text-[11px] text-slate-400">
                Lower = more vivid pixel art · Higher = darker contrast behind cards
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[0.15, 0.3, 0.45, 0.65].map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={bgBusy}
                  onClick={() => handleUpdateOverlayOpacity(activeBg, val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition ${
                    Math.abs((activeBg.overlay_opacity ?? 0.35) - val) < 0.06
                      ? 'bg-[#D50C2F] text-white border-[#D50C2F]'
                      : 'bg-white/[0.06] text-slate-300 border-white/15 hover:bg-white/10'
                  }`}
                >
                  {Math.round(val * 100)}%
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative z-10">
          {ctx.backgrounds.length === 0 ? (
            <p className="text-sm text-slate-400">
              No backgrounds saved yet. Upload your first background below.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ctx.backgrounds.map((bg) => (
                <div
                  key={bg.id}
                  className={`rounded-2xl border overflow-hidden transition flex flex-col justify-between ${
                    bg.is_active
                      ? 'border-emerald-400/70 ring-2 ring-emerald-400/20 bg-emerald-500/[0.08]'
                      : 'border-white/10 bg-white/[0.04]'
                  }`}
                >
                  <div className="relative h-36 bg-slate-900 overflow-hidden">
                    <img
                      src={bg.desktop_url}
                      alt={bg.name}
                      className="w-full h-full object-cover"
                    />
                    {bg.is_active && (
                      <span className="absolute top-2.5 left-2.5 bg-[#16A34A] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                        Active Site-Wide
                      </span>
                    )}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <span className="bg-slate-950/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> 16:9
                      </span>
                      {bg.mobile_url && (
                        <span className="bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> 9:16
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-white truncate">{bg.name}</span>
                      <button
                        type="button"
                        disabled={bgBusy}
                        onClick={() => handleDeleteBackground(bg)}
                        title="Delete background"
                        className="text-slate-400 hover:text-rose-400 p-1 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={bgBusy || bg.is_active}
                        onClick={() => handleSelectBackground(bg.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          bg.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                            : 'bg-[#D50C2F] hover:bg-[#b80927] text-white'
                        }`}
                      >
                        {bg.is_active ? 'Active' : 'Set Active'}
                      </button>

                      <label className="cursor-pointer bg-white/10 hover:bg-white/15 text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition">
                        <Smartphone className="w-3.5 h-3.5" />
                        {bg.mobile_url ? 'Change 9:16' : 'Add 9:16'}
                        <input
                          type="file"
                          accept="image/*,.gif"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUploadMobileVariant(bg, f)
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleUploadNewBackground}
          className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end"
        >
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Background Name
            </label>
            <input
              type="text"
              required
              value={bgName}
              onChange={(e) => setBgName(e.target.value)}
              placeholder="e.g. Autumn Rain (GIF)"
              className={DARK_INPUT}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Desktop 16:9 (Image / GIF)
            </label>
            <input
              type="file"
              required
              accept="image/*,.gif"
              onChange={(e) => setBgDesktopFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-slate-300 bg-[#070D1B] border border-slate-700/80 rounded-xl px-2.5 py-2.5"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Mobile 9:16 (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.gif"
              onChange={(e) => setBgMobileFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-slate-300 bg-[#070D1B] border border-slate-700/80 rounded-xl px-2.5 py-2.5"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Veil</label>
            <select
              value={bgOverlay}
              onChange={(e) => setBgOverlay(Number(e.target.value))}
              className={DARK_SELECT}
            >
              <option value={0.15} className="bg-[#0B1120] text-white">
                15%
              </option>
              <option value={0.3} className="bg-[#0B1120] text-white">
                30%
              </option>
              <option value={0.35} className="bg-[#0B1120] text-white">
                35%
              </option>
              <option value={0.5} className="bg-[#0B1120] text-white">
                50%
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={bgBusy}
              className="w-full bg-[#D50C2F] hover:bg-[#b80927] disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Upload className="w-3.5 h-3.5" />
              {bgBusy ? 'Uploading...' : 'Upload & Apply'}
            </button>
          </div>
        </form>
      </section>

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-5 ${surfaces.card}`}>
        <AmbientGlow />
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-base font-bold text-white">
            Leagues & Tournaments ({ctx.leagues.length})
          </h2>
          <Link
            to="/admin/create-league"
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            + Create Competition
          </Link>
        </div>

        <div className="relative z-10">
          {ctx.leagues.length === 0 ? (
            <p className="text-sm text-slate-400">
              No competitions created yet. Use the button above to create one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ctx.leagues.map((lg) => {
                const archived = isLeagueArchived(lg)
                return (
                  <div
                    key={lg.id}
                    className="border border-white/10 rounded-2xl p-5 bg-white/[0.04] flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/leagues/${lg.id}`}
                          className="font-display font-bold text-base text-white hover:text-rose-400"
                        >
                          {lg.name}
                        </Link>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            archived
                              ? 'bg-white/10 text-slate-300'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                          }`}
                        >
                          {archived ? 'Archived' : 'Active'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {lg.series_name || 'Uni Liga'} · {lg.season} ·{' '}
                        {pluralize(lg.group_count, 'Group', 'Groups')} ·{' '}
                        {pluralize(lg.team_count, 'Team', 'Teams')}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                      <Link
                        to={`/leagues/${lg.id}?manage=1`}
                        className="bg-white text-[#0B1120] hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-[#D50C2F]" /> Manage / Bracket
                      </Link>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleArchive(lg)}
                        className="bg-white/10 border border-white/15 hover:bg-white/15 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                      >
                        {archived ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" /> Set Active
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5" /> Archive
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSafeDeleteLeague(lg)}
                        className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/25 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleAddTeam}
          className={`overflow-hidden rounded-2xl p-6 space-y-4 ${surfaces.card}`}
        >
          <AmbientGlow />
          <h2 className="relative z-10 text-base font-bold text-white border-b border-white/10 pb-3">
            Add Team & Captain Invite Code
          </h2>
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Informa Kick"
                className={DARK_INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Short Name</label>
              <input
                type="text"
                maxLength={5}
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="INF"
                className={DARK_INPUT}
              />
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Captain Code (Optional)
              </label>
              <input
                type="text"
                value={captainCode}
                onChange={(e) => setCaptainCode(e.target.value)}
                placeholder="Auto-generated if empty"
                className={`${DARK_INPUT} uppercase`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Team Crest</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTeamLogoFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-slate-300 mt-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="relative z-10 bg-[#D50C2F] hover:bg-[#b80927] text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition"
          >
            Save Team
          </button>
        </form>

        <div className={`overflow-hidden rounded-2xl p-6 space-y-4 ${surfaces.card}`}>
          <AmbientGlow />
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white">
              Matches (Click to Enter Score/Goals/Assists)
            </h2>
            <span className="text-xs font-medium text-slate-400">
              {pluralize(playableMatches.length, 'Match', 'Matches')}
            </span>
          </div>
          <div className="relative z-10">
            {playableMatches.length === 0 ? (
              <p className="text-sm text-slate-400">No matches yet.</p>
            ) : (
              <div className="divide-y divide-white/[0.08] max-h-72 overflow-y-auto pr-1 text-sm">
                {playableMatches.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => ctx.openMatchModal(m.id)}
                    className="w-full text-left py-3 px-2.5 rounded-xl hover:bg-white/[0.05] flex items-center justify-between gap-2 cursor-pointer transition"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">
                        {(m.home_team_id && teamMap.get(m.home_team_id)) || 'TBD'} vs{' '}
                        {(m.away_team_id && teamMap.get(m.away_team_id)) || 'TBD'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {m.round_label || `Match #${m.id}`}
                        {m.pitch ? ` · Pitch ${m.pitch}` : ''}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 tabular-nums ${
                        m.status === 'played'
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {m.status === 'played' ? `${m.home_goals} - ${m.away_goals}` : 'Enter Score'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className={`overflow-hidden rounded-2xl p-6 sm:p-7 space-y-4 ${surfaces.card}`}>
        <AmbientGlow />
        <h2 className="relative z-10 text-base font-bold text-white border-b border-white/10 pb-3">
          Teams & Captain Invite Codes ({ctx.teams.length})
        </h2>
        <div className="relative z-10 divide-y divide-white/[0.08] text-sm">
          {ctx.teams.map((tm) => (
            <div key={tm.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <Link
                  to={`/teams/${tm.id}`}
                  className="font-semibold text-white hover:text-rose-400"
                >
                  {tm.name}
                </Link>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                  <span>
                    Captain Code:{' '}
                    <strong className="text-white bg-white/10 px-2 py-0.5 rounded-md font-mono">
                      {tm.captain_invite_code || 'None'}
                    </strong>
                  </span>
                  <span>
                    ·{' '}
                    {tm.captain_id ? (
                      <span className="text-emerald-400 font-semibold">Captain Assigned</span>
                    ) : (
                      <span className="text-amber-300 font-semibold">Awaiting Captain</span>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleSafeDeleteTeam(tm)}
                className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-400/25 px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Team (Keep Players)
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function PortalApp() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leagues, setLeagues] = useState<League[]>([])
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeamRow[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [matchGoals, setMatchGoals] = useState<MatchGoalRow[]>([])
  const [matchAssists, setMatchAssists] = useState<MatchAssistRow[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [freeAgents, setFreeAgents] = useState<FreeAgentApplication[]>([])
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([])
  const [backgrounds, setBackgrounds] = useState<SiteBackground[]>([])
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  async function refreshAll() {
    setLoading(true)
    const [
      { data: sessionData },
      lgRes,
      grpRes,
      ltRes,
      tmRes,
      mtRes,
      mgRes,
      maRes,
      plRes,
      faRes,
      invRes,
      annRes,
      bgRes,
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('leagues').select('*').order('id', { ascending: false }),
      supabase
        .from('groups')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true }),
      supabase.from('league_teams').select('*').order('id', { ascending: true }),
      supabase.from('teams').select('*').order('id', { ascending: true }),
      supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })
        .order('id', { ascending: true }),
      supabase.from('match_goals').select('*').order('id', { ascending: true }),
      supabase.from('match_assists').select('*').order('id', { ascending: true }),
      supabase.from('players').select('*').order('id', { ascending: true }),
      supabase
        .from('free_agent_applications')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('team_invites').select('*').order('created_at', { ascending: false }),
      supabase.from('team_announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('site_backgrounds').select('*').order('id', { ascending: true }),
    ])

    const currentUser = sessionData.user ?? null
    setUser(currentUser)

    if (currentUser) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      setProfile((profData as Profile) ?? null)
    } else {
      setProfile(null)
    }

    setLeagues((lgRes.data ?? []) as League[])
    setGroups((grpRes.data ?? []) as GroupRow[])
    setLeagueTeams((ltRes.data ?? []) as LeagueTeamRow[])
    setTeams((tmRes.data ?? []) as Team[])
    setMatches((mtRes.data ?? []) as MatchRow[])
    setMatchGoals((mgRes.data ?? []) as MatchGoalRow[])
    setMatchAssists((maRes.data ?? []) as MatchAssistRow[])
    setPlayers((plRes.data ?? []) as Player[])
    setFreeAgents((faRes.data ?? []) as FreeAgentApplication[])
    setTeamInvites((invRes.data ?? []) as TeamInvite[])
    setAnnouncements((annRes.data ?? []) as TeamAnnouncement[])
    setBackgrounds((bgRes.data ?? []) as SiteBackground[])
    setLoading(false)
  }

  useEffect(() => {
    refreshAll()
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refreshAll()
    })
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const activeMatch = useMemo(
    () => matches.find((m) => m.id === activeMatchId) ?? null,
    [matches, activeMatchId]
  )

  const modalMatch = useMemo(() => {
    if (!activeMatch || activeMatch.home_team_id === null || activeMatch.away_team_id === null) {
      return null
    }
    return {
      ...activeMatch,
      home_team_id: activeMatch.home_team_id,
      away_team_id: activeMatch.away_team_id,
    }
  }, [activeMatch])

  const activeHomeTeam = modalMatch
    ? teams.find((t) => t.id === modalMatch.home_team_id)
    : undefined
  const activeAwayTeam = modalMatch
    ? teams.find((t) => t.id === modalMatch.away_team_id)
    : undefined

  const canEditActiveMatch =
    isTeamManager(user, profile, activeHomeTeam) ||
    isTeamManager(user, profile, activeAwayTeam)

  const ctx: PortalContext = {
    user,
    profile,
    leagues,
    groups,
    leagueTeams,
    teams,
    matches,
    matchGoals,
    matchAssists,
    players,
    freeAgents,
    teamInvites,
    announcements,
    backgrounds,
    loading,
    refreshAll,
    openAuthModal: (initialMode = 'login') => {
      setAuthModalMode(initialMode)
      setAuthModalOpen(true)
    },
    openMatchModal: (matchId: number) => setActiveMatchId(matchId),
    askConfirm: (req: ConfirmRequest) => setConfirmReq(req),
  }

  return (
    <BrowserRouter>
      <Layout ctx={ctx}>
        <Routes>
          <Route path="/" element={<HomePage ctx={ctx} />} />
          <Route path="/teams" element={<TeamsPage ctx={ctx} />} />
          <Route
            path="/pool"
            element={
              <PlayerPoolPage
                user={user}
                isAdmin={profile?.role === 'admin'}
                leagues={leagues}
                teams={teams}
                players={players}
                applications={freeAgents}
                teamInvites={teamInvites}
                matchGoals={matchGoals}
                matchAssists={matchAssists}
                refreshAll={refreshAll}
                openAuthModal={() => ctx.openAuthModal('login')}
                askConfirm={ctx.askConfirm}
              />
            }
          />
          <Route path="/profile" element={<MyProfilePage ctx={ctx} />} />
          <Route path="/leagues/:id" element={<LeagueDetailPage ctx={ctx} />} />
          <Route path="/teams/:id" element={<TeamDetailPage ctx={ctx} />} />
          <Route path="/players/:id" element={<PlayerDetailPage ctx={ctx} />} />
          <Route path="/admin" element={<AdminPage ctx={ctx} />} />
          <Route
            path="/admin/create-league"
            element={
              <CreateLeagueWizard
                teams={teams}
                isAdmin={profile?.role === 'admin'}
                refreshAll={refreshAll}
              />
            }
          />
        </Routes>
      </Layout>
      <AuthModal
        open={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={refreshAll}
      />
      <MatchDetailModal
        match={modalMatch}
        homeTeam={activeHomeTeam}
        awayTeam={activeAwayTeam}
        players={players}
        matchGoals={matchGoals}
        matchAssists={matchAssists}
        canEdit={canEditActiveMatch}
        onClose={() => setActiveMatchId(null)}
        onSaved={refreshAll}
      />
      <ConfirmModal
        open={!!confirmReq}
        title={confirmReq?.title ?? ''}
        message={confirmReq?.message ?? ''}
        confirmLabel={confirmReq?.confirmLabel}
        tone={confirmReq?.tone}
        busy={confirmBusy}
        onCancel={() => !confirmBusy && setConfirmReq(null)}
        onConfirm={async () => {
          if (!confirmReq) return
          setConfirmBusy(true)
          try {
            await confirmReq.onConfirm()
          } finally {
            setConfirmBusy(false)
            setConfirmReq(null)
          }
        }}
      />
    </BrowserRouter>
  )
}

export default PortalApp
