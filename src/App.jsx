import { useEffect, useMemo, useState } from 'react'

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
import {Streams} from './components/streams.jsx'
import { useMatchUpdates, MatchProvider } from './context/match-context.jsx'

const SOCKET = new WebSocket("wss://ws.cuescore.com:11443/");

const DEFAULT_SETTINGS = {
  selectedTeam: 'All teams',
  enabledLeagueIds: getTrackedLeagueOptions().map(({ id }) => id),
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
      selectedTeam: 'All teams',
      enabledLeagueIds: enabledLeagueIds.length ? enabledLeagueIds : [...allLeagueIds],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function App(){
    const showStreams = window.location.search.includes("streams");
    if(showStreams)
      return <Streams />
    return <MatchProvider><LeagueMatches /></MatchProvider>
}

function LeagueMatches() {
  const [matches, setMatches] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(readStoredSettings);
  const { updateMatch } = useMatchUpdates();

  const visibleMatches = useMemo(
    () => applySettingsFilters(matches || [], settings),
    [matches, settings]
  );

  function handleSocketMessage(message){
    const data = JSON.parse(message.data);
    if(data.action === "UPDATE MATCHES"){
      for(let match of data.data){
        updateMatch(
          match.matchId,
          String(match.scoreA),
          String(match.scoreB),
          match.matchstatus,
          match.matchstatus === "finished" ? match.scoreA > match.scoreB ? 1 : 2 : 0
        );
      }
    }
  }

  useEffect(() => {
    const { enabledLeagueIds } = settings;
    localStorage.setItem('amspool-settings', JSON.stringify({ enabledLeagueIds }));
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
    matches?.filter(m => m[0] === today).forEach(([d, leagues]) => {
      const gameIDs = [];
      for(let league of leagues){
        for(let game of league){
          gameIDs.push(game.matchId)
        }
      }
      SOCKET.addEventListener("open", (event) => {
        SOCKET.addEventListener("message", handleSocketMessage);
        SOCKET.send(JSON.stringify({"subscribeTo": gameIDs}))
      });
    })

    return () => SOCKET.removeEventListener("message", handleSocketMessage);
  }, [matches])

  const trackedLeagues = getTrackedLeagueOptions();
  const groupedTeamOptions = getGroupedTeamOptions();
  const teamOptions = getTeamOptions();
  const selectedTeamValue = teamOptions.includes(settings.selectedTeam) ? settings.selectedTeam : 'All teams';

  return <>
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
            <label className="settings-field">
              <span>Team</span>
              <select
                value={selectedTeamValue}
                onChange={event => setSettings(current => ({ ...current, selectedTeam: event.target.value }))}
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
      return <div key={date}>
        <DateRow date={new Date(date)} />
        {games.map((game, index) => game.map(g => 
          <GameRow 
            key={index} 
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
            tournamentId={g.tournamentId}
            teamA={g.teamA}
            teamB={g.teamB}
          />))}
      </div>
    })}
  </>
}


export default App