import eredivisie from '../../league_data/generated/83574874_generated.js'

import eerste_divisie from '../../league_data/generated/83574886_generated.js'
import tweede_divisie from '../../league_data/generated/83574889_generated.js'
import derde_divisie from '../../league_data/generated/83574898_generated.js'

import eerste_klasse from '../../league_data/generated/83574424_generated.js'
import tweede_klasse from '../../league_data/generated/83574427_generated.js'
import derde_klasse from '../../league_data/generated/83574403_generated.js'

const trackedLeagues = [
  { id: 83574874, name: 'Pool Eredivisie 2026/2027', matches: eredivisie },
  { id: 83574886, name: 'Eerste Divisie', matches: eerste_divisie },
  { id: 83574889, name: 'Tweede Divisie', matches: tweede_divisie },
  { id: 83574898, name: 'Derde Divisie', matches: derde_divisie },
  { id: 83574424, name: 'Eerste Klasse', matches: eerste_klasse },
  { id: 83574427, name: 'Tweede Klasse', matches: tweede_klasse },
  { id: 83574403, name: 'Derde Klasse', matches: derde_klasse },
];

export function getTrackedLeagueOptions() {
  return trackedLeagues.map(({ id, name }) => ({ id, name }));
}

export function getGroupedTeamOptions() {
  const venueNames = new Set();

  for (const { matches } of trackedLeagues) {
    for (const match of matches) {
      const venueName = match.venueData?.venueName?.trim();
      if (venueName) {
        venueNames.add(venueName);
      }
    }
  }

  return trackedLeagues
    .map(({ id, name, matches }) => {
      const names = new Set();

      for (const match of matches) {
        const addTeam = (teamName) => {
          const cleanedName = typeof teamName === 'string' ? teamName.trim() : '';

          if (!cleanedName || venueNames.has(cleanedName)) {
            return;
          }

          names.add(cleanedName);
        };

        addTeam(match.playerA);
        addTeam(match.playerB);
      }

      const teams = Array.from(names).sort((a, b) => a.localeCompare(b));
      return { id, leagueName: name, teams };
    })
    .filter(({ teams }) => teams.length > 0);
}

export function getTeamOptions() {
  return ['All teams', ...getGroupedTeamOptions().flatMap(({ teams }) => teams)];
}

export function getSelectedTeamDateRange(selectedTeam = 'All teams') {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  if (selectedTeam === 'All teams') {
    startDate.setDate(startDate.getDate() - 1);
    endDate.setDate(endDate.getDate() + 6);
    return [startDate, endDate];
  }

  let earliestMatchDate = null;
  let latestMatchDate = null;

  for (const { matches } of trackedLeagues) {
    for (const match of matches) {
      const startTime = match.startTime ? new Date(match.startTime) : null;
      if (!startTime) continue;
      const isSelectedTeamMatch = match.playerA === selectedTeam || match.playerB === selectedTeam;
      if (!isSelectedTeamMatch) continue;
      if (!earliestMatchDate || startTime < earliestMatchDate) {
        earliestMatchDate = startTime;
      }
      if (startTime >= today && (!latestMatchDate || startTime > latestMatchDate)) {
        latestMatchDate = startTime;
      }
    }
  }

  if (earliestMatchDate) {
    startDate.setTime(earliestMatchDate.getTime());
  }
  if (latestMatchDate) {
    endDate.setTime(latestMatchDate.getTime());
  }

  return [startDate, endDate];
}

export function applySettingsFilters(matches = [], settings = {}) {
  const selectedTeam = settings.selectedTeam || 'All teams';
  const enabledLeagueIds = settings.enabledLeagueIds?.length
    ? settings.enabledLeagueIds
    : getTrackedLeagueOptions().map(({ id }) => id);

  return matches
    .map(([date, leagueGroups]) => {
      const filteredGroups = leagueGroups
        .map((leagueMatches) => leagueMatches.filter((match) => {
          const leagueId = match.tournamentId;

          if (!leagueId || !enabledLeagueIds.includes(leagueId)) {
            return false;
          }

          if (selectedTeam === 'All teams') {
            return true;
          }

          return match.playerA === selectedTeam || match.playerB === selectedTeam;
        }))
        .filter((leagueMatches) => leagueMatches.length > 0);

      return [date, filteredGroups];
    })
    .filter(([, leagueGroups]) => leagueGroups.length > 0);
}

export function find_games_for_date(date){
  const todayDt = new Date();
  const targetDate = new Date(date).toISOString().split('T')[0]
  const results = [];
  for(let league of trackedLeagues){
    let league_games = [];
    for(let match of league.matches){
      const startTimeDt = new Date(match.startTime);
      const startTime = startTimeDt.toISOString().split('T')[0]
      if(startTimeDt <= todayDt)
        match.shouldFetch = true;
      if (startTime === targetDate) {
        league_games.push(match);
      }
    }
    if(league_games.length > 0)
      results.push(league_games)
  }
  return [targetDate, results]
}

