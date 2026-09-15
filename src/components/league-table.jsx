export default function LeagueTable({standings = [], teamNames, onClose}) {
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