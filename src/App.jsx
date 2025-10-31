import React, { useEffect, useState } from 'react'

import Calendar from './assets/calendar-black.svg'
import mokumLogo from './assets/venues/mokum.png';
import boventijLogo from './assets/venues/boventij.png'
import degrachtLogo from './assets/venues/degracht.jpeg'
import planbLogo from './assets/venues/planb.png'
import genericLogo from './assets/venues/genericvenue.png'
import purplepoolLogo from './assets/venues/purplepool.png'
import wizardsLogo from './assets/venues/wizards.png'
import gocustomsLogo from './assets/venues/gocustoms.png'

import eightballImage from './assets/balls/8ball.png'
import nineballImage from './assets/balls/9ball.png'
import tenballImage from './assets/balls/10ball.png'
import fourteenballImage from './assets/balls/straight.png'

import eerste_divisie from '../league_data/generated/61204921_generated'
import tweede_divisie from '../league_data/generated/61204927_generated'
import derde_divisie from '../league_data/generated/61204939_generated'

import eerste_klasse from '../league_data/generated/61204738_generated'
import tweede_klasse from '../league_data/generated/61204744_generated'
import derde_klasse from '../league_data/generated/61204750_generated'

const MOKUM_POOL_DARTS_VENUE_ID = '60451687'
const BOVEN_T_IJ_VENUE_ID = '1172427'
const PLAN_B_VENUE_ID = '1167894'
const PLAN_B_VENUE_ID_2 = '1343989'
const DE_GRACHT_VENUE_ID = '1168481'
const PURPLE_POOL_VENUE_ID = '1126046'
const WIZARDS_VENUE_ID = '1168741'
const GOCUSTOMS_VENUE_ID = '32618059'

function find_games_for_date(date){
  const today = new Date().toISOString().split('T')[0];
  const targetDate = new Date(date).toISOString().split('T')[0]
  const results = [];
  for(let league of leagues_list){
    let league_games = [];
    for(let match of league){
      const startTime = new Date(match.startTime).toISOString().split('T')[0]
      if(startTime === today)
        match.today = true;
      if (startTime === targetDate)
       league_games.push(match)
    }
    if(league_games.length > 0)
    results.push(league_games)
  }
  return [targetDate, results]
}

const leagues_list = [eerste_divisie, tweede_divisie, derde_divisie, eerste_klasse, tweede_klasse, derde_klasse];
function App() {
  const [matches, setMatches] = useState(null)

  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate()-1);
    const result = [];
    for(let i = 0; i < 7; i++){
      const dt = date.setDate(date.getDate() + 1);
      const res = find_games_for_date(dt);
      if(res[1].length > 0)
      result.push(res)
    }
    setMatches(result);
  }, []);

  return (matches || []).map(([date, games]) => {
    return <div key={date}>
      <DateRow date={new Date(date)} />
      {games.map((game, index) => game.map(g => 
        <GameRow 
          key={index} 
          playerA={g.playerA}
          playerAUrl={g.playerAUrl} 
          playerB={g.playerB}
          playerBUrl={g.playerBUrl}
          venue={g.venueData.venueName} 
          tournament={g.tournamentName}
          tournamentUrl={g.tournamentUrl} 
          venueUrl={g.venueData.venueUrl}
          venueId={g.venueData.venueID}
          matchno={g.matchno}
          matchId={g.matchId}
          today={g.today}
          tournamentId={g.tournamentId}
        />))}
    </div>
  })
}

function DateRow({date}){
    const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
  return <span className='date-header'> <img src={Calendar} className="calendar-m" /> {formattedToday}</span>
}

