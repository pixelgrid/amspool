import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  applySettingsFilters,
  find_games_for_date,
  getGroupedTeamOptions,
  getSelectedTeamDateRange,
  getTeamOptions,
  getTrackedLeagueOptions,
} from './utils/filter-games.js'

import DateRow from './components/date-row.jsx'
import GameRow from './components/game-row.jsx'
import LiveScoreNotifications from './components/live-score-notifications.jsx'
import {Streams} from './components/streams.jsx'
import { useMatchUpdates, MatchProvider } from './context/match-context.jsx'

const SOCKET = new WebSocket("wss://ws.cuescore.com:11443/");

const DEFAULT_SETTINGS = {
  selectedTeam: 'All teams',
  enabledLeagueIds: getTrackedLeagueOptions().map(({ id }) => id),
  liveScoreNotifications: true,
};

function readStoredSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('amspool-settings') || 'null');
    if (!stored) return DEFAULT_SETTINGS;

    const allLeagueIds = DEFAULT_SETTINGS.enabledLeagueIds;
    const enabledLeagueIds = Array.isArray(stored.enabledLeagueIds)
      ? stored.enabledLeagueIds.filter(id => allLeagueIds.includes(id))
      : [...allLeagueIds];

    return {
      selectedTeam: typeof stored.selectedTeam === 'string' ? stored.selectedTeam : 'All teams',
      enabledLeagueIds: enabledLeagueIds.length ? enabledLeagueIds : [...allLeagueIds],
      liveScoreNotifications: typeof stored.liveScoreNotifications === 'boolean' ? stored.liveScoreNotifications : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getParticipantName(participant, partner) {
  if (Array.isArray(participant)) {
    return participant.map(player => getParticipantName(player)).filter(Boolean).join(' / ');
  }
  if (participant && typeof participant === 'object') {
    return [getParticipantName(participant.name), getParticipantName(partner)].filter(Boolean).join(' / ');
  }
  return typeof participant === 'string' ? participant.trim() : '';
}

function isRealName(name) {
  return Boolean(name && !/^(player|team)\s*[ab]$/i.test(name.trim()));
}

function App(){
    const showStreams = window.location.search.includes("streams");
    if(showStreams)
      return <Streams />
    return <MatchProvider><LeagueMatches /></MatchProvider>
}

function LeagueMatches() {
  const [matches, setMatches] = useState(null);
  const [collapsedDates, setCollapsedDates] = useState(() => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return new Set([yesterday.toISOString().split('T')[0]]);
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(readStoredSettings);
  const { updateMatch, individualMatches, clearNotifications } = useMatchUpdates();
  const individualMatchesRef = useRef(individualMatches);
  individualMatchesRef.current = individualMatches;
  const liveScoreNotificationsRef = useRef(settings.liveScoreNotifications);
  liveScoreNotificationsRef.current = settings.liveScoreNotifications;

  const visibleMatches = useMemo(
    () => applySettingsFilters(matches || [], settings),
    [matches, settings]
  );

  const handleSocketMessage = useCallback((message) => {
    let data;
    try {
      data = JSON.parse(message.data);
    } catch {
      return;
    }
    if(data.action !== "UPDATE MATCHES" || !Array.isArray(data.data)) return;

    for(const match of data.data){
      if (!match?.matchId) continue;
      const knownSubMatch = Object.values(individualMatchesRef.current).flat().find(
        subMatch => String(subMatch.matchId) === String(match.matchId)
      );
      const parentId = match.parentId || knownSubMatch?.parentId;
      const parentGame = matches?.flatMap(([, leagues]) => leagues.flat()).find(
        game => String(game.matchId) === String(parentId)
      );
      const playerA = knownSubMatch?.playerA || getParticipantName(match.playerA, match.doublesA);
      const playerB = knownSubMatch?.playerB || getParticipantName(match.playerB, match.doublesB);
      const belongsToKnownGame = Boolean(parentGame && (
        knownSubMatch || String(match.parentId) === String(parentGame.matchId)
      ));
      const isFinished = match.matchstatus === "finished";
      const scoreA = String(match.scoreA ?? knownSubMatch?.scoreA ?? '');
      const scoreB = String(match.scoreB ?? knownSubMatch?.scoreB ?? '');
      const winner = isFinished
        ? Number(scoreA) > Number(scoreB) ? 1 : Number(scoreB) > Number(scoreA) ? 2 : 0
        : 0;

      updateMatch(
        match.matchId,
        scoreA,
        scoreB,
        match.matchstatus || knownSubMatch?.status || '',
        winner,
        {
          ...knownSubMatch,
          playerA,
          playerB,
          disciplineId: match.disciplineId,
          discipline: match.discipline,
          raceTo: match.raceTo,
          parentId,
          teamA: parentGame?.playerA || '',
          teamB: parentGame?.playerB || '',
        },
        liveScoreNotificationsRef.current && belongsToKnownGame &&
          isRealName(parentGame?.playerA) && isRealName(parentGame?.playerB) &&
          isRealName(playerA) && isRealName(playerB)
      );
    }
  }, [matches, updateMatch]);

  useEffect(() => {
    const { selectedTeam, enabledLeagueIds } = settings;
    localStorage.setItem('amspool-settings', JSON.stringify({ selectedTeam, enabledLeagueIds, liveScoreNotifications: settings.liveScoreNotifications }));
  }, [settings]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlDate = urlParams.get("date");
    const selectedTeam = settings.selectedTeam || 'All teams';
    const [rangeStart, rangeEnd] = getSelectedTeamDateRange(selectedTeam);
    const startDate = urlDate ? new Date(urlDate) : new Date(rangeStart);
    const endDate = selectedTeam === 'All teams' ? new Date(rangeEnd) : new Date(rangeEnd);

    const result = [];
    const cursor = new Date(startDate);

    for (; cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      const res = find_games_for_date(cursor);
      if (res[1].length > 0) {
        result.push(res);
      }
    }
    setMatches(result);
  }, [settings.selectedTeam]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const gameIDs = matches?.filter(([date]) => date === today)
      .flatMap(([, leagues]) => leagues.flat().map(game => game.matchId)) || [];

    SOCKET.addEventListener("message", handleSocketMessage);
    const subscribe = () => {
      if (gameIDs.length) SOCKET.send(JSON.stringify({ subscribeTo: gameIDs }));
    };

    if (SOCKET.readyState === WebSocket.OPEN) subscribe();
    else SOCKET.addEventListener("open", subscribe);

    return () => {
      SOCKET.removeEventListener("message", handleSocketMessage);
      SOCKET.removeEventListener("open", subscribe);
    };
  }, [matches, handleSocketMessage])

  const trackedLeagues = getTrackedLeagueOptions();
  const groupedTeamOptions = getGroupedTeamOptions();
  const teamOptions = getTeamOptions();
  const selectedTeamValue = teamOptions.includes(settings.selectedTeam) ? settings.selectedTeam : 'All teams';
  const hasSelectedTeam = selectedTeamValue !== 'All teams';

  return <>
    <LiveScoreNotifications />
    {hasSelectedTeam && (
      <section className="selected-settings" aria-label="Settings">
        <span className="selected-settings-label">Settings</span>
        <span className="selected-settings-team">Team: {selectedTeamValue}</span>
        <button
          type="button"
          className="selected-settings-clear"
          onClick={() => setSettings(current => ({ ...current, selectedTeam: 'All teams' }))}
        >
          Clear team
        </button>
      </section>
    )}

    <button
      type="button"
      className="settings-button"
      aria-label="Open settings"
      onClick={() => setSettingsOpen(true)}
    >
      ⚙
    </button>

    {settingsOpen && (
      <div className="settings-modal" onClick={() => setSettingsOpen(false)}>
        <div className="settings-dialog" onClick={event => event.stopPropagation()}>
          <div className="settings-header">
            <h2>Settings</h2>
            <button type="button" className="settings-close" onClick={() => setSettingsOpen(false)}>Close</button>
          </div>

          <div className="settings-body">
            <label className="league-checkbox-item">
              <input
                type="checkbox"
                checked={settings.liveScoreNotifications}
                onChange={event => {
                  const enabled = event.target.checked;
                  setSettings(current => ({ ...current, liveScoreNotifications: enabled }));
                  if (!enabled) clearNotifications();
                }}
              />
              <span>Live score notifications</span>
            </label>

            <label className="settings-field">
              <span>Team</span>
              <select
                value={selectedTeamValue}
                onChange={event => {
                  setSettings(current => ({ ...current, selectedTeam: event.target.value }));
                  setSettingsOpen(false);
                }}
              >
                <option value="All teams">All teams</option>
                {groupedTeamOptions.map(({ leagueName, teams }) => (
                  <optgroup key={leagueName} label={leagueName}>
                    {teams.map(team => (
                      <option key={`${leagueName}-${team}`} value={team}>{team}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="settings-field">
              <span>Tracked leagues</span>
              <div className="league-checkbox-list">
                {trackedLeagues.map(({ id, name }) => {
                  const checked = settings.enabledLeagueIds.includes(id);

                  return (
                    <label key={id} className="league-checkbox-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSettings(current => {
                            const nextLeagueIds = current.enabledLeagueIds.includes(id)
                              ? current.enabledLeagueIds.filter(leagueId => leagueId !== id)
                              : [...current.enabledLeagueIds, id];

                            return {
                              ...current,
                              enabledLeagueIds: nextLeagueIds,
                            };
                          });
                        }}
                      />
                      <span>{name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {(visibleMatches || []).map(([date, games]) => {
      const isExpanded = !collapsedDates.has(date);
      const matchesId = `matches-${date}`;

      return <div key={date}>
        <DateRow
          date={new Date(date)}
          expanded={isExpanded}
          controls={matchesId}
          onClick={() => setCollapsedDates(current => {
            const next = new Set(current);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
          })}
        />
        <div id={matchesId} hidden={!isExpanded}>
          {games.map(game => game.map(g =>
            <GameRow
              key={`${g.tournamentId}-${g.matchId}`}
              playerA={g.playerA}
              playerAUrl={g.playerAUrl} 
              playerB={g.playerB}
              playerBUrl={g.playerBUrl}
              venue={g.venueData.venueName} 
              tournament={g.tournamentName}
              tournamentUrl={g.tournamentUrl} 
              venueUrl={g.venueData.venueUrl}
              venueId={g.venueData.venueID}
              matchno={g.matchno}
              matchId={g.matchId}
              shouldFetch={g.shouldFetch}
              forceLive={g.forceLive}
              tournamentId={g.tournamentId}
              teamA={g.teamA}
              teamB={g.teamB}
            />))}
        </div>
      </div>
    })}
  </>
}


export default App