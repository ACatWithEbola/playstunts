import {writeFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
// Own8086 boot diagnostic. PIT delta includes timestamp overhead, not pure BIOS time.
const target=process.argv[2];if(!target||!isAbsolute(target))throw Error('Supply fresh absolute image path');
const baseline=process.argv.includes('--baseline');
const backToBack=process.argv.includes('--back-to-back');
const restoreGap=process.argv.includes('--restore-gap');
if(restoreGap&&!backToBack)throw Error('Restore gap requires back-to-back mode');
if(baseline&&backToBack)throw Error('Separate baseline/back-to-back modes');
const code=[],labels=new Map(),fixups=[];
const emit=(...v)=>code.push(...v),word=v=>emit(v&255,v>>>8&255);
const label=n=>{if(labels.has(n))throw Error('Duplicate label');labels.set(n,code.length);};
const addr=n=>{fixups.push({at:code.length,n,kind:'absolute'});word(0);};
const call=n=>{emit(0xe8);fixups.push({at:code.length,n,kind:'relative16'});word(0);};
const branch=(op,n)=>{emit(op);fixups.push({at:code.length,n,kind:'relative8'});emit(0);};
emit(0xea);addr('start');word(0);label('start');
emit(0xfa,0x31,0xc0,0x8e,0xd8,0x8e,0xc0,0x8e,0xd0,0xbc);word(0x7c00);
// INT15 hook in scratch guest RAM only. No chained calls needed for this probe.
emit(0xc7,0x06);word(0x54);addr('irq');emit(0xc7,0x06);word(0x56);word(0);
call('ticks');emit(0x89,0xde); // SI=start PIT
if(restoreGap){
 // Save the upcoming full request exactly in the original voice-update order.
 emit(0xbb);addr('buffer');emit(0xb9);word(4);emit(0xba);word(4095);emit(0xb8);word(0x8307);
 emit(0x9c,0x06,0x50,0x53,0x51,0x52);
}
emit(0xbb);addr('buffer');emit(0xb9);word(1);emit(0xba);word(1);emit(0xb8);word(0x8300);if(!baseline)emit(0xcd,0x1a);
if(restoreGap){
 // Exact eight original instructions through secondINT1A. No output/timestamp
 // or flag capture inserted inside this interval. Flags below refer to second.
 emit(0x5a,0x59,0x5b,0x58,0x07,0x9d,0xb4,0x83,0xcd,0x1a);
}
emit(0x9c,0x5d);
if(backToBack&&!restoreGap){emit(0xbb);addr('buffer');emit(0xb9);word(4);emit(0xba);word(4095);emit(0xb8);word(0x8307);emit(0xcd,0x1a,0x9c,0x58,0x2e,0xa3);addr('secondFlags');}
if(restoreGap){emit(0x89,0xe8,0x2e,0xa3);addr('secondFlags');}
call('ticks');emit(0x29,0xde,0x8b,0x16);addr('count');emit(0x52,0x89,0xf2);call('hex');
emit(0x89,0xea);call('hex'); // ReturnedFLAGS inclIF/carry
emit(0x5a);call('hex'); // Count captured before printing, after timestamp read
emit(0xfb,0xb9);word(0xffff);label('wait');emit(0xe2);fixups.push({at:code.length,n:'wait',kind:'relative8'});emit(0);
emit(0x8b,0x16);addr('count');call('hex');
emit(0xb4,0x81,0xcd,0x1a,0x9c,0x5a);call('hex');
emit(0x8b,0x16);addr('interruptedCs');call('hex');emit(0x8b,0x16);addr('interruptedIp');call('hex');
emit(0x8b,0x16);addr('secondFlags');call('hex');
label('halt');emit(0xfa,0xf4);branch(0xeb,'halt');
label('ticks');emit(0x31,0xc0,0xe6,0x43,0xe4,0x40,0x88,0xc3,0xe4,0x40,0x88,0xc7,0xc3);
label('hex');emit(0x50,0x53,0x51,0xb9);word(4);label('digit');
emit(0xd1,0xc2,0xd1,0xc2,0xd1,0xc2,0xd1,0xc2,0x89,0xd0,0x24,0x0f,0x04,0x30,0x3c,0x39);branch(0x76,'print');emit(0x04,7);
label('print');emit(0xb4,0x0e,0xbb);word(7);emit(0x52,0xcd,0x10,0x5a);branch(0xe2,'digit');
emit(0xb8);word(0x0e20);emit(0xcd,0x10,0x59,0x5b,0x58,0xc3);
label('irq');emit(0x3d);word(0x91fb);branch(0x75,'irqDone');emit(0x2e,0xff,0x06);addr('count');
emit(0x2e,0x83,0x3e);addr('count');emit(1);branch(0x75,'irqDone');
// Hashed SL/2 IRQ prologue saves6 words before INT15's3-word frame.
// After our PUSH BP, original hardware-interrupted IP/CS are BP+20/+22.
// This diagnostic is ROM-specific, not a generic INT15 stack convention.
emit(0x55,0x89,0xe5,0x50,0x8b,0x46,20,0x2e,0xa3);addr('interruptedIp');
emit(0x8b,0x46,22,0x2e,0xa3);addr('interruptedCs');emit(0x58,0x5d);
label('irqDone');emit(0xcf);
label('count');word(0);label('interruptedCs');word(0);label('interruptedIp');word(0);label('secondFlags');word(0);label('buffer');emit(128,128,128,128);
for(const f of fixups){const dest=labels.get(f.n);if(dest===undefined)throw Error('Missing label');const value=f.kind==='absolute'?dest+0x7c00:dest-f.at-(f.kind==='relative8'?1:2);if(f.kind==='relative8'){if(value< -128||value>127)throw Error('Branch range');code[f.at]=value&255;}else{code[f.at]=value&255;code[f.at+1]=value>>>8&255;}}
if(code.length>510)throw Error('Boot sector overflow');
const image=Buffer.alloc(360*1024);image.set(code);image[510]=0x55;image[511]=0xaa;
writeFileSync(target,image,{flag:'wx'});
console.log(`Own ${code.length}-byte8086 ${baseline?'baseline':restoreGap?'original-restore':'BIOS'} probe: PIT delta, ${restoreGap?'second-call':'first-call'} FLAGS, early/final counts, statusFLAGS, interrupted CS/IP, second-call FLAGS; SL/2-specific stack, no pure-cycle claim`);
