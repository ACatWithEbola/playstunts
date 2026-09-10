/** Roland DT1 writes use three seven-bit address bytes and a seven-bit checksum.
 * Unlike Munt overrides these edit device RAM, allowing the game to replace them. */
export function mt32PanelWrite(address:number[],data:number[]){
 if(address.length!==3||!data.length||[...address,...data].some(n=>!Number.isInteger(n)||n<0||n>127))throw Error('Invalid MT-32 parameter write');
 const payload=[...address,...data],checksum=(-payload.reduce((a,b)=>a+b,0))&127;
 return [0xf0,0x41,0x10,0x16,0x12,...payload,checksum,0xf7].map(value=>[0x330,value]);
}
export function mt32PanelMasterVolume(value:number){
 if(!Number.isInteger(value)||value<0||value>100)throw Error('Invalid MT-32 master volume');
 return mt32PanelWrite([0x10,0,0x16],[value]);
}
export function mt32PanelPartVolume(part:number,value:number){
 if(!Number.isInteger(part)||part<0||part>8||!Number.isInteger(value)||value<0||value>100)throw Error('Invalid MT-32 part volume');
 const offset=part*16+8;return mt32PanelWrite([3,offset>>7,offset&127],[value]);
}
/** Physical absolute dial pickup: no sudden jump when entering a parameter mode.
 * The caller supplies the sampled dial value already scaled to the parameter. */
export function mt32DialPickup(previous:number,next:number,target:number,engaged:boolean){
 const acquired=engaged||(previous<=target&&next>=target)||(previous>=target&&next<=target);
 return {engaged:acquired,value:acquired?next:target};
}

export function mt32PanelTimbre(part:number,group:number,number:number){
 if(!Number.isInteger(part)||part<0||part>7||!Number.isInteger(group)||group<0||group>2||!Number.isInteger(number)||number<0||number>63)throw Error('Invalid MT-32 timbre');
 const offset=part*16;return mt32PanelWrite([3,offset>>7,offset&127],[group,number]);
}
/** MASTER+PART5, then PART1: channels 1–8; rhythm remains unchanged. */
export function mt32PanelChannelsOneToEight(){return mt32PanelWrite([0x10,0,13],[0,1,2,3,4,5,6,7]);}
/** MASTER+RHYTHM: PART1 resets all; PART2–5 retain patches/rhythm setup. */
export function mt32PanelReset(retain?:{patches:Uint8Array;rhythm:Uint8Array}){
 const writes=mt32PanelWrite([0x7f,0,0],[0]);
 if(retain){
  if(retain.patches.length!==1024||retain.rhythm.length!==340)throw Error('Invalid MT-32 retained reset memory');
  for(const [base,data] of [[5*16384,retain.patches]] as const){
   for(let offset=0;offset<data.length;offset+=128){const address=base+offset;writes.push(...mt32PanelWrite([address>>14,(address>>7)&127,address&127],[...data.subarray(offset,offset+128)]));}
  }
  // ROM 1.07 initializes rhythm reverb bytes to 2 although incoming DT1
  // accepts only 0/1. Reset already restores those 2s; rewriting clamps them.
  for(let offset=0;offset<340;offset+=4){const address=3*16384+144+offset;const length=retain.rhythm[offset+3]===2?3:4;writes.push(...mt32PanelWrite([address>>14,(address>>7)&127,address&127],[...retain.rhythm.subarray(offset,offset+length)]));}
 }
 return writes;
}
/** ROM1.07 table57D5, consumed at6A4F..6A9C: mode=bits7..6,
 * time=bits2..0, level=bits5..3. Physical selector has eleven positions. */
export const mt32PanelReverbTable=[0x00,0x02,0x0b,0x14,0x1c,0x1d,0x25,0x2d,0x35,0x3d,0x3e] as const;
export function mt32PanelReverb(index:number){
 if(!Number.isInteger(index)||index<0||index>10)throw Error('Invalid MT-32 panel reverb');
 const packed=mt32PanelReverbTable[index];return mt32PanelWrite([0x10,0,1],[packed>>6,packed&7,(packed>>3)&7]);
}

