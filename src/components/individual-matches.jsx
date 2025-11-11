import DisciplineImage from '../components/discipline-image.jsx'

export default function IndividualMatches({matches}){
  return <div className="matchesoverview">{matches.map(match => {
    return <div className={`individualMatch ${match.status} winner-${match.winner}`}>
      <DisciplineImage discipline={match.discipline} />
      <span>RT{match.raceTo}</span>
      <span className="player A">{match.playerA}</span>
      <span className="score"><span className="scoreA">{match.scoreA}</span> - <span className="scoreB">{match.scoreB}</span></span>
      <span className="player B">{match.playerB}</span>
    </div>
  })}</div>
}