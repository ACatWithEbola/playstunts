import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {versionedPcMusicSeed} from '../lib/game/versioned-pc-music-seed.ts';
// Independent original executable initialization captures. This checks the
// adapter's retained driver and appended initialization commands, not a full
// original game music-loader capture or physical speaker output.
const rows=JSON.parse(readFileSync(process.argv[2],'utf8')).results;
assert.equal(rows.length,2);const row=rows[1];assert.equal(row.channels,7);
const expected=Array.from(Buffer.from(row.after,'base64').subarray(0,0x2e9));
for(const score of ['titl','slct','vict','over']){
 const seed=JSON.parse(readFileSync(`public/game/pc-music-${score}-seed.json`,'utf8'));
 const snapshot=structuredClone(seed),actual=versionedPcMusicSeed(seed,'ms-1991');
 assert.deepEqual(actual.driver,expected,`${score}: complete retained original initialized driver`);
 assert.deepEqual(actual.initialWrites.slice(seed.initialWrites.length),row.virtualPortWrites.map(([port,,value]:number[])=>[port,value]),`${score}: original initialization port order`);
 for(const key of ['bank','voices','timers','lastNotes','percussion','header'])assert.deepEqual(actual[key as keyof typeof actual],seed[key],`${score}: score seed field ${key}`);
 assert.deepEqual(actual.hardware.slice(0,5),seed.hardware);
 assert.deepEqual(seed,snapshot,'Source capture remains unchanged');
}
console.log('Four PC music adapters match independently captured original MS1991 driver initialization bytes and port order; score seeds unchanged');
