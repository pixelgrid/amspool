import {useEffect, useState} from 'react';

const standingsRequests = new Map();

function fetchStandings(tournamentId) {
  const existingRequest = standingsRequests.get(tournamentId);
  if (existingRequest) return existingRequest;

  const request = fetch(`https://api.cuescore.com/tournament/?id=${tournamentId}`)
    .then(response => {
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return response.json();
    });
  standingsRequests.set(tournamentId, request);
  request.then(
    () => standingsRequests.delete(tournamentId),
    () => standingsRequests.delete(tournamentId)
  );
  return request;
}

function getStandings(json) {
  const completedMatches = json.matches
    .filter(match => match.matchstatus === 'finished')
    .sort((a, b) => new Date(a.starttime) - new Date(b.starttime));
  const lastFiveByTeam = completedMatches.reduce((acc, match) => {
    const matchResult = match.winner || (match.scoreA === match.scoreB ? 0 : match.scoreA > match.scoreB ? 1 : 2);
    for (const [team, teamNumber] of [[match.playerA, 1], [match.playerB, 2]]) {
      if (!acc[team.teamId]) acc[team.teamId] = [];
      const result = matchResult === 0 ? 'T' : matchResult === teamNumber ? 'W' : 'L';
      acc[team.teamId].push(result);
      acc[team.teamId] = acc[team.teamId].slice(-5);
    }
    return acc;
  }, {});

  return Object.values(json.standings || {}).flat().map(({position, played, wins, losses, ties, points, player}) => ({
    position,
    teamName: player.name,
    teamId: player.teamId,
    played,
    wins,
    losses,
    ties,
    points,
    lastFive: lastFiveByTeam[player.teamId] || []
  }));
}

export default function LeagueTable({tournamentId, teamNames, onClose}) {
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchStandings(tournamentId)
      .then(json => {
        if (active) setStandings(getStandings(json));
      })
      .catch(fetchError => {
        if (active) setError(fetchError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tournamentId]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return <div className="table-modal" role="presentation" onClick={onClose}>
    <div className="table-dialog" role="dialog" aria-modal="true" aria-labelledby="league-table-title" onClick={event => event.stopPropagation()}>
      <div className="table-dialog-header">
        <h2 id="league-table-title">League table</h2>
        <button className="close-table" aria-label="Close league table" onClick={onClose}>Close</button>
      </div>
      <div className="table-scroll">
        <table className="league-table">
          <thead>
            <tr><th>#</th><th>Team</th><th>G</th><th>W</th><th>L</th><th>T</th><th>P</th><th>Last 5</th></tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan="8">Unable to load the league table.</td></tr>}
            {isLoading && <tr><td colSpan="8"><div className="table-loader" role="status" aria-label="Loading league table"><span className="spinner" /></div></td></tr>}
            {standings.map(team => <tr className={teamNames.includes(team.teamName) ? 'current-team' : ''} key={team.teamId || team.teamName}>
              <td className="table-position">{team.position}</td>
              <th scope="row">{team.teamName}</th>
              <td>{team.played}</td>
              <td>{team.wins}</td>
              <td>{team.losses}</td>
              <td>{team.ties}</td>
              <td className="table-points">{team.points}</td>
              <td><div className="last-five" aria-label={`Last five: ${team.lastFive.join(', ') || 'No completed games'}`}>
                {[...Array(5)].map((_, index) => {
                  const result = team.lastFive[index];
                  return <span key={index} className={`form-marker ${result ? `form-${result.toLowerCase()}` : 'form-empty'}`}>{result === 'W' ? '✓' : result === 'L' ? '×' : result === 'T' ? '−' : ''}</span>;
                })}
              </div></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
}