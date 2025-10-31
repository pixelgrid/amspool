import jsdom from 'jsdom'
import fs from 'fs';

const leagues = [
    'https://cuescore.com/tournament/Pool+Noord-Holland+Derde+klasse+2025%252F2026/61204750',
    'https://cuescore.com/tournament/Pool+Noord-Holland+Tweede+klasse+2025%252F2026/61204744',
    'https://cuescore.com/tournament/Pool+Noord-Holland+Eerste+klasse+2025%252F2026/61204738',
    'https://cuescore.com/tournament/Pool+Derde+Divisie+Noord-West+2025%252F2026/61204939',
    'https://cuescore.com/tournament/Pool+Tweede+Divisie+Noord+2025%252F2026/61204927',
    'https://cuescore.com/tournament/Pool+Eerste+Divisie+2025%252F2026/61204921',
]

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

async function fetch_league_api_data(tournamentID){
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
  return matchesByID
}

async function main() {

    // return console.log(await fetch_league_html_data(leagues[0]))
    //return console.log(await fetch_league_api_data("61204750"))
    let htmlRequests = leagues.map(fetch_league_html_data);
    let apiRequests = leagues.map(url => url.split("/").at(-1)).map(fetch_league_api_data);

    const htmlData = await Promise.all(htmlRequests);
    const apiData = await Promise.all(apiRequests);

    // enrich html data with api provided ones

    // for each league
    for(let i = 0; i < apiData.length; i++){
        const teamToVenueMapping = htmlData[i]
        const apiRes = apiData[i]
        const league_data = [];

        // for each game in the league
        for(let matchno in apiRes){
            const matchData = apiRes[matchno];
            const playerA = matchData.playerA.name;
            const playerB = matchData.playerB.name;
            const playerAUrl = matchData.playerA.url;
            const playerBUrl = matchData.playerB.url;
            const startTime = matchData.starttime;
            const venueData = teamToVenueMapping[playerA];
            const tournamentUrl = matchData.tournamentUrl;
            const tournamentName = matchData.tournamentName;
            const matchId = matchData.matchId;
            const tournamentId = matchData.tournamentId;

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
                matchno
            })
        }
        writeToDisk(league_data);
    }
    
}

function logAndExit(data){
    console.log(data);
    process.exit(0);
}

function writeToDisk(data){
    const leagueID = data[0].tournamentUrl.split("/").at(-1);
    const fileName = `./league_data/generated/${leagueID}_generated.js`;
    try {
        fs.writeFileSync(fileName, `export default ${JSON.stringify(data, null, 2)}`, 'utf8');
        console.log('Data successfully saved to disk');
    } catch (error) {
        console.log('An error has occurred ', error);
    }
}

main();