function GameRow({venue, venueId, playerA, playerAUrl, playerB, playerBUrl, tournament, tournamentUrl, venueUrl, matchno, today, tournamentId, matchId}){
  const [showDetails, setShowDetails] = React.useState(false);
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

function IndividualMatches({running, matches}){
  if(!running)
    return null

  return <div className="matchesoverview">{matches.map(match => {
    return <div className={`individualMatch ${match.status}`}>
      <Discipline discipline={match.discipline} />
      <span>RT{match.raceTo}</span>
      <span className="player A">{match.playerA}</span>
      <span className={`score winner-${match.winner}`}><span className="scoreA">{match.scoreA}</span> - <span className="scoreB">{match.scoreB}</span></span>
      <span className="player">{match.playerB}</span>
    </div>
  })}</div>
}

function Discipline({discipline}){
  switch (discipline){
    case 2:
    case '2':
      return <img className="discipline" src={eightballImage} />
    case 3:
    case '3':
      return <img className="discipline" src={nineballImage} />
    case 4:
    case '4':
      return <img className="discipline" src={tenballImage} />
    case 5:
    case '5':
      return <img className="discipline" src={fourteenballImage} />
    default:
      return null;
  }
}
function useIndividualMatchData(today, tournamentId, matchId){
  const [matches, setMatches] = React.useState([]);
  // hacky way to find if time in amsterdam is past 20:00
  const isTournametStartTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Amsterdam"}).includes(" 20:");

 
  React.useEffect(() => {
    if(!today /*|| !isTournametStartTime*/)
      return
    const fetchHtml = async (tournamentId, matchId) => {
        const encoded = encodeURIComponent(`https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`)
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`);
        const html = await res.text();
        setMatches(extractDataFromHTML(html))
    }
    fetchHtml(tournamentId, matchId);
  }, [])
  return matches;
}

function extractDataFromHTML(html){
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(html, 'text/html');
  const allRows = htmlDoc.querySelectorAll("tr");
  const games = [];

  // in chunks of 2. first row game metadata, second game score and players.
  for(let i = 0; i < allRows.length; i += 2){
    const metadataRow = allRows[i];
    const gameRow = allRows[i + 1];

    const discipline = gameRow.dataset.discipline;
    const raceTo = metadataRow.querySelector(".readonlyFields .raceTo .raceTo").textContent;
    const running = metadataRow.classList.contains("playing");
    const finished = metadataRow.classList.contains("finished");
    const waiting = metadataRow.classList.contains("waiting");

    const status = waiting ? 'waiting' : running ? 'running' : 'finished';
    const playerA = gameRow.querySelector(".playerA .name").textContent;
    const playerB = gameRow.querySelector(".playerB .name").textContent;
    const scoreA = gameRow.querySelector(".scoreA input").value;
    const scoreB = gameRow.querySelector(".scoreB input").value;
    const playerAWinner = gameRow.querySelector(".scoreA").classList.contains("winner");
    const playerBWinner = gameRow.querySelector(".scoreB").classList.contains("winner");
    const runoutsA = gameRow.querySelector(".playerA .runouts").textContent;
    const runoutsB = gameRow.querySelector(".playerB .runouts").textContent;
    const winner = playerAWinner ? 1 : playerBWinner ? 2 : 0;
    games.push({discipline, raceTo, status, playerA, playerB, scoreA, scoreB, runoutsA, runoutsB, winner})
  }
  return games;
}
function VenueLogo({venueId}){
  switch(venueId){
    case MOKUM_POOL_DARTS_VENUE_ID:
      return <img src={mokumLogo} alt="" className="venue-logo" />
    case BOVEN_T_IJ_VENUE_ID:
      return <img src={boventijLogo} alt="" className="venue-logo" />
    case PLAN_B_VENUE_ID:
    case PLAN_B_VENUE_ID_2:
      return <img src={planbLogo} alt="" className="venue-logo" />
    case DE_GRACHT_VENUE_ID:
      return <img src={degrachtLogo} alt="" className="venue-logo" />
    case PURPLE_POOL_VENUE_ID:
      return <img src={purplepoolLogo} alt="" className="venue-logo" />
    case WIZARDS_VENUE_ID:
      return <img src={wizardsLogo} alt="" className="venue-logo" />
    case GOCUSTOMS_VENUE_ID:
      return <img src={gocustomsLogo} alt="" className="venue-logo" />
    default:
      return <img src={genericLogo} alt="" className="venue-logo" />
  }
}

export default App