/** ROM1.07 display lookup66C8 and decimal formatter6B52; value64=440.0Hz; power-on74=442.0Hz. */
export const mt32PanelTuneTenths=[4275, 4276, 4278, 4280, 4282, 4284, 4286, 4288, 4290, 4292, 4294, 4296, 4297, 4299, 4301, 4303, 4305, 4307, 4309, 4311, 4313, 4315, 4317, 4319, 4321, 4323, 4325, 4327, 4329, 4331, 4333, 4334, 4336, 4338, 4340, 4342, 4344, 4346, 4348, 4350, 4352, 4354, 4356, 4358, 4360, 4362, 4364, 4366, 4368, 4370, 4372, 4374, 4376, 4378, 4380, 4382, 4384, 4386, 4388, 4390, 4392, 4394, 4396, 4398, 4400, 4402, 4404, 4406, 4408, 4410, 4412, 4414, 4416, 4418, 4420, 4422, 4424, 4426, 4428, 4430, 4432, 4434, 4436, 4438, 4440, 4442, 4444, 4446, 4448, 4450, 4452, 4454, 4456, 4458, 4460, 4462, 4464, 4466, 4468, 4470, 4472, 4474, 4476, 4478, 4480, 4482, 4484, 4486, 4488, 4490, 4492, 4494, 4496, 4498, 4500, 4502, 4504, 4506, 4508, 4510, 4512, 4514, 4516, 4518, 4520, 4522, 4524, 4526] as const;
export function mt32PanelTune(value:number){
 if(!Number.isInteger(value)||value<0||value>127)throw Error('Invalid MT-32 tuning');
 return mt32PanelWrite([0x10,0,0],[value]);
}
/** ROM12F1 lookup, read after raw dial >>1 at697D/69BB. */
export function mt32PanelVolumeFromDial(raw:number){
 if(!Number.isInteger(raw)||raw<0||raw>255)throw Error('Invalid MT-32 dial');
 return Math.floor((raw>>1)*100/127);
}
/** ROM6971..6A0C: two-count noise rejection and downward volume pickup. */
export function mt32PanelVolumeStep(lastRaw:number,nextRaw:number,target:number,engaged:boolean){
 const value=mt32PanelVolumeFromDial(nextRaw);
 if(!mt32PanelDialMoved(lastRaw,nextRaw))return {lastRaw,engaged,value:target,write:false};
 const acquired=engaged||value<=target;
 return {lastRaw:nextRaw,engaged:acquired,value:acquired?value:target,write:acquired};
}
/** ROM6D47/6D89: SUBB noise rejection wraps at eight bits. */
export function mt32PanelDialMoved(previous:number,next:number){
 for(const raw of [previous,next])if(!Number.isInteger(raw)||raw<0||raw>255)throw Error('Invalid MT-32 dial');
 const delta=(next-previous)&255;return delta!==0&&delta!==1&&delta!==255;
}
/** ROM6D62 divides by15, then caps the group at16. */
export function mt32PanelGroupFromDial(raw:number){
 mt32PanelVolumeFromDial(raw);return Math.min(16,Math.floor(raw/15));
}
/** ROM70B0: each14-byte group record contains the last sound index at+12. */
export const mt32PanelGroupSizes=[8,8,8,4,4,8,8,11,5,8,6,10,9,8,7,10,6,1,1] as const;
/** ROM6DA4 divides by23 regardless of the group's size, then clamps. */
export function mt32PanelSoundFromDial(raw:number,group:number){
 mt32PanelVolumeFromDial(raw);
 if(!Number.isInteger(group)||group<0||group>=mt32PanelGroupSizes.length)throw Error('Invalid MT-32 sound group');
 return Math.min(mt32PanelGroupSizes[group]-1,Math.floor(raw/23));
}
/** ROM6D47..6DCD retains a sound index per part. A group change resets that
 * index; moving within the same index does not reapply a timbre. */
export function mt32PanelSelectionStep(mode:'group'|'sound',lastRaw:number,nextRaw:number,group:number,sound:number){
 if(!Number.isInteger(group)||group<0||group>18||!Number.isInteger(sound)||sound<0||sound>10)throw Error('Invalid MT-32 panel selection');
 if(!mt32PanelDialMoved(lastRaw,nextRaw))return {lastRaw,group,sound,write:false};
 if(mode==='group'){
  if(Math.floor(nextRaw/15)===group)return {lastRaw:nextRaw,group,sound,write:false};
  return {lastRaw:nextRaw,group:mt32PanelGroupFromDial(nextRaw),sound:0,write:true};
 }
 const next=mt32PanelSoundFromDial(nextRaw,group);
 return {lastRaw:nextRaw,group,sound:next,write:next!==sound};
}

/** ROM70B0 group records. Memory/Rhythm have a null pointer and last index0;
 * selecting their sole index reads hardwired register0, choosing preset0. */
export function mt32PanelSelectionTimbre(group:number,sound:number){
 if(!Number.isInteger(group)||group<0||group>18||!Number.isInteger(sound)||sound<0||sound>=mt32PanelGroupSizes[group])throw Error('Invalid MT-32 sound index');
 const first=[0,8,16,24,28,32,40,48,59,64,72,78,88,97,105,112,122,0,0][group],number=first+sound;
 return {bank:number>>6,number:number&63};
}
