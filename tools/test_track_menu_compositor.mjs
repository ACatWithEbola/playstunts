import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../lib/game/browser-native-menus.ts',import.meta.url),'utf8');
test('track path entry redraws through the overview compositor',()=>{
 assert.match(source,/menuHost\.editPath=.*present:presentTrack/);
});
test('all overview backgrounds are retained and loaded before entering the selector',()=>{
 assert.match(source,/enhancedOverviewsPromise=Promise\.all\(enhancedTrackOverviews\.map\(loadEnhancedStaticArtwork\)\)/);
 assert.match(source,/enhancedOverviews=await enhancedOverviewsPromise/);
 assert.doesNotMatch(source.slice(source.indexOf('const selectTrack=async')),/image\.src=source/);
});
