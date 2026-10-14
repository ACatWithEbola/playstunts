/** Read-only actual-reference routing audit, not musical/listening approval. */
import {readFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
import {createMt32UnitRouter} from '../lib/game/mt32-unit-address.ts';
import {musicScoreLedger} from './music_score_ledger.mjs';
const directory=process.argv[2];if(!directory||!isAbsolute(directory))throw Error('Provide absolute captured reference directory');
for(const song of ['titl','slct','vict','over']){
 const path=join(directory,song+'-delivered-midi.json'),before=readFileSync(path),trace=JSON.parse(before);
 assert.equal(trace.generation,'ms-1991');assert.equal(trace.sampleRate,32000);assert.equal(trace.frames,1920000);
 const router=createMt32UnitRouter(16),routed=trace.events.flatMap(([frame,port,byte])=>port===0x330?router.write([byte]).map(value=>[frame,port,value]):[]);
 const raw=decodeDeliveredMidi(trace.events),actual=decodeDeliveredMidi(routed);
 assert.deepEqual(raw.messages,actual.messages,'Decoded channel-message completion frames differ from actual routing');
 assert.deepEqual(raw.realtime,actual.realtime);assert.equal(actual.partial,null);assert.equal(actual.interruptions.length,0);
 assert.ok(raw.interruptions.every(event=>event.kind==='unterminated-sysex'));
 assert.equal(raw.partial,null);
 const ledger=musicScoreLedger(actual.messages,trace.frames);
 assert.equal(readFileSync(path).equals(before),true,'Reference source changed');
 const controls={};
 for(const event of actual.messages)if((event.status&0xf0)===0xb0&&event.frame>=0){const channel=event.status&15,key=channel+':'+event.data[0];controls[key]=(controls[key]??0)+1;}
 console.log(JSON.stringify({song,sourceSha256:createHash('sha256').update(before).digest('hex'),ledgerSha256:createHash('sha256').update(JSON.stringify(ledger)).digest('hex'),channelLedger:ledger.channels.filter(channel=>channel.events.length).map(({events,...counts})=>({...counts,eventCount:events.length})),routedMessages:actual.messages.length,rawAbortedSysEx:raw.interruptions.length,realtimeReports:actual.realtime.length,controlCounts:controls,routingPass:true,intendedNotesOrAudioApproved:false}));
}
