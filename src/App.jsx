import { useEffect, useState } from 'react'

import Calendar from './assets/calendar.svg'

import eerste_divisie from '../league_data/eerste_divisie'
import tweede_divisie from '../league_data/tweede_divisie'
import derde_divisie from '../league_data/derde_divisie'

import eerste_klasse from '../league_data/eerste_klasse'
import tweede_klasse from '../league_data/tweede_klasse'
import derde_klasse from '../league_data/derde_klasse'

function find_todays_games(leagues_list){
  const today = new Date().toISOString().split('T')[0]
  const results = {};
  for(let league of leagues_list){
    let league_games = [];
    for(let match of league.matches){
      const startTime = new Date(match.starttime).toISOString().split('T')[0]
      if (startTime === today)
       league_games.push(match)
    }
    if(league_games.length > 0)
    results[league.name] = league_games
  }
  return results
}

const leagues_list = [eerste_divisie, tweede_divisie, derde_divisie, eerste_klasse, tweede_klasse, derde_klasse];
function App() {
  const [matches, setMatches] = useState(null)

  useEffect(() => {
    setMatches(find_todays_games(leagues_list))
  }, []);

  return (
    <>
      <img src={Calendar} />
      <h1>This week in Amsterdam</h1>
      {Object.entries(matches || {}).map(([league, games]) => {
        return <div key={league}>
        <h2>{league}</h2>
        <ul>
          {games.map(game => {
            return <li><a href={game.playerA.url}>{game.playerA.name}</a> - <a href={game.playerB.url}>{game.playerB.name}</a> </li>
          })}
        </ul>
        </div>
      })}
    </>
  )
}

function DateRow({date}){
  return <div className="date">

  </div>
}
function GameRow({venue, venueLogo, playerA, playerB}){
  return <div className="game">
    <img src={venueLogo} alt="" className="venue"/>
    <div>{playerA} - {playerB}</div>
    <div>{venue}</div>
  </div>
}

export default App
