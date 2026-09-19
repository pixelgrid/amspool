import test from 'node:test';
import assert from 'node:assert/strict';

import { getTrackedLeagueOptions, getTeamOptions, getGroupedTeamOptions, getSelectedTeamDateRange, applySettingsFilters } from './filter-games.js';

test('tracked leagues and team names are statically extracted', () => {
  const leagues = getTrackedLeagueOptions();
  const teams = getTeamOptions();

  assert.ok(leagues.length > 0);
  assert.ok(leagues.every(item => item.id && item.name));
  assert.equal(teams[0], 'All teams');
  assert.ok(teams.length > 1);
});

test('team lists are grouped by league and exclude venue names', () => {
  const grouped = getGroupedTeamOptions();

  assert.ok(grouped.length > 0);
  assert.ok(grouped.every(group => group.leagueName && Array.isArray(group.teams)));
  assert.ok(grouped.every(group => group.teams.every(team => team === team.trim() && team !== '')));
  assert.ok(grouped.every(group => group.teams.every((team, index, arr) => index === 0 || arr[index - 1].localeCompare(team) <= 0)));

  const venueFiltered = getGroupedTeamOptions().find(group => group.id === 83574874);
  const hasVenueName = venueFiltered.teams.includes('Sport Pub Goes');

  assert.equal(hasVenueName, false);
});

test('team-specific windows include previous matches and continue to the end of the league', () => {
  const [rangeStart, rangeEnd] = getSelectedTeamDateRange('Noord Boven t IJ 26/27');

  assert.ok(rangeStart <= new Date());
  assert.ok(rangeEnd >= rangeStart);
});

test('settings filter keeps only selected team and enabled leagues', () => {
  const matches = [
    ['2026-09-17', [
      [
        { matchId: 1, playerA: 'Alpha', playerB: 'Beta', tournamentId: 101, tournamentName: 'League One' },
        { matchId: 2, playerA: 'Gamma', playerB: 'Delta', tournamentId: 202, tournamentName: 'League Two' },
      ],
      [
        { matchId: 3, playerA: 'Alpha', playerB: 'Epsilon', tournamentId: 101, tournamentName: 'League One' },
      ]
    ]]
  ];

  const filtered = applySettingsFilters(matches, {
    selectedTeam: 'Alpha',
    enabledLeagueIds: [101],
  });

  assert.deepEqual(filtered[0][1].map(league => league.map(match => match.matchId)).flat(), [1, 3]);
});
