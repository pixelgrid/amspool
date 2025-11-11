import { useEffect, useState } from 'react'

import {find_games_for_date} from './utils/filter-games.js'

import DateRow from './components/date-row.jsx'
import GameRow from './components/game-row.jsx'

const SOCKET = new WebSocket("wss://ws.cuescore.com:11443/");

function App() {
  const [matches, setMatches] = useState(null);

  function handleSocketMessage(message){
    const data = JSON.parse(message.data);
    if(data.action === "UPDATE MATCHES"){
      for(let match of data.data){
        const scoreA = String(match.scoreA);
        const scoreB = String(match.scoreB);
        const status = match.matchstatus;
        const gameRow = document.querySelector(`.match-${match.matchId}`);
        if(gameRow){
          const currentScoreA = document.querySelector(`.match-${match.matchId} .scoreA`).innerHTML;
          const currentScoreB = document.querySelector(`.match-${match.matchId} .scoreB`).innerHTML;

          if(currentScoreA !== scoreA){
            document.querySelector(`.match-${match.matchId} .scoreA`).innerHTML = scoreA;
            document.querySelector(`.match-${match.matchId} .scoreA`).animate([
              {background: 'rgba(255, 206, 70, 1)', color: 'white', transform: "scale(1.4)"},
            ], {
              easing: 'ease-in-out',
              duration: 3000
            })
          }
          if(currentScoreB !== scoreB){
            document.querySelector(`.match-${match.matchId} .scoreB`).innerHTML = scoreB;
            document.querySelector(`.match-${match.matchId} .scoreB`).animate([
              {background: 'rgba(255, 206, 70, 1)', color: 'white', transform: "scale(1.4)"},
            ], {
              easing: 'ease-in-out',
              duration: 3000
            })
          }
          
          if(!gameRow.classList.contains(status)){
            gameRow.classList.remove("playing", "waiting", "finished");
            gameRow.classList.add(status);
          }
          if(status === "finished"){
            const winner = scoreA > scoreB ? 1 : 2;
            gameRow.classList.add("winner-"+winner);
          }
        } 
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
        />))}
    </div>})
}


export default App

const example_socket_message = {
    "action": "UPDATE MATCHES",
    "tournamentId": "61204744",
    "data": [
        {
            "matchId": 65763298,
            "matchno": 3,
            "roundName": "",
            "round": "",
            "playerA": {
                "playerId": 1533289,
                "name": "Leon Qian",
                "firstname": "Leon",
                "lastname": "Qian",
                "url": "https://cuescore.com/player/Leon+Qian/1533289",
                "image": "https://img.cuescore.com/image/2/4/24df194c4dc7d1abf3558874549d49ef.png?t=1744920060",
                "country": {
                    "name": "China",
                    "alpha3": "CHN",
                    "image": "https://cuescore.com/img/flags/png-country-4x2-none/res-640x480/cn.png",
                    "continent": "Asia"
                },
                "represents": {
                    "organizationId": 59097676,
                    "stub": "mokumpooldarts",
                    "name": "Mokum Pool & Darts",
                    "url": "https://cuescore.com/mokumpooldarts",
                    "logo": "//img.cuescore.com/image/e/2/e3bef447cfa9c22ef26ca952809e17a6.png?t=1745784763",
                    "profileColor": ""
                }
            },
            "playerB": {
                "playerId": 1159837,
                "name": "Ahmet Bozkurt",
                "firstname": "Ahmet",
                "lastname": "Bozkurt",
                "url": "https://cuescore.com/player/Ahmet+Bozkurt/1159837",
                "image": "https://img.cuescore.com/image/d/4/d480358bf81b993ce056fd38f4a03db8.png?t=1737318460",
                "country": {
                    "name": "Netherlands",
                    "alpha3": "NLD",
                    "image": "https://cuescore.com/img/flags/png-country-4x2-none/res-640x480/nl.png",
                    "continent": "Europe"
                },
                "represents": {
                    "organizationId": 30882457,
                    "stub": "westendsnooker",
                    "name": "Westend Snooker",
                    "url": "https://cuescore.com/westendsnooker",
                    "logo": "//img.cuescore.com/image/4/2/45ac49062ace5e43a75c94f8226e97e3.png?t=1555513043",
                    "profileColor": ""
                }
            },
            "scoreA": 28,
            "scoreB": 40,
            "raceTo": 50,
            "discipline": "Straightpool",
            "disciplineId": 5,
            "branch": 1,
            "penalty": 0,
            "groupNo": 0,
            "inningsPlayerA": 15,
            "inningsPlayerB": 14,
            "highBreaksA": "",
            "highBreaksB": "15",
            "runoutsA": 0,
            "runoutsB": 0,
            "lagWinner": "A",
            "table": {
                "tableId": 7971349,
                "name": "8",
                "manufacturer": "Buffalo",
                "model": "Pro II",
                "branch": "American pool",
                "branchId": 1,
                "size": 9,
                "cloth": "",
                "pockets": "",
                "slate": "",
                "description": "",
                "venue": {
                    "venueId": 1168481,
                    "name": "Poollokaal De Gracht",
                    "url": "https://cuescore.com/venue/Poollokaal+De+Gracht/1168481",
                    "owner": {
                        "organizationId": 1148276,
                        "stub": "KNBB",
                        "name": "Koninklijke Nederlandse Biljartbond",
                        "url": "https://cuescore.com/KNBB",
                        "logo": "//img.cuescore.com/image/d/2/d78f8019b525670fa5007071f107e124.png?t=1555513055",
                        "profileColor": "f7a707"
                    }
                }
            },
            "tournamentId": 61204744,
            "challengeId": 0,
            "starttime": "2025-11-11T21:07:50",
            "stoptime": "",
            "matchstatus": "playing",
            "matchstatusCode": 1,
            "bestOfSets": 0,
            "useInnings": true,
            "frames": [],
            "properties": {
                "lagWinsA": 1,
                "lagWinsB": 0
            },
            "sets": [],
            "curVersion": 2636,
            "notes": [
                {
                    "note": "frame start",
                    "time": "2025-11-11T20:10:06.158Z"
                },
                {
                    "note": "rack 15",
                    "time": "2025-11-11T20:10:06.158Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:10:06.158Z"
                },
                {
                    "note": "A breaking",
                    "time": "2025-11-11T20:10:06.158Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:11:07.182Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:11:07.182Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:11:21.620Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:11:21.620Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:12:36.247Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:12:36.247Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:12:36.247Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:12:36.247Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:15:02.573Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:15:02.573Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:15:02.573Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:15:02.573Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:15:02.573Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:15:02.573Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:15:02.573Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:16:36.172Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:16:36.172Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:16:36.172Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:16:36.172Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:20:05.993Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:20:05.993Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:20:15.328Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:20:15.328Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:20:15.328Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:20:15.328Z"
                },
                {
                    "note": "A foul 1",
                    "time": "2025-11-11T20:20:15.328Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:20:15.328Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:20:15.328Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:21:37.876Z"
                },
                {
                    "note": "rack 14",
                    "time": "2025-11-11T20:21:37.876Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:22:23.467Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:22:23.467Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:22:23.467Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:22:39.803Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:22:39.803Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:24:41.707Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:24:41.707Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:26:43.756Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:26:43.756Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:26:43.756Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:26:43.756Z"
                },
                {
                    "note": "A foul 1",
                    "time": "2025-11-11T20:26:43.756Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:26:43.756Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:26:43.756Z"
                },
                {
                    "note": "B foul 1",
                    "time": "2025-11-11T20:26:58.624Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:26:58.624Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:26:58.624Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:29:54.211Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:29:54.211Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:29:54.211Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:29:54.211Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:29:54.211Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:29:54.211Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:33:10.960Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:33:10.960Z"
                },
                {
                    "note": "B foul 1",
                    "time": "2025-11-11T20:33:10.960Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:33:10.960Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:33:10.960Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:34:41.959Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:34:41.959Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:34:41.959Z"
                },
                {
                    "note": "rack 14",
                    "time": "2025-11-11T20:34:41.959Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:35:26.368Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:35:26.368Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:35:26.368Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:36:24.857Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:36:24.857Z"
                },
                {
                    "note": "A foul 1",
                    "time": "2025-11-11T20:36:28.376Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:36:28.377Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:36:28.377Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:38:34.051Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:38:34.051Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:38:34.051Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:38:34.051Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:38:34.051Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:41:11.420Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:41:11.420Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:41:11.420Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:41:11.420Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:41:11.420Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "rack 14",
                    "time": "2025-11-11T20:44:47.846Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:45:43.107Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:45:43.107Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:48:01.332Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:48:01.332Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:48:06.182Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:48:06.182Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:48:06.182Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:51:27.235Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:51:27.235Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:51:30.186Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "rack 14",
                    "time": "2025-11-11T20:54:48.285Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:55:17.892Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:55:17.892Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T20:55:49.814Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T20:55:49.814Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T20:55:49.814Z"
                },
                {
                    "note": "A pot one",
                    "time": "2025-11-11T20:56:32.454Z"
                },
                {
                    "note": "A inning end",
                    "time": "2025-11-11T20:56:32.454Z"
                },
                {
                    "note": "B inning start",
                    "time": "2025-11-11T20:56:32.454Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "rack 14",
                    "time": "2025-11-11T21:03:33.260Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:06:42.151Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:06:42.151Z"
                },
                {
                    "note": "B pot one",
                    "time": "2025-11-11T21:06:42.151Z"
                },
                {
                    "note": "B inning end",
                    "time": "2025-11-11T21:06:42.151Z"
                },
                {
                    "note": "A inning start",
                    "time": "2025-11-11T21:06:42.151Z"
                }
            ],
            "matchType": 0,
            "videoLink": "",
            "comment": "",
            "parentId": 65762026,
            "teamComment": "",
            "winnerNext": "",
            "loserNext": ""
        },
        {
            "matchId": 65762026,
            "matchno": 49,
            "roundName": "Round 7",
            "round": 7,
            "playerA": {
                "teamId": 46973665,
                "name": "The Pocketeers",
                "url": "https://cuescore.com/team/The+Pocketeers/46973665",
                "image": "https://img.cuescore.com/image/c/4/cf7799db6c819ff8576877b1bd076e64.png?t=1723635376",
                "country": {
                    "name": "Netherlands",
                    "alpha3": "NLD",
                    "image": "https://cuescore.com/img/flags/png-country-4x2-none/res-640x480/nl.png",
                    "continent": "Europe"
                }
            },
            "playerB": {
                "teamId": 31196614,
                "name": "No ExCues",
                "url": "https://cuescore.com/team/No+ExCues/31196614",
                "image": "https://img.cuescore.com/image/8/4/8436532900f7681518ba1af235c1083d.png?t=1722800214",
                "country": {
                    "name": "Netherlands",
                    "alpha3": "NLD",
                    "image": "https://cuescore.com/img/flags/png-country-4x2-none/res-640x480/nl.png",
                    "continent": "Europe"
                }
            },
            "scoreA": 2,
            "scoreB": 2,
            "raceTo": 6,
            "discipline": "Multiball",
            "disciplineId": 10,
            "branch": 1,
            "penalty": 0,
            "groupNo": 1,
            "inningsPlayerA": 0,
            "inningsPlayerB": 0,
            "highBreaksA": "",
            "highBreaksB": "",
            "runoutsA": 0,
            "runoutsB": 0,
            "lagWinner": "A",
            "table": [],
            "tournamentId": 61204744,
            "challengeId": 0,
            "starttime": "2025-11-11T20:00:00",
            "stoptime": "",
            "matchstatus": "playing",
            "matchstatusCode": 1,
            "bestOfSets": 0,
            "useInnings": false,
            "frames": [],
            "properties": {
                "runoutsB": 0,
                "runoutsA": 0,
                "lagWinsB": 0,
                "lagWinsA": 1
            },
            "sets": [],
            "curVersion": 2636,
            "notes": [],
            "matchType": 1,
            "videoLink": "",
            "comment": "",
            "winnerNext": "",
            "loserNext": ""
        }
    ]
}