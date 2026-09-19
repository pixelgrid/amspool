import {Fragment, useEffect, useState} from 'react';

const standingsRequests = new Map();

function fetchStandings(tournamentId) {
  const existingRequest = standingsRequests.get(tournamentId);
  if (existingRequest) return existingRequest;

  const request = Promise.all([
    fetch(`https://api.cuescore.com/tournament/?id=${tournamentId}`),
    fetch(`https://api.cuescore.com/tournament/?id=${tournamentId}&participants=Participants+list`)
  ]).then(async ([standingsResponse, participantsResponse]) => {
    if (!standingsResponse.ok || !participantsResponse.ok) {
      throw new Error('Unable to load tournament data');
    }
    return {
      standings: await standingsResponse.json(),
      participants: await participantsResponse.json()
    };
  });
  standingsRequests.set(tournamentId, request);
  request.then(
    () => standingsRequests.delete(tournamentId),
    () => standingsRequests.delete(tournamentId)
  );
  return request;
}

function getStandings({standings: json, participants}) {
  const completedMatches = json.matches
    .filter(match => match.matchstatus === 'finished')
    .sort((a, b) => new Date(a.starttime) - new Date(b.starttime));
  const gamesByTeam = completedMatches.reduce((acc, match) => {
    const matchResult = match.winner || (match.scoreA === match.scoreB ? 0 : match.scoreA > match.scoreB ? 1 : 2);
    for (const [team, teamNumber] of [[match.playerA, 1], [match.playerB, 2]]) {
      if (!acc[team.teamId]) acc[team.teamId] = [];
      const result = matchResult === 0 ? 'D' : matchResult === teamNumber ? 'W' : 'L';
      acc[team.teamId].push({
        result,
        opponent: teamNumber === 1 ? match.playerB.name : match.playerA.name,
        teamScore: teamNumber === 1 ? match.scoreA : match.scoreB,
        opponentScore: teamNumber === 1 ? match.scoreB : match.scoreA,
        date: match.starttime
      });
      acc[team.teamId] = acc[team.teamId].slice(-5);
    }
    return acc;
  }, {});
  const membersByTeam = participants.reduce((acc, team) => {
    const members = [...(team.captain ? [team.captain] : []), ...(team.members || [])].filter((member, index, allMembers) =>
      allMembers.findIndex(candidate => candidate.playerId === member.playerId) === index
    );
    acc[team.teamId] = members;
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
    lastFive: gamesByTeam[player.teamId] || [],
    members: membersByTeam[player.teamId] || []
  }));
}

export default function LeagueTable({tournamentId, teamNames, onClose}) {
  const [standings, setStandings] = useState([]);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchStandings(tournamentId)
      .then(data => {
        if (active) setStandings(getStandings(data));
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
            <tr><th>#</th><th>Team</th><th>G</th><th>W</th><th>D</th><th>L</th><th>P</th><th>Last 5</th></tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan="8">Unable to load the league table.</td></tr>}
            {isLoading && <tr><td colSpan="8"><div className="table-loader" role="status" aria-label="Loading league table"><span className="spinner" /></div></td></tr>}
            {standings.map(team => <Fragment key={team.teamId || team.teamName}>
              <tr
                className={`${teamNames.includes(team.teamName) ? 'current-team ' : ''}standings-row`}
                onClick={() => setExpandedTeamId(expandedTeamId === team.teamId ? null : team.teamId)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setExpandedTeamId(expandedTeamId === team.teamId ? null : team.teamId);
                  }
                }}
                tabIndex="0"
                role="button"
                aria-expanded={expandedTeamId === team.teamId}
              >
                <td className="table-position">{team.position}</td>
                <th scope="row">{team.teamName}</th>
                <td>{team.played}</td>
                <td>{team.wins}</td>
                <td>{team.ties}</td>
                <td>{team.losses}</td>
                <td className="table-points">{team.points}</td>
                <td><div className="last-five" aria-label={`Last five: ${team.lastFive.map(game => game.result).join(', ') || 'No completed games'}`}>
                {[...Array(5)].map((_, index) => {
                  const result = team.lastFive[index]?.result;
                  return <span key={index} className={`form-marker ${result ? `form-${result.toLowerCase()}` : 'form-empty'}`} aria-hidden="true" />;
                })}
                </div></td>
              </tr>
              {expandedTeamId === team.teamId && <tr className="standings-details">
                <td colSpan="8">
                  <div className="standings-detail-grid">
                    <section>
                      <h3>Team members</h3>
                      {team.members.length ? <ul className="team-member-list">
                        {team.members.map(member => <li key={member.playerId || member.name}><a href={member.url}>{member.name}</a></li>)}
                      </ul> : <p>No team members available.</p>}
                    </section>
                    <section>
                      <h3>Last 5 games</h3>
                      {team.lastFive.length ? <ul className="recent-games">
                        {[...team.lastFive].reverse().map(game => {
                          const result = game.result === 'T' ? 'D' : game.result;
                          return <li key={`${game.date}-${game.opponent}`}><span className="recent-game-summary"><span className={`game-result result-${result.toLowerCase()}`}>{result} ({game.teamScore}-{game.opponentScore})</span> <span>vs {game.opponent}</span></span></li>;
                        })}
                      </ul> : <p>No completed games.</p>}
                    </section>
                  </div>
                </td>
              </tr>}
            </Fragment>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
}