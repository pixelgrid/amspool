import jsdom from 'jsdom'
import fs from 'fs';

import {extractDataFromHTML} from '../src/utils/extract-match-details-from-html.js';
import {normalizeSubMatch, teamFileName} from '../src/utils/normalize-sub-match.js';
import {parseMvpHTML} from '../src/utils/parse-mvp-html.js';

export const leagues = [
    'https://cuescore.com/tournament/Pool+Noord-Holland+Eerste+klasse+2026%252F2027/83574424',
    'https://cuescore.com/tournament/Pool+Noord-Holland+Tweede+klasse+2026%252F2027/83574427',
    'https://cuescore.com/tournament/Pool+Noord-Holland+Derde+klasse+2026%252F2027/83574403',
    'https://cuescore.com/tournament/Pool+Eerste+Divisie+2026%252F2027/83574886',
    'https://cuescore.com/tournament/Pool+Tweede+Divisie+Noord+2026%252F2027/83574889',
    'https://cuescore.com/tournament/Pool+Derde+Divisie+Noord-West+2026%252F2027/83574898',
    'https://cuescore.com/tournament/Pool+Eredivisie+2026%252F2027/83574874'
]

async function fetch_match_html_data({matchId, tournamentId}){
  const url = `https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`;
  const res = await fetch(url);
  const body = await res.text();
  const htmlTree = new jsdom.JSDOM(body);
  return extractDataFromHTML(htmlTree.window.document);
}

async function fetch_league_html_data(url){
  const res = await fetch(url);
  const body = await res.text();
  const dom = new jsdom.JSDOM(body);

  return [...dom.window.document.querySelectorAll("tr.match:not(:last-child)")].reduce((acc, row) => {
    const teamA = row.querySelector("td.playerA .name").textContent;
    const venue = row.querySelector("td.venue a");
    const venueUrl = venue.href;
    const venueID = venueUrl.split("/").at(-1);
    const venueName = venue.textContent;

    if(!(teamA in acc)){
        acc[teamA] = {venueName, venueID, venueUrl}
    }
    return acc
  }, {})
}

async function fetch_league_mvp_data(url){
    const res = await fetch(`${url}/mvp`);
    const body = await res.text();
    const dom = new jsdom.JSDOM(body);
    return parseMvpHTML(dom.window.document);
}

export async function fetch_league_api_data(tournamentID){
  const req = await fetch("https://api.cuescore.com/tournament/?id=" + tournamentID)
  const json = await req.json();

  const matches = json.matches;
  const matchesByID = matches.reduce((acc, curr) => {
    curr.tournamentUrl = json.url;
    curr.tournamentName = json.name;
    curr.tournamentId = json.tournamentId;
    acc[curr.matchno] = curr
    return acc
  }, {})
    return {matches: matchesByID, standings: json.standings}
}

async function fetch_sub_match_data(tournamentID){
    const req = await fetch(`https://api.cuescore.com/match/sub/all/?tournamentId=${tournamentID}`)
    return await req.json();
}

async function fetch_league_teams_data(tournamentID){
    const req = await fetch(`https://api.cuescore.com/tournament/?id=${tournamentID}&participants=Participants+list`)
    return await req.json();
}

function formatTeamMembers(teamData){
    let result = {};
    for(let team of teamData){
        const teamId = team.teamId;
        let members = [];
        let captainId = 0;
        if(team.captain){
            members.push({playerId: team.captain.playerId, name: team.captain.name, url: team.captain.url});
            captainId = team.captain.playerId;
        }

        // captain always first in the array
        for(let member of team.members){
            const {playerId, url, name} = member;
            if(playerId === captainId){
                continue;
            }
            members.push({playerId, url, name})
        }
        result[teamId] = members;
    }
    return result;
}

function addMvpData(teamMembers, mvpData){
    return (teamMembers || []).map(member => {
        const mvpPlayer = mvpData.find(player => String(player.playerId) === String(member.playerId));
        return {
            ...member,
            ...(mvpPlayer ? {mvp: mvpPlayer.mvp, stats: mvpPlayer.stats} : {})
        };
    });
}

function buildRankingData(apiData, participants, subMatches, mvpData){
    const completedMatches = Object.values(apiData.matches)
        .filter(match => match.matchstatus === 'finished')
        .sort((a, b) => new Date(a.starttime) - new Date(b.starttime));
    const gamesByTeam = completedMatches.reduce((acc, match) => {
        const matchResult = match.winner || (match.scoreA === match.scoreB ? 0 : match.scoreA > match.scoreB ? 1 : 2);
        for(const [team, teamNumber] of [[match.playerA, 1], [match.playerB, 2]]){
            if(!acc[team.teamId]) acc[team.teamId] = [];
            acc[team.teamId].push({
                result: matchResult === 0 ? 'D' : matchResult === teamNumber ? 'W' : 'L',
                opponent: teamNumber === 1 ? match.playerB.name : match.playerA.name,
                teamScore: teamNumber === 1 ? match.scoreA : match.scoreB,
                opponentScore: teamNumber === 1 ? match.scoreB : match.scoreA,
                date: match.starttime
            });
            acc[team.teamId] = acc[team.teamId].slice(-5);
        }
        return acc;
    }, {});
    const membersByTeam = Object.fromEntries(Object.entries(formatTeamMembers(participants)).map(([teamId, members]) => [
        teamId,
        addMvpData(members, mvpData)
    ]));
    const gamesByPlayer = subMatches
        .filter(match => match.matchstatus === 'finished' && !match.doublesA && !match.doublesB)
        .sort((a, b) => new Date(a.starttime) - new Date(b.starttime))
        .reduce((acc, match) => {
            const matchResult = match.winner || (match.scoreA === match.scoreB ? 0 : match.scoreA > match.scoreB ? 1 : 2);
            for(const [player, playerNumber] of [[match.playerA, 1], [match.playerB, 2]]){
                if(!player?.playerId) continue;
                if(!acc[player.playerId]) acc[player.playerId] = [];
                acc[player.playerId].push({
                    result: matchResult === 0 ? 'D' : matchResult === playerNumber ? 'W' : 'L',
                    discipline: {2: 8, 3: 9, 4: 10, 5: 14}[match.disciplineId],
                    date: match.starttime
                });
                acc[player.playerId] = acc[player.playerId].slice(-5);
            }
            return acc;
        }, {});

    for(const members of Object.values(membersByTeam)){
        for(const member of members) member.lastFive = gamesByPlayer[member.playerId] || [];
    }

    return Object.values(apiData.standings || {}).flat().map(({position, played, wins, losses, ties, points, player}) => ({
        position,
        teamName: player.name,
        teamId: player.teamId,
        played,
        wins,
        losses,
        ties,
        points,
        lastFive: gamesByTeam[player.teamId] || [],
        members: membersByTeam[player.teamId] || []
    }));
}

function writeLeagueTableData(leagueId, rankingData, mvpData){
    const directory = `./public/league-data/${leagueId}`;
    fs.mkdirSync(directory, {recursive: true});
    fs.writeFileSync(`${directory}/ranking.json`, JSON.stringify(rankingData, null, 2), 'utf8');
    fs.writeFileSync(`${directory}/mvp.json`, JSON.stringify(mvpData, null, 2), 'utf8');
}
async function main() {

    //return console.log(await fetch_league_html_data(leagues[0]))
    //return console.log(await fetch_league_api_data("61204750"))
    const htmlRequests = leagues.map(fetch_league_html_data);
    const mvpRequests = leagues.map(fetch_league_mvp_data);
    const leagueIDs = leagues.map(url => url.split("/").at(-1));
    const apiRequests = leagueIDs.map(fetch_league_api_data);
    const teamRequests = leagueIDs.map(fetch_league_teams_data);
    const subMatchRequests = leagueIDs.map(fetch_sub_match_data);

    const htmlData = await Promise.all(htmlRequests);
    const mvpData = await Promise.all(mvpRequests);
    const apiData = await Promise.all(apiRequests);
    const teamData = await Promise.all(teamRequests);
    const subMatchData = await Promise.all(subMatchRequests);
    const formatedTeamMembers = formatTeamMembers(teamData.flat());
    // enrich html data with api provided ones

    // for each league
    for(let i = 0; i < apiData.length; i++){
        const teamToVenueMapping = htmlData[i]
        const {matches: apiRes} = apiData[i]
        const league_data = [];

        // for each game in the league
        for(let matchno in apiRes){
            const matchData = apiRes[matchno];
            const playerA = matchData.playerA.name;
            const playerB = matchData.playerB.name;
            const playerAUrl = matchData.playerA.url;
            const playerBUrl = matchData.playerB.url;
            const playerAId = matchData.playerA.teamId;
            const playerBId = matchData.playerB.teamId;
            const startTime = matchData.starttime;
            const venue = matchData.playerA.venue || matchData.playerB.venue;
            const venueData = teamToVenueMapping[playerA] || (venue && {
                venueName: venue.name,
                venueID: venue.venueId,
                venueUrl: venue.url
            });
            const tournamentUrl = matchData.tournamentUrl;
            const tournamentName = matchData.tournamentName;
            const matchId = matchData.matchId;
            const tournamentId = matchData.tournamentId;

            /*
            if(matchData.matchstatus === 'finished'){
                finishedMatches.push({matchId, tournamentId});
            }*/

            league_data.push({
                playerA, 
                playerB, 
                playerAUrl, 
                playerBUrl, 
                startTime, 
                venueData, 
                tournamentUrl, 
                tournamentName,
                tournamentId,
                matchId,
                matchno,
                teamA: addMvpData(formatedTeamMembers[playerAId], mvpData[i]),
                teamB: addMvpData(formatedTeamMembers[playerBId], mvpData[i])
            })
        }
        writeToDisk(league_data, leagueIDs[i]);
        writeLeagueTableData(leagueIDs[i], buildRankingData(apiData[i], teamData[i], subMatchData[i], mvpData[i]), mvpData[i]);
        writeTeamMatchData(subMatchData[i], leagueIDs[i], apiRes);
    }
    /*
    const matchData = await Promise.all(finishedMatches.map(fetch_match_html_data));
    writeMatchesToDisk(finishedMatches, matchData);
    */
}

function logAndExit(data){
    console.log(data);
    process.exit(0);
}

function writeToDisk(data, league_id){
    const fileName = `./league_data/generated/${league_id}_generated.js`;
    try {
        fs.writeFileSync(fileName, `export default ${JSON.stringify(data, null, 2)}`, 'utf8');
        console.log('Data successfully saved to disk');
    } catch (error) {
        console.log('An error has occurred ', error);
    }
}

function writeMatchesToDisk(finishedMatches, matchData){

    for(let i = 0; i < finishedMatches.length; i++){
        const {matchId, tournamentId} = finishedMatches[i];
        const fileName = `./public/match_data/${tournamentId}_${matchId}.json`;
        try {
            fs.writeFileSync(fileName, JSON.stringify(matchData[i], null, 2), 'utf8');
            console.log('Data successfully saved to disk');
        } catch (error) {
            console.log('An error has occurred ', error);
        }
    }

}

function writeTeamMatchData(subMatches, leagueId, fixtureData){
    const matchesByTeam = new Map();
    const directory = `./public/match-data/${leagueId}`;

    fs.rmSync(directory, {recursive: true, force: true});

    for(const match of subMatches){
        const fixture = Object.values(fixtureData).find(item => String(item.matchId) === String(match.parentId));
        if(!fixture) continue;

        const normalized = normalizeSubMatch(match);
        for(const teamName of [fixture.playerA.name, fixture.playerB.name]){
            if(!matchesByTeam.has(teamName)) matchesByTeam.set(teamName, []);
            matchesByTeam.get(teamName).push(normalized);
        }
    }

    for(const [teamName, matches] of matchesByTeam){
        fs.mkdirSync(directory, {recursive: true});
        fs.writeFileSync(`${directory}/${teamFileName(teamName)}.json`, JSON.stringify(matches, null, 2), 'utf8');
    }
}

main();
