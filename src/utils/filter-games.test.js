import test from 'node:test';
import assert from 'node:assert/strict';

import { getTrackedLeagueOptions, getTeamOptions, getGroupedTeamOptions, getSelectedTeamDateRange, applySettingsFilters } from './filter-games.js';
import { normalizeSubMatch } from './normalize-sub-match.js';
import { extractDataFromHTML } from './extract-match-details-from-html.js';
import { JSDOM } from 'jsdom';

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

test('normalizes waiting participant objects with empty names to strings', () => {
  const normalized = normalizeSubMatch({
    matchId: 1,
    parentId: 2,
    playerA: { playerId: 0, name: '' },
    playerB: { playerId: 0, name: '' },
  });

  assert.equal(normalized.playerA, '');
  assert.equal(normalized.playerB, '');
});

test('normalizes both players in live doubles matches', () => {
  const normalized = normalizeSubMatch({
    matchId: 1,
    parentId: 2,
    playerA: { name: 'Player A1' },
    doublesA: { name: 'Player A2' },
    playerB: { name: 'Player B1' },
    doublesB: { name: 'Player B2' },
  });

  assert.equal(normalized.playerA, 'Player A1 / Player A2');
  assert.equal(normalized.playerB, 'Player B1 / Player B2');
});

test('keeps both player names when parsing doubles matches', () => {
  const html = `
    <table>
      <tr class="finished"><td><span class="raceTo">7</span></td></tr>
      <tr id="match-3" data-discipline="2">
        <td class="playerA"><span class="name">Player A1</span><span class="name">Player A2</span><span class="runouts">0</span></td>
        <td class="playerB"><span class="name">Player B1</span><span class="name">Player B2</span><span class="runouts">0</span></td>
        <td class="scoreA"><input value="7" /></td><td class="scoreB"><input value="5" /></td>
      </tr>
    </table>`;
  const [match] = extractDataFromHTML(new JSDOM(html).window.document);

  assert.equal(match.playerA, 'Player A1 / Player A2');
  assert.equal(match.playerB, 'Player B1 / Player B2');
});
