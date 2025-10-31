export function extractDataFromHTML(html){
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