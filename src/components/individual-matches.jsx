import DisciplineImage from '../components/discipline-image.jsx'

export default function IndividualMatches({running, matches}){
  if(!running)
    return null

  return <div className="matchesoverview">{matches.map(match => {
    return <div className={`individualMatch ${match.status}`}>
      <DisciplineImage discipline={match.discipline} />
      <span>RT{match.raceTo}</span>
      <span className="player A">{match.playerA}</span>
      <span className={`score winner-${match.winner}`}><span className="scoreA">{match.scoreA}</span> - <span className="scoreB">{match.scoreB}</span></span>
      <span className="player">{match.playerB}</span>
    </div>
  })}</div>
}