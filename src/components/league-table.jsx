import {Fragment, useEffect, useState} from 'react';

const standingsRequests = new Map();

function fetchStandings(tournamentId) {
  const existingRequest = standingsRequests.get(tournamentId);
  if (existingRequest) return existingRequest;

  const request = fetch(`${import.meta.env.BASE_URL}league-data/${tournamentId}/ranking.json`).then(async response => {
    if (!response.ok) throw new Error('Unable to load the league table');
    return response.json();
  });
  standingsRequests.set(tournamentId, request);
  request.then(
    () => standingsRequests.delete(tournamentId),
    () => standingsRequests.delete(tournamentId)
  );
  return request;
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
        if (active) setStandings(data);
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
                        {team.members.map(member => <li key={member.playerId || member.name} className="team-member-item">
                          <div className="member-last-five" aria-label={`Last five: ${member.lastFive.map(game => game.result).join(', ') || 'No completed singles games'}`}>
                            {[...Array(5)].map((_, index) => {
                              const result = member.lastFive[index]?.result;
                              const discipline = member.lastFive[index]?.discipline;
                              return <span key={index} className={`form-marker member-form-marker ${result ? `form-${result.toLowerCase()}` : 'form-empty'}`} aria-hidden="true">{discipline || ''}</span>;
                            })}
                          </div>
                          <a href={member.url}>{member.name}{member.mvp ? ` (${member.mvp})` : ''}</a>
                        </li>)}
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