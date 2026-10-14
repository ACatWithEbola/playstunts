import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,rows[0].engine==='ms-1990'?6:12);
for(const row of rows){
 const rate=row.rate as 10|20,engine=row.engine??'ms-1991',d=0x20000,memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),bank=0x80000+row.offset,inputs=0xa0000,slots=12000/(30*rate),size=engine==='ms-1990'?1072:1120,count=row.mode==='ordinary'?11999:12000;
 const put=(at:number,value:number)=>v.setUint16(d+at,value,true),get=(at:number)=>v.getUint16(d+at,true);
 for(let slot=0;slot<slots;slot++){for(let byte=0;byte<size;byte++)memory[bank+slot*size+byte]=(slot*17+byte*3)&255;v.setUint16(bank+slot*size+0x140,slot*30*rate,true);}
 memory.fill(0xa5,bank+slots*size,bank+slots*size+48);
 for(let i=0;i<12001;i++)memory[inputs+i]=(i*7)&255;
 for(const [at,value] of [[0xa030,row.offset],[0xa032,0x8000],[0x9c40,0],[0x9c42,0xa000],[0x73b2,count],[0x8fd8,count],[0x8c26,count],[0xa034,0]])put(at,value);
 memory[d+0xa34e]=Number(row.mode==='rollover');
 captureOriginalRaceInput(memory,d,0x39,rate,engine);
 const expected=Buffer.from(row.checkpoint,'hex'),actual=memory.subarray(bank,bank+slots*size+48),differences=[];
 for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i]&&differences.length<12)differences.push({offset:i,actual:actual[i],original:expected[i]});
 assert.equal(differences.length,0,'Checkpoint differences '+JSON.stringify({rate,offset:row.offset,mode:row.mode,differences}));
 const physical=Buffer.from(row.checkpointPhysicalSpan,'hex');
 assert.ok(physical.length>0,'Capture must cover wrapped writes before the linear arena');
 let firstPhysicalDifference=-1;
 for(let i=0;i<physical.length;i++)if(memory[0x80000+i]!==physical[i]){firstPhysicalDifference=i;break;}
 assert.equal(firstPhysicalDifference,-1,'Wrapped physical arena '+JSON.stringify([rate,row.offset,row.mode]));
 assert.equal(Buffer.from(memory.subarray(inputs,inputs+12001)).toString('hex'),row.inputs);
 for(const [at,key] of [[0x73b2,'count'],[0x8fd8,'length'],[0x8c26,'frame'],[0xa034,'adjustment']] as const)assert.equal(get(at),row[key]);
 assert.equal(memory[d+0xa34e],row.prompt);assert.equal(memory[d+0xaa77],row.paused);
}
console.log(JSON.stringify({originalCases:rows.length,completeBuffersMatch:true,farOffsetCarryCovered:true,pass:true}));
