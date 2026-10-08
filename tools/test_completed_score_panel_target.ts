import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('completed run prompt and focus target the game session, never the setup preview',()=>{
 const source=readFileSync(new URL('../app/GlobalScoreStatus.tsx',import.meta.url),'utf8');
 assert.match(source,/setTarget\(document\.querySelector\('\.launcher-game-session \.launcher-screen'\)\)/);
 assert.equal((source.match(/'\.launcher-game-session \.launcher-screen canvas'/g)||[]).length,2);
 assert.doesNotMatch(source,/querySelector(?:<[^>]+>)?\('\.launcher-screen(?: canvas)?'\)/);
 const game=readFileSync(new URL('../app/OpeningSequence.tsx',import.meta.url),'utf8');
 assert.match(game,/embedded\?"launcher-game-session"/);
 assert.doesNotMatch(source,/type="checkbox"|setConsent/,'The explicit submit button is the sole publishing choice');
 assert.match(source,/text="Submit score and replay"/);
 assert.doesNotMatch(source,/window\.location|router\.push|location\.assign/,'Submitting never navigates away from the game');
 const client=readFileSync(new URL('../lib/game/browser-global-scores.ts',import.meta.url),'utf8');
 assert.doesNotMatch(client,/window\.confirm/,'The submission panel is the only public-sharing prompt');
});
