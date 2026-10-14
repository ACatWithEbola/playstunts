import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createOriginalTandyDacClock} from '../lib/game/tandy-dac-clock.ts';
import {createOriginalTandyDacTransfer} from '../lib/game/tandy-dac-transfer.ts';

// Execute unmodified callback bodies from a pinned GPL-2.0 86Box source in a
// scratch-only component harness. No third-party code enters the shipped app.
// DMA/PIC/timer stubs expose component behavior, not BIOS or CPU execution.
const url='https://raw.githubusercontent.com/86Box/86Box/2cbc44b2a59a9e871e4bc5aaff1c4eb492576dda/src/sound/snd_pssj.c';
const response=await fetch(url);assert.ok(response.ok);const source=await response.text();
assert.equal(createHash('sha256').update(source).digest('hex'),'fe3c5dab27cfeed398cb81fd50274630f9611ac2da0d184354fb665bb9fb7820');
function body(name){
 const marker=new RegExp(`static void\\s+${name}\\s*\\(`).exec(source);assert.ok(marker,`Missing ${name}`);
 const start=marker.index,open=source.indexOf('{',start);let depth=1,end=open+1;
 for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;else if(source[end]==='}')depth--;}
 assert.equal(depth,0);return source.slice(start,end);
}
const scratch=mkdtempSync(join(tmpdir(),'playstunts-pssj-high-rate-'));
const harness=`#include <stdint.h>
#include <stdio.h>
#define SOUNDBUFLEN 8
#define TIMER_USEC 1000000ULL
#define DMA_NODATA -1
#define DMA_OVER 256
typedef struct {uint8_t ctrl,wave,dac_val;uint16_t freq;int amplitude,irq;uint64_t timer_count;int wave_pos,pulse_width;int16_t buffer[SOUNDBUFLEN];int pos;} pssj_t;
static int sound_pos_global=0,reads=0,irq_calls=0,available=1;
static int dma_channel_read(int channel){if(channel!=1)return DMA_NODATA;reads++;if(!available)return DMA_NODATA;available=0;return DMA_OVER|192;}
static int dma_channel_write(int channel,int value){(void)channel;(void)value;return DMA_NODATA;}
static void picint(int mask){if(mask==128)irq_calls++;}
static void timer_advance_u64(uint64_t *timer,uint64_t delta){*timer+=delta;}
${body('pssj_update_irq')}
${body('pssj_update')}
${body('pssj_callback')}
int main(void){
 for(int divisor=1;divisor<=4095;divisor+=4094)for(int amplitude=0;amplitude<=15;amplitude+=15)for(int enabled=0;enabled<=1;enabled++){
  pssj_t device={0};device.freq=divisor;device.amplitude=amplitude;device.ctrl=enabled?31:15;device.dac_val=128;
  reads=0;irq_calls=0;available=1;pssj_callback(&device);
  printf("%d %d %d %d %d %d %d %llu\\n",divisor,amplitude,enabled,reads,device.dac_val,device.irq,irq_calls,(unsigned long long)device.timer_count);
 }
 return 0;
}
`;
writeFileSync(join(scratch,'reference.c'),harness,{flag:'wx'});
const compiled=spawnSync('clang',['-std=c11','-Wall','-Wextra','-Werror',join(scratch,'reference.c'),'-o',join(scratch,'reference')],{encoding:'utf8'});
assert.equal(compiled.status,0,compiled.stderr);
const run=spawnSync(join(scratch,'reference'),[],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
const rows=run.stdout.trim().split('\n').map(line=>line.split(' ').map(Number));assert.equal(rows.length,8);
for(const [divisor,amplitude,enabled,reads,data,pending,irq,delay] of rows){
 assert.equal(reads,1);assert.equal(data,192);assert.equal(pending,1);assert.equal(irq,enabled);
 assert.equal(delay,Math.floor(1e12/3579545*divisor));
 const volume=amplitude===0?0:7,clock=createOriginalTandyDacClock(divisor,volume);
 let nativeReads=0;const transfer=createOriginalTandyDacTransfer(()=>{nativeReads++;return 192;});
 assert.equal(transfer.play({ax:0x8300|volume,es:0,bx:0,cx:1,dx:divisor}).carry,false);
 assert.deepEqual(clock.advanceClocks(divisor-1),[]);assert.equal(nativeReads,0);
 assert.deepEqual(clock.advanceClocks(1),[1]);const byte=transfer.transferByte();
 assert.equal(nativeReads,reads);assert.equal(byte.value,data);assert.equal(byte.completion,0x91fb);assert.equal(transfer.status().carry,false);
}
writeFileSync(join(scratch,'evidence.json'),JSON.stringify({url,sourceSha256:createHash('sha256').update(source).digest('hex'),scope:'unmodified PSSJ callback; stubbed DMA/PIC/timer, not BIOS/CPU timing',rows},null,2),{flag:'wx'});
console.log(`Pinned PSSJ callback/native chip-transfer comparison passes8 high/low-rate, muted/audible and IRQ-gate cases. Scratch evidence: ${scratch}`);
