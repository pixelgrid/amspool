import {useEffect, useState} from 'react';

const mvpRequests = new Map();

function fetchMvpData(tournamentId) {
  const existingRequest = mvpRequests.get(tournamentId);
  if (existingRequest) return existingRequest;

  const request = fetch(`${import.meta.env.BASE_URL}league-data/${tournamentId}/mvp.json`).then(async response => {
    if (!response.ok) throw new Error('Unable to load the MVP table');
    return response.json();
  });
  mvpRequests.set(tournamentId, request);
  request.then(
    () => mvpRequests.delete(tournamentId),
    () => mvpRequests.delete(tournamentId)
  );
  return request;
}

function formatStats(stats) {
  if (!stats) return '-';
  const values = Object.values(stats).filter(value => value !== null);
  return values.length ? values.join(' / ') : '-';
}

export default function MvpTable({tournamentId, onClose}) {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchMvpData(tournamentId)
      .then(data => {
        if (active) setPlayers(Object.values(data));
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

  const disciplines = players[0] ? Object.keys(players[0].stats) : [];

  return <div className="table-modal" role="presentation" onClick={onClose}>
    <div className="table-dialog" role="dialog" aria-modal="true" aria-labelledby="mvp-table-title" onClick={event => event.stopPropagation()}>
      <div className="table-dialog-header">
        <h2 id="mvp-table-title">MVP table</h2>
        <button className="close-table" aria-label="Close MVP table" onClick={onClose}>Close</button>
      </div>
      <div className="table-scroll">
        <table className="mvp-table">
          <thead>
            <tr><th>#</th><th>Player</th><th>MVP</th>{disciplines.map(discipline => <th key={discipline}>{discipline}<br /><small>MP / W / F / L</small></th>)}</tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan={3 + disciplines.length}>Unable to load the MVP table.</td></tr>}
            {isLoading && <tr><td colSpan={3 + disciplines.length}><div className="table-loader" role="status" aria-label="Loading MVP table"><span className="spinner" /></div></td></tr>}
            {players.map((player, index) => <tr key={player.playerId || player.name}>
              <td>{index + 1}</td>
              <td><a href={player.url}>{player.name}</a></td>
              <td className="table-points">{player.mvp}</td>
              {disciplines.map(discipline => <td key={discipline}>{formatStats(player.stats[discipline])}</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}