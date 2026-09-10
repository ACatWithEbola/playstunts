import {i16,intAtan2,intHypot,vecTransform,type Vector} from '../physics/math.ts';
import {rotateZXY} from '../physics/rotation.ts';
import {projectOriginalVector} from './project-original-vector.ts';
import {selectOriginalView} from './select-original-view.ts';
import {originalTrackOverviewSubmissions} from './track-overview-submissions.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import {MODEL_DISPLAY_LAYOUTS} from './model-display-layout.ts';
import {TRACK_DISPLAY_LAYOUTS} from './track-display-layout.ts';
export interface OriginalTrackOverviewDisplayHost {
 bounds(left:number,right:number,top:number,bottom:number):void;clearWindow(colour:number):void;
 bitmap(pointer:{offset:number;segment:number},position:{x:number;y:number}):void;
 primitives(scratch:{leftOffset:number;rightOffset:number}):void;
}
/** OriginalE7DC..E905 panorama and horizon pass using active-window clipping. */
export function drawOriginalTrackOverviewDisplayBackground(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalTrackOverviewDisplayHost){
 const layout=TRACK_DISPLAY_LAYOUTS[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>v.getUint16(d+(o&65535),true),signed=(o:number)=>v.getInt16(d+(o&65535),true),address=layout.address;
 const pitch=intAtan2(i16(signed(0x8fe)-signed(0x8f8)),intHypot(i16(signed(0x8fc)-signed(0x8f6)),i16(signed(0x900)-signed(0x8fa)))),point=vecTransform([signed(0x902),signed(0x904),signed(0x906)],rotateZXY(0,pitch,0,true)),horizon=Math.max(0,projectOriginalVector(point,[word(0x4b88),word(0x4b8a)],[word(0x4b8c),word(0x4b8e)])[1]);
 host.bounds(0,320,0,i16(horizon-signed(address(0x7fe4))));host.clearWindow(word(address(0x9be2)));host.bounds(0,320,0,100);
 for(const [field,x,height] of [[0xa398,0,0x9b30],[0xa39c,320,0x9b32]])host.bitmap({offset:word(address(field)),segment:word(address(field)+2)},{x,y:i16(horizon-signed(address(height)))});
 host.bounds(0,320,horizon,200);host.clearWindow(word(address(0x909e)));host.bounds(0,320,0,200);return {pitch,horizon};
}
/** Original overview tile sequence and per-tile native queue drain.
 * Track maps, model descriptors and panorama resources belong to the caller. */
export function drawOriginalTrackOverviewDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalTrackOverviewDisplayHost,scratch:{record:number;region:number;leftOffset:number;rightOffset:number}){
 const result=drawOriginalTrackOverviewDisplayBackground(memory,d,mode,host),layout=MODEL_DISPLAY_LAYOUTS[mode];selectOriginalView(memory,d,[0,result.pitch,0],[0,320,0,200],1,layout);
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 originalTrackOverviewSubmissions(memory,d,record=>{if(record){for(let i=0;i<record.length;i++)memory[d+((scratch.record+i)&65535)]=record[i];renderOriginalModelMemory(memory,d,scratch.record,cache,undefined,undefined,layout);}else host.primitives(scratch);},TRACK_DISPLAY_LAYOUTS[mode],scratch.region);return result;
}
