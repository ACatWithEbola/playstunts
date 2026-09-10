export interface OriginalPcSpeakerSampleResult {writes:number[][];restoreVector?:{offset:number;segment:number};chainVector?:{offset:number;segment:number};}
/** PC15:0683 restores the original timer and IRQ0 vector. It retains speaker
 * gate bits and resets only the sample-active byte, as the source does. */
export function restoreOriginalPcSpeakerSampleTimer(driver:Uint8Array):OriginalPcSpeakerSampleResult {
 const word=(at:number)=>driver[at]|driver[at+1]<<8,writes:number[][]=[];
 if(driver[0x1a8])writes.push([0x21,driver[0x2dd]]);
 const offset=word(0x2d3),segment=word(0x2d5),restoreVector=offset||segment?{offset,segment}:undefined;if(restoreVector)driver.fill(0,0x2d3,0x2d7);
 writes.push([0x43,0x36],[0x40,driver[0x2d7]],[0x40,driver[0x2d8]],[0x43,0xb6]);driver[0x1a8]=0;return {writes,...(restoreVector?{restoreVector}:{})};
}
/** PC15:06DC..076B sample IRQ. The fractional source cursor advances before
 * fetching a byte; loop restart produces an IRQ without a sample write.
 * XLAT carries a CS prefix (2E D7), regardless of the interrupted DS. */
export function stepOriginalPcSpeakerSample(driver:Uint8Array,port61:number,read:(offset:number,segment:number)=>number):OriginalPcSpeakerSampleResult {
 const word=(at:number)=>driver[at]|driver[at+1]<<8,put=(at:number,value:number)=>{driver[at]=value&255;driver[at+1]=(value>>8)&255;},writes:number[][]=[[0x21,0xfc]];
 const fraction=word(0x1cc)+word(0x1c8),offset=(word(0x1ce)+word(0x1ca)+(fraction>65535?1:0))&65535;put(0x1cc,fraction);put(0x1ce,offset);
 if(offset<word(0x1c6)){
  const sample=read(offset,word(0x1d0))&255;writes.push([0x42,driver[0x1d3+sample]],[0x42,0],[0x61,port61&254],[0x61,(port61&254)|1]);
  const counter=(word(0x2db)-1)&65535;put(0x2db,counter);if(!counter){put(0x2db,word(0x2d9));return {writes,chainVector:{offset:word(0x2d3),segment:word(0x2d5)}};}
 }else{
  put(0x1ce,word(0x1c2));put(0x1cc,0);
  if(driver[0x1d2]){driver[0x1d2]--;if(!driver[0x1d2]){const restored=restoreOriginalPcSpeakerSampleTimer(driver);writes.push(...restored.writes,[0x20,0x20]);return {writes,...(restored.restoreVector?{restoreVector:restored.restoreVector}:{})};}}
 }
 writes.push([0x20,0x20]);return {writes};
}
export interface OriginalPcSpeakerSampleStart {driverSegment:number;port61:number;interruptMask:number;irqVector:{offset:number;segment:number};sample:{offset:number;segment:number;length:number};rate:number;repeats:number;}
/** PC15:076C sample startup. The source fixes IRQ rate at17000Hz, steps the
 * sample pointer in16.16, and preserves its end-offset-zero early return. */
export function beginOriginalPcSpeakerSample(driver:Uint8Array,options:OriginalPcSpeakerSampleStart):OriginalPcSpeakerSampleResult&{installVector?:{offset:number;segment:number}}{
 const word=(at:number)=>driver[at]|driver[at+1]<<8,put=(at:number,value:number)=>{driver[at]=value&255;driver[at+1]=(value>>8)&255;},writes:number[][]=[];
 let vector={...options.irqVector},mask=options.interruptMask,restoreVector:OriginalPcSpeakerSampleResult['restoreVector'];
 if(driver[0x1a8]){const restored=restoreOriginalPcSpeakerSampleTimer(driver);writes.push(...restored.writes);restoreVector=restored.restoreVector;if(restoreVector)vector=restoreVector;for(const [port,value] of restored.writes)if(port===0x21)mask=value;}
 driver[0x1a8]=255;writes.push([0x43,0xb2],[0x61,(options.port61|3)&255]);driver[0x1d2]=options.repeats&255;
 const start=(options.sample.offset+50)&65535,end=(start+(options.sample.length&65535))&65535;put(0x1c2,start);put(0x1c4,options.sample.segment);put(0x1ce,start);put(0x1d0,options.sample.segment);put(0x1cc,0);put(0x1c6,end);
 if(!end)return {writes,...(restoreVector?{restoreVector}:{})};
 put(0x2d3,vector.offset);put(0x2d5,vector.segment);const divisor=Math.floor(1193180/17000),counter=Math.floor(word(0x2d7)/divisor);put(0x2d9,counter);put(0x2db,counter);put(0x1ad,divisor);writes.push([0x43,0x36],[0x40,divisor&255],[0x40,divisor>>8]);
 const rate=options.rate&65535;put(0x1ca,Math.floor(rate/17000));put(0x1c8,Math.floor((rate%17000)*65536/17000));for(let i=0;i<256;i++)driver[0x1d3+i]=Math.floor(i*(divisor-5)/255)+5;
 driver[0x2dd]=mask&255;writes.push([0x21,0xfc]);return {writes,...(restoreVector?{restoreVector}:{}),installVector:{offset:0x6dc,segment:options.driverSegment}};
}
/** PC15:0335 logical slot0 uses its separate sample-rate table and starts one
 * repetition through076C. The caller resolves the patch's far sample pointer. */
export function startOriginalPcSpeakerSampleNote(driver:Uint8Array,voice:Uint8Array,note:number,options:Omit<OriginalPcSpeakerSampleStart,'rate'|'repeats'>){
 voice[3]=note&255;const at=0x12f+voice[3]*2,rate=driver[at]|driver[at+1]<<8;voice[4]=voice[6]=rate&255;voice[5]=voice[7]=rate>>8;return beginOriginalPcSpeakerSample(driver,{...options,rate,repeats:1});
}
