
import React from 'react';
import Select from 'react-select';

import streamData from '../../streamdata/generated';

const players = getPlayers(streamData.players);

/*
function format(data){
    let res = {};

    for(let game of data){
        if(!(game.tournamentId in res))
            res[game.tournamentId] = [];
        res[game.tournamentId].push(game)
    }

    return Object.values(res).reverse();
}*/

function getPlayers(players){
    return players.map(v => ({value: v, label: v}))
}

function filteredGames(data, player){
    if(!player)
        return data;
    let res = [];
    for(let tournamentData of data){
        const games = tournamentData.filter(g => {
            return g.playerA === player.value || g.playerB === player.value;
        });
        if(games.length > 0)
            res.push(games)
    }
    return res;
}

export function Streams(){
    const [selectedPlayer, setSelectPlayer] = React.useState("");

    const filteredGamesArr = React.useMemo(() => filteredGames(streamData.games, selectedPlayer), [selectedPlayer])

    return <div className="streams-container">
        <div className="filters">
            <Select 
                placeholder="Select player" 
                options={players} 
                onChange={setSelectPlayer}
                value={selectedPlayer}
                isClearable
            />
        </div>
        {filteredGamesArr.map((t, index) => <div key={`${t.tournamendId}=${index}`} className="streamrow">
            <div className="date-header">{t[0].tournamentName} - {t[0].date}</div>
            {t.map((m, idx) => {
                return <div key={idx} className="streamed-game">
                    <div className="comp-name">{m.round}</div>
                    <div><a href={m.ytLink}>{m.playerA} {m.scoreA} - {m.scoreB} {m.playerB}</a></div>
                </div>
            })}
        </div>)}
    </div>
}