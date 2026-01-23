import {useState} from 'react'
import IndividualMatches from "./individual-matches";
import { useIndividualMatchData } from "../hooks/fetch-match-data";
import VenueLogo from '../components/venue-logo.jsx'


function Team({name, members}){
  return <div className='teamOverview'><span className="teamname">{name}</span> {members.map(m => <a href={m.url}>{m.name}</a>)}</div>
}

export default function GameRow({
  venue, 
  venueId, 
  playerA, 
  playerAUrl, 
  playerB, 
  playerBUrl, 
  tournament, 
  tournamentUrl, 
  venueUrl, 
  matchno, 
  shouldFetch, 
  tournamentId, 
  matchId,
  teamA,
  teamB
}){
  const [showDetails, setShowDetails] = useState(false);
  const [showTeams, setShowTeams] = useState(false);
  const individualMatches = useIndividualMatchData(shouldFetch, tournamentId, matchId)
  let scoreA = 0;
  let scoreB = 0;

  for(let match of individualMatches){
    if(match.winner === 1)
      scoreA++
    else if(match.winner === 2)
      scoreB++
  }
  let status = 'waiting';
  if(individualMatches.length){
    if(individualMatches.every(match => match.status === 'waiting'))
      status = 'waiting'
    else if(individualMatches.every(match => match.status === 'finished'))
      status = 'finished'
    else
      status = 'playing'
  }

  if(status === 'waiting'){
   scoreA = null;
   scoreB = null;
  }
    
  return <>
  <div className={`game ${status}`}>
    <VenueLogo venueId={venueId} />
    <div className={`game-details match-${matchId}`}>
      <div className="comp-name"><a href={`${tournamentUrl}#match-${matchno}`}>{tournament}</a> </div>
      <div><a href={playerAUrl}>{playerA}</a> <strong className="scoreA">{scoreA}</strong> - <strong  className="scoreB">{scoreB}</strong> <a href={playerBUrl}>{playerB}</a></div>
      <div className="organizer"><a href={venueUrl}>{venue}</a></div>
    </div>
    <div class="actions">
      <span className="showteams" onClick={() => setShowTeams(c => !c)}>See teams</span>
      {['playing', 'finished'].includes(status) && <span className="showmore" onClick={() => setShowDetails(c => !c)}>See matches</span>}
    </div>
  </div>
  {showTeams && <div className="teammembers"><Team name={playerA} members={teamA} /> <Team name={playerB} members={teamB} /></div>}
  {showDetails && individualMatches.length > 0 && <IndividualMatches matches={individualMatches} />}
  </>
}