import assert from 'node:assert/strict';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
import {createMt32UnitRouter} from '../lib/game/mt32-unit-address.ts';
const bytes=[0x92,45,0xf8,100,47,0,0x82,45,0,0xc2,7,0xb2,64,127,0xe2,0,64,0xf0,0x41,0x92,45,127,0xf7,0x92,50,80,0xf2,1,2,3,0x92,52];
const result=decodeDeliveredMidi(bytes.map((byte,index)=>[index-10,0x330,byte]));
assert.deepEqual(result.messages.map(m=>[m.frame,m.status,...m.data]),[
 [-7,0x92,45,100],[-5,0x92,47,0],[-2,0x82,45,0],[0,0xc2,7],[3,0xb2,64,127],[6,0xe2,0,64],[11,0x92,45,127],[15,0x92,50,80],[18,0xf2,1,2]
]);
assert.deepEqual(result.partial,{status:0x92,data:[52]});assert.equal(result.audibleOnsetsVerified,false);
assert.deepEqual(decodeDeliveredMidi([[0,0x331,0x92],[1,0x330,45],[2,0x330,80]]).messages,[]);
assert.throws(()=>decodeDeliveredMidi([[1,0x330,0x92],[0,0x330,45]]),/ordered/);
assert.throws(()=>decodeDeliveredMidi([[0,0x330,256]]),/ordered/);
const interrupted=decodeDeliveredMidi([[0,0x330,0x92],[1,0x330,45],[2,0x330,0x82],[3,0x330,45],[4,0x330,0]]);
assert.equal(interrupted.interruptions.length,1);assert.deepEqual(interrupted.messages,[{frame:4,status:0x82,data:[45,0]}]);
assert.deepEqual(decodeDeliveredMidi([[0,0x330,0x92]]).partial,{status:0x92,data:[]});
assert.deepEqual(decodeDeliveredMidi([[0,0x330,0xf0],[1,0x330,0x41]]).partial,{status:0xf0,data:[]});
assert.deepEqual(result.realtime,[{frame:-8,status:0xf8}]);
assert.equal(result.interruptions.length,1,'Illegal status aborts SysEx, as in bundled Munt parser');
const router=createMt32UnitRouter(16);
const routed=decodeDeliveredMidi(bytes.flatMap((byte,index)=>router.write([byte]).map(value=>[index-10,0x330,value])));
assert.deepEqual(routed.messages,result.messages);assert.deepEqual(routed.realtime,result.realtime);
assert.deepEqual(routed.partial,result.partial);assert.equal(routed.interruptions.length,0);
console.log('Diagnostic delivered MIDI retains exact completion frames, running status, releases/controllers/bends, realtime interleaving and incomplete boundaries; no audible onset claim');
