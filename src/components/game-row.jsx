import {useState} from 'react'
import IndividualMatches from "./individual-matches";
import LeagueTable from './league-table.jsx';
import { useIndividualMatchData } from "../hooks/fetch-match-data";
import VenueLogo from '../components/venue-logo.jsx'
import { useMatchUpdates } from '../context/match-context.jsx';

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
  const [showTable, setShowTable] = useState(false);
  const {matchUpdates} = useMatchUpdates();
  const individualMatches = useIndividualMatchData(shouldFetch, tournamentId, matchId)
  const updates = matchUpdates[matchId] || {};
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

  if(updates.scoreA !== undefined)
    scoreA = updates.scoreA;
  if(updates.scoreB !== undefined)
    scoreB = updates.scoreB;

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
    <div className="actions">
      <button className="showteams" onClick={() => setShowTeams(c => !c)}>See teams</button>
      {['playing', 'finished'].includes(status) && <button className="showmore" onClick={() => setShowDetails(c => !c)}>See matches</button>}
      <button className="showtable" onClick={() => setShowTable(true)}>See table</button>
    </div>
  </div>
  {showTeams && <div className="teammembers"><Team name={playerA} members={teamA} /> <Team name={playerB} members={teamB} /></div>}
  {showDetails && individualMatches.length > 0 && <IndividualMatches matches={individualMatches} />}
  {showTable && <LeagueTable tournamentId={tournamentId} teamNames={[playerA, playerB]} onClose={() => setShowTable(false)} />}
  </>
}