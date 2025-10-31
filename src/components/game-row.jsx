import {useState} from 'react'
import IndividualMatches from "./individual-matches";
import { useIndividualMatchData } from "../hooks/fetch-match-data";
import VenueLogo from '../components/venue-logo.jsx'

export default function GameRow({venue, venueId, playerA, playerAUrl, playerB, playerBUrl, tournament, tournamentUrl, venueUrl, matchno, today, tournamentId, matchId}){
  const [showDetails, setShowDetails] = useState(false);
  const individualMatches = useIndividualMatchData(today, tournamentId, matchId)
  const running = individualMatches.some(match => match.status === 'running')
  return <>
  <div className={`game ${running ? 'running' : ''}`} onClick={() => setShowDetails(c => !c)}>
    <VenueLogo venueId={venueId} />
    <div className='game-details'>
      <div className="comp-name"><a href={`${tournamentUrl}#match-${matchno}`}>{tournament}</a> </div>
      <div><a href={playerAUrl}>{playerA}</a> - <a href={playerBUrl}>{playerB}</a></div>
      <div className="organizer"><a href={venueUrl}>{venue}</a></div>
    </div>
  </div>
  {showDetails && <IndividualMatches running={running} matches={individualMatches} />}
  </>
}