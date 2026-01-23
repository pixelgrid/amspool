import React from 'react'
import DisciplineImage from '../components/discipline-image.jsx'

export default function IndividualMatches({matches}){
  const [selectedPlayer, setSelectedPlayer] = React.useState(null);
  return <div className="matchesoverview">{matches.map((match, index) => {
    return <div key={index} className={`individualMatch ${match.status} winner-${match.winner} match-${match.matchId}`}>
      <DisciplineImage discipline={match.discipline} />
      <span>RT{match.raceTo}</span>
      <span className={`player A ${selectedPlayer === match.playerA ? 'selectedPlayer' : ''}`} onClick={() => setSelectedPlayer(match.playerA)}>{match.playerA}</span>
      <span className="score"><span className="scoreA">{match.scoreA}</span> - <span className="scoreB">{match.scoreB}</span></span>
      <span className={`player B ${selectedPlayer === match.playerB ? 'selectedPlayer' : ''}`} onClick={() => setSelectedPlayer(match.playerB)}>{match.playerB}</span>
    </div>
  })}</div>
}