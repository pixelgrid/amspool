export function normalizeSubMatch(match) {
  const scoreA = String(match.scoreA ?? '');
  const scoreB = String(match.scoreB ?? '');
  const status = match.matchstatus || match.status || '';
  const winner = match.winner ?? (
    status === 'finished'
      ? Number(match.scoreA) > Number(match.scoreB) ? 1 : Number(match.scoreB) > Number(match.scoreA) ? 2 : 0
      : 0
  );

  return {
    discipline: match.disciplineId ?? match.discipline ?? '',
    raceTo: String(match.raceTo ?? ''),
    status,
    playerA: match.playerA?.name ?? match.playerA ?? '',
    playerB: match.playerB?.name ?? match.playerB ?? '',
    scoreA,
    scoreB,
    runoutsA: String(match.runoutsA ?? ''),
    runoutsB: String(match.runoutsB ?? ''),
    winner,
    matchId: String(match.matchId),
    parentId: String(match.parentId ?? '')
  };
}

export function teamFileName(teamName) {
  return encodeURIComponent(teamName.trim().toLowerCase().replace(/\s+/g, '-'));
}