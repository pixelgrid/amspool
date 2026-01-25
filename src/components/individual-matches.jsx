import React from 'react'
import DisciplineImage from '../components/discipline-image.jsx'
import { useMatchUpdates } from '../context/match-context.jsx';

export default function IndividualMatches({matches}){
  const [selectedPlayer, setSelectedPlayer] = React.useState(null);
  const { matchUpdates } = useMatchUpdates();
  return <div className="matchesoverview">{matches.map((match, index) => {
    const updates = matchUpdates[match.matchId] || {};
    const scoreA = updates.scoreA !== undefined ? updates.scoreA : match.scoreA;
    const scoreB = updates.scoreB !== undefined ? updates.scoreB : match.scoreB;
    const status = updates.status !== undefined ? updates.status : match.status;
    const winner = updates.winner !== undefined ? updates.winner : match.winner;

    return <div key={index} className={`individualMatch ${status} winner-${winner} match-${match.matchId}`}>
      <DisciplineImage discipline={match.discipline} />
      <span>RT{match.raceTo}</span>
      <span className={`player A ${selectedPlayer === match.playerA ? 'selectedPlayer' : ''}`} onClick={() => setSelectedPlayer(match.playerA)}>{match.playerA}</span>
      <span className="score"><span className="scoreA">{scoreA}</span> - <span className="scoreB">{scoreB}</span></span>
      <span className={`player B ${selectedPlayer === match.playerB ? 'selectedPlayer' : ''}`} onClick={() => setSelectedPlayer(match.playerB)}>{match.playerB}</span>
    </div>
  })}</div>
}