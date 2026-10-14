import {writeFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
// Own small DOS diagnostic, not original game/firmware code. Emits a flat COM
// executable to a fresh scratch directory; writes TRACE.BIN inside that mount.
const target=process.argv[2];if(!target||!isAbsolute(target))throw Error('Supply absolute fresh probe COM output path');
const crossBoundary=process.argv.includes('--cross-boundary');
const repeat=process.argv.includes('--repeat');
const backToBack=process.argv.includes('--back-to-back');
if(backToBack&&(crossBoundary||repeat))throw Error('Back-to-back probe requires separate flat, nonrepeat profile');
const firstVolume=Number(process.argv.find(value=>value.startsWith('--first-volume='))?.split('=')[1]??0);
const firstDivisor=Number(process.argv.find(value=>value.startsWith('--first-divisor='))?.split('=')[1]??1);
if(!Number.isInteger(firstVolume)||firstVolume<0||firstVolume>7||!Number.isInteger(firstDivisor)||firstDivisor<1||firstDivisor>4095)throw Error('Invalid first-playback probe profile');
const code=[],labels=new Map(),fixups=[];
const emit=(...bytes)=>code.push(...bytes),word=value=>emit(value&255,value>>>8&255);
const label=name=>{if(labels.has(name))throw Error('Duplicate label');labels.set(name,code.length);};
const absolute=name=>{fixups.push({at:code.length,name,relative:false});word(0);};
const short=(opcode,name)=>{emit(opcode);fixups.push({at:code.length,name,relative:true});emit(0);};
const mov=(register,value)=>{emit(0xb8+register);typeof value==='string'?absolute(value):word(value);};
const int=number=>emit(0xcd,number);
const storeAx=name=>{emit(0xa3);absolute(name);};
const carry=name=>{emit(0x9c,0x58,0x25);word(1);storeAx(name);};
emit(0x0e,0x1f);mov(0,0x3515);int(0x21);
emit(0x89,0x1e);absolute('old');emit(0x8c,0x06);absolute('oldSegment');
mov(2,'handler');mov(0,0x2515);int(0x21);
if(crossBoundary){
 // Shrink COM allocation, reserve128KiB, select four bytes straddling the
 // first strictly following physical64KiB boundary inside that reservation.
 emit(0x0e,0x07);mov(3,0x1000);emit(0xb4,0x4a);int(0x21);short(0x73,'resized');mov(0,0x4c01);int(0x21);label('resized');
 mov(3,0x2000);emit(0xb4,0x48);int(0x21);short(0x73,'allocated');mov(0,0x4c02);int(0x21);label('allocated');
 emit(0x05);word(0x1000);emit(0x25);word(0xf000);emit(0x48,0x8e,0xc0);mov(3,14);
 for(let i=0;i<4;i++)emit(0x26,0xc6,0x47,i,[0,128,255,64][i]);
}else{emit(0x0e,0x07);mov(3,'buffer');}
emit(0x8c,0x06);absolute('repeatSegment');emit(0x89,0x1e);absolute('repeatOffset');
emit(0xfa);mov(0,backToBack?0x8300|firstVolume:0x8307);mov(1,backToBack?1:4);mov(2,backToBack?firstDivisor:4095);int(0x1a);carry('playCarry');
if(!backToBack){mov(1,60000);mov(2,0x3da);label('maskedPoll');emit(0xec);short(0xe2,'maskedPoll');}
emit(0xa1);absolute('count');storeAx('beforeStatus');
if(backToBack){emit(0x2e,0xa1);absolute('repeatSegment');emit(0x8e,0xc0,0x2e,0x8b,0x1e);absolute('repeatOffset');mov(0,0x8307);mov(1,4);mov(2,4095);}else emit(0xb4,0x81);
int(0x1a);carry('busyCarry');emit(0xa1);absolute('count');storeAx('beforeIrq');
emit(0xfb);mov(1,60000);mov(2,0x3da);label('enabledPoll');emit(0xec);short(0xe2,'enabledPoll');
emit(0xa1);absolute('count');storeAx('afterIrq');
// Restore the original vector before DOS file output.
emit(0x1e,0xc5,0x16);absolute('old');mov(0,0x2515);int(0x21);emit(0x1f);
mov(2,'filename');mov(1,0);mov(0,0x3c00);int(0x21);short(0x72,'exit');
emit(0x89,0xc3);mov(2,'playCarry');mov(1,10);emit(0xb4,0x40);int(0x21);emit(0xb4,0x3e);int(0x21);
label('exit');mov(0,0x4c00);int(0x21);
label('handler');emit(0x3d);word(0x91fb);short(0x75,'chain');emit(0x2e,0xff,0x06);absolute('count');
if(repeat){
 // Preserve interrupted registers; restart once inside first AX91FB callout.
 emit(0x2e,0x83,0x3e);absolute('count');emit(1);short(0x75,'handlerDone');
 // Individual saves work on8086; PUSHA/POPA require80186 and are invalid
 // for the authentic SL/2 machine. SP itself is restored by balanced saves.
 emit(0x50,0x51,0x52,0x53,0x55,0x56,0x57,0x06,0x2e,0xa1);absolute('repeatSegment');emit(0x8e,0xc0,0x2e,0x8b,0x1e);absolute('repeatOffset');
 mov(0,0x8307);mov(1,4);mov(2,4095);int(0x1a);emit(0x07,0x5f,0x5e,0x5d,0x5b,0x5a,0x59,0x58);
}
label('handlerDone');emit(0xcf);
label('chain');emit(0x2e,0xff,0x2e);absolute('old');
for(const name of ['playCarry','beforeStatus','busyCarry','beforeIrq','afterIrq','old','oldSegment','count','repeatSegment','repeatOffset']){label(name);word(0);}
label('filename');emit(...Buffer.from('TRACE.BIN\0'));label('buffer');emit(0,128,255,64);
for(const fix of fixups){const destination=labels.get(fix.name);if(destination===undefined)throw Error('Unknown label');if(fix.relative){const offset=destination-fix.at-1;if(offset< -128||offset>127)throw Error('Short jump out of range');code[fix.at]=offset&255;}else{const address=destination+0x100;code[fix.at]=address&255;code[fix.at+1]=address>>>8;}}
writeFileSync(target,Uint8Array.from(code),{flag:'wx'});
console.log(`Generated own ${code.length}-byte ${backToBack?'back-to-back silent/full playback':crossBoundary?'64KiB-boundary':'flat-buffer'}${repeat?' repeated':''} BIOS/DMA interrupt-order probe. TRACE.BIN = five little-endian words: playback carry, completion count before second call, second-call carry, count after second call, count after STI.`);
