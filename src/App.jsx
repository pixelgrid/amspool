import { useEffect, useState } from 'react'

import {find_games_for_date} from './utils/filter-games.js'

import DateRow from './components/date-row.jsx'
import GameRow from './components/game-row.jsx'


function App() {
  const [matches, setMatches] = useState(null)

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


export default App
