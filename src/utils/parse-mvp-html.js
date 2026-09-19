const statNames = {
  MP: 'matchesPlayed',
  MW: 'matchesWon',
  FW: 'framesWon',
  FL: 'framesLost',
  PW: 'pointsWon',
  PL: 'pointsLost'
};

function parseNumber(value) {
  const trimmed = value.trim();
  return trimmed === '' ? null : Number(trimmed);
}

function normalizeUrl(url) {
  return url.startsWith('//') ? `https:${url}` : url;
}

export function parseMvpHTML(document) {
  const table = document.querySelector('table.mvp');
  if (!table) return {};

  const headerRows = table.querySelectorAll('thead tr');
  const disciplineNames = [...headerRows[0].children]
    .filter(cell => cell.colSpan === 5)
    .map(cell => cell.textContent.trim());
  const headers = [...headerRows[1].children].map(cell => cell.textContent.trim());
  const players = {};

  for (const row of table.querySelectorAll('tbody tr')) {
    const playerLink = row.querySelector('.player a');
    if (!playerLink) continue;

    const cells = [...row.children];
    const stats = {};
    disciplineNames.forEach((discipline, index) => {
      const start = 5 + index * 5;
      const disciplineStats = {};
      for (let offset = 0; offset < 4; offset++) {
        const statName = statNames[headers[start + offset]];
        if (statName) disciplineStats[statName] = parseNumber(cells[start + offset].textContent);
      }
      stats[discipline] = disciplineStats;
    });

    const playerId = playerLink.href.split('/').at(-1);
    players[playerId] = {
      playerId,
      name: playerLink.textContent.trim(),
      url: normalizeUrl(playerLink.getAttribute('href')),
      mvp: cells[3].textContent.trim(),
      stats
    };
  }

  return players;
}