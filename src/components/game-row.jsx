import {useState} from 'react'
import IndividualMatches from "./individual-matches";
import { useIndividualMatchData } from "../hooks/fetch-match-data";
import VenueLogo from '../components/venue-logo.jsx'

export default function GameRow({venue, venueId, playerA, playerAUrl, playerB, playerBUrl, tournament, tournamentUrl, venueUrl, matchno, today, tournamentId, matchId}){
  const [showDetails, setShowDetails] = useState(false);
  const individualMatches = useIndividualMatchData(today, tournamentId, matchId)
  let status = 'waiting';
  if(individualMatches.length){
    if(individualMatches.some(match => match.status === 'running'))
      status = 'running'
    else if (individualMatches.every(match => match.status === 'finished'))
      status = 'finished'
  }
  return <>
  <div className={`game ${status}`}>
    <VenueLogo venueId={venueId} />
    <div className='game-details'>
      <div className="comp-name"><a href={`${tournamentUrl}#match-${matchno}`}>{tournament}</a> </div>
      <div><a href={playerAUrl}>{playerA}</a> - <a href={playerBUrl}>{playerB}</a></div>
      <div className="organizer"><a href={venueUrl}>{venue}</a></div>
    </div>
  {['running', 'finished'].includes(status) && <span className="showmore" onClick={() => setShowDetails(c => !c)}>Click to show match details</span>}
  </div>
  {showDetails && individualMatches.length > 0 && <IndividualMatches matches={individualMatches} />}
  </>
}