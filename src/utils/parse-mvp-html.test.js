import test from 'node:test';
import assert from 'node:assert/strict';
import jsdom from 'jsdom';

import {parseMvpHTML} from './parse-mvp-html.js';

test('parses MVP percentages and per-discipline stats', () => {
  const dom = new jsdom.JSDOM(`
    <table class="mvp">
      <thead>
        <tr><th></th><th></th><th colspan="2"></th><th colspan="5">8-Ball</th><th colspan="5">Straightpool</th></tr>
        <tr><td>#</td><td class="player">Name</td><td></td><td>MVP</td><td></td><td>MP</td><td>MW</td><td>FW</td><td>FL</td><td></td><td>MP</td><td>MW</td><td>PW</td><td>PL</td><td></td></tr>
      </thead>
      <tbody><tr>
        <td>1</td><td class="player"><div class="name"><a href="//cuescore.com/player/A/123">Player A</a></div></td><td></td><td>87.5%</td><td></td>
        <td>2</td><td>1</td><td>7</td><td>5</td><td></td><td>1</td><td>1</td><td>8</td><td>3</td><td></td>
      </tr></tbody>
    </table>`).window.document;

  assert.deepEqual(parseMvpHTML(dom), [{
      playerId: '123',
      name: 'Player A',
      url: 'https://cuescore.com/player/A/123',
      mvp: '87.5%',
      stats: {
        '8-Ball': {matchesPlayed: 2, matchesWon: 1, framesWon: 7, framesLost: 5},
        Straightpool: {matchesPlayed: 1, matchesWon: 1, pointsWon: 8, pointsLost: 3}
      }
    }]);
});