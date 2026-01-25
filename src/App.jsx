import { useEffect, useState } from 'react'

import {find_games_for_date} from './utils/filter-games.js'

import DateRow from './components/date-row.jsx'
import GameRow from './components/game-row.jsx'
import {Streams} from './components/streams.jsx'
import { useMatchUpdates, MatchProvider } from './context/match-context.jsx'

const SOCKET = new WebSocket("wss://ws.cuescore.com:11443/");


function App(){
    const showStreams = window.location.search.includes("streams");
    if(showStreams)
      return <Streams />
    return <MatchProvider><LeagueMatches /></MatchProvider>
}

function LeagueMatches() {
  const [matches, setMatches] = useState(null);
  const { updateMatch } = useMatchUpdates();
  function handleSocketMessage(message){
    const data = JSON.parse(message.data);
    if(data.action === "UPDATE MATCHES"){
      for(let match of data.data){
        updateMatch(
          match.matchId,
          String(match.scoreA),
          String(match.scoreB),
          match.matchstatus,
          match.matchstatus === "finished" ? match.scoreA > match.scoreB ? 1 : 2 : 0
        );
      }
    }
  }

  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate()-2);
    const result = [];
    for(let i = 0; i < 7; i++){
      const dt = date.setDate(date.getDate() + 1);
      const res = find_games_for_date(dt);
      if(res[1].length > 0)
      result.push(res)
    }
    setMatches(result);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    matches?.filter(m => m[0] === today).forEach(([d, leagues]) => {
      
      const gameIDs = [];
      for(let league of leagues){
        for(let game of league){
          gameIDs.push(game.matchId)
        }
      }
      SOCKET.addEventListener("open", (event) => {
        SOCKET.addEventListener("message", handleSocketMessage);
        SOCKET.send(JSON.stringify({"subscribeTo": gameIDs}))
      });
      
    })

    return () => SOCKET.removeEventListener("message", handleSocketMessage);
  }, [matches])

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
          shouldFetch={g.shouldFetch}
          tournamentId={g.tournamentId}
          teamA={g.teamA}
          teamB={g.teamB}
        />))}
    </div>})
}


export default App