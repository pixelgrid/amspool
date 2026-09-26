import {Fragment, useEffect, useState} from 'react';
import {getLeagueFixtures} from '../utils/filter-games.js';

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

function isSelectedMatrixTeam(teamName, selectedMatch) {
  return selectedMatch?.teamName === teamName || selectedMatch?.opponentName === teamName;
}

export default function LeagueTable({tournamentId, teamNames, onClose}) {
  const [standings, setStandings] = useState([]);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [selectedMatrixMatch, setSelectedMatrixMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scheduledGames = getLeagueFixtures(tournamentId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
        <div className="table-dialog-actions">
          <button className="close-table" aria-pressed={showMatrix} onClick={() => setShowMatrix(value => !value)}>{showMatrix ? 'Show table' : 'Show matrix'}</button>
          <button className="close-table" aria-label="Close league table" onClick={onClose}>Close</button>
        </div>
      </div>
      {showMatrix && selectedMatrixMatch && <p className="matrix-match-detail" aria-live="polite">{selectedMatrixMatch.teamName} vs {selectedMatrixMatch.opponentName}: {selectedMatrixMatch.detail}</p>}
      <div className="table-scroll">
        {showMatrix ? <table className="ranking-matrix">
          <thead>
            <tr><th scope="col"># / Team</th>{standings.map(opponent => <th scope="col" className={isSelectedMatrixTeam(opponent.teamName, selectedMatrixMatch) ? 'matrix-team-highlight' : undefined} key={opponent.teamId || opponent.teamName} title={opponent.teamName}>{opponent.position}</th>)}</tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan={standings.length + 1}>Unable to load the league table.</td></tr>}
            {isLoading && <tr><td colSpan={standings.length + 1}><div className="table-loader" role="status" aria-label="Loading league table"><span className="spinner" /></div></td></tr>}
            {standings.map(team => <tr key={team.teamId || team.teamName}>
              <th scope="row" className={isSelectedMatrixTeam(team.teamName, selectedMatrixMatch) ? 'matrix-team-highlight' : undefined} title={team.teamName}><span className="matrix-position">{team.position}</span><span>{team.teamName}</span></th>
              {standings.map(opponent => {
                const isSameTeam = team.teamId === opponent.teamId || team.teamName === opponent.teamName;
                const game = (team.games || team.lastFive || []).find(result => result.opponent === opponent.teamName);
                const scheduledGame = !isSameTeam && !game && scheduledGames
                  .filter(match => new Date(match.startTime) >= today && (
                    (match.playerA === team.teamName && match.playerB === opponent.teamName) ||
                    (match.playerB === team.teamName && match.playerA === opponent.teamName)
                  ))
                  .sort((first, second) => new Date(first.startTime) - new Date(second.startTime))[0];
                const result = game?.result === 'W' ? 'win' : ['D', 'T'].includes(game?.result) ? 'tie' : 'loss';
                const scheduledDate = scheduledGame ? new Date(scheduledGame.startTime) : null;
                const dateLabel = scheduledDate?.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'});
                const fullDate = dateLabel;
                return <td key={opponent.teamId || opponent.teamName} className={isSameTeam ? 'matrix-diagonal' : undefined} aria-label={isSameTeam ? `${team.teamName}, same team` : undefined}>
                  {!isSameTeam && game && <button type="button" className={`matrix-score matrix-${result}`} aria-label={`${team.teamName} ${game.teamScore} to ${game.opponentScore} ${game.result === 'W' ? 'won against' : 'lost to'} ${opponent.teamName}`} title={`${team.teamName} vs ${opponent.teamName}`} onClick={() => setSelectedMatrixMatch({teamName: team.teamName, opponentName: opponent.teamName, detail: `${game.teamScore}-${game.opponentScore}`})}>{game.teamScore}-{game.opponentScore}</button>}
                  {scheduledGame && <button type="button" className="matrix-score matrix-date" aria-label={`${team.teamName} vs ${opponent.teamName}, scheduled ${fullDate}`} title={`${team.teamName} vs ${opponent.teamName}: ${fullDate}`} onClick={() => setSelectedMatrixMatch({teamName: team.teamName, opponentName: opponent.teamName, detail: fullDate})}>{dateLabel}</button>}
                </td>;
              })}
            </tr>)}
          </tbody>
        </table> : <table className="league-table">
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
        </table>}
      </div>
    </div>
  </div>
}