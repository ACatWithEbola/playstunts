import {originalEditorCleanupFrame} from './editor-caller-frame.ts';
import {slopeRoadMap} from '../physics/slope-road-map.ts';
/** Source 1e978..1ec15. Preserve scan order: claimed marker cells survive,
 * incomplete anchors and unclaimed marker cells are removed in place. */
export function repairOriginalEditorMarkers(input:number[],objects:{multiTile:number}[],retainedRowWord?:number,retainedClaimByte?:number){
 if(retainedRowWord!==undefined&&(!Number.isInteger(retainedRowWord)||retainedRowWord<0||retainedRowWord>7))throw Error('Retained editor row word must be within the verified zero-to-seven context');
 if(retainedClaimByte!==undefined&&(!Number.isInteger(retainedClaimByte)||retainedClaimByte<0||retainedClaimByte>255))throw Error('Retained editor claim must be a byte');
 const track=[...input],claimed=new Uint8Array(900);
 for(let row=0;row<30;row++)for(let col=0;col<30;col++){
  const index=(29-row)*30+col,tile=track[index];if(!tile)continue;
  if(tile>=253){if(!claimed[index])track[index]=0;continue;}
  const shape=objects[tile].multiTile;
  if(shape<1||shape>3)continue;
  // DS:A38C immediately follows the 30 row offsets. Normal polling28894
  // leaves this initialized word unchanged; explicit callers can supply it.
  const above=row===29&&retainedRowWord!==undefined?retainedRowWord+col:index-30;
  const cells=shape===1?[[above,254]]:shape===2?[[index+1,255]]:[[index+1,255],[above,254],[above+1,253]];
  // 1EB10..1EB98 rejects if any claim is nonzero or any marker is missing.
  // All claims are unsigned bytes, so their sum cannot wrap to zero. An
  // in-map failure decides the result even when another read is unknown.
  if(cells.some(([i,marker])=>i>=0&&i<900?(claimed[i]!==0||track[i]!==marker):i===900&&(track[i]!==marker||(retainedClaimByte!==undefined&&retainedClaimByte!==0)))){
   track[index]=0;continue;
  }
  // Right-edge horizontal indexing wraps into the next linear cell. At the
  // final cell, a255 horizon can still depend on the caller's retained BP;
  // top-edge vertical indexing reads the mutable row-table entry30.
  if((shape&1)&&row===29&&retainedRowWord===undefined||(shape&2)&&index===899)throw Error('Malformed edge anchor requires original adjacent row-table/stack memory');
  for(const [i] of cells)claimed[i]=1;
 }
 return track;
}
/** Source 1e7e0..1e977. The last encountered terrain error wins. Marker-only
 * repair does not set an error; a terrain removal triggers a second repair. */
export function cleanOriginalEditorTrack(input:number[],terrain:number[],objects:{multiTile:number}[],retainedRowWord?:number,mainFrameBP?:number){
 const retainedClaimByte=mainFrameBP===undefined?undefined:originalEditorCleanupFrame(mainFrameBP)&255;
 let track=repairOriginalEditorMarkers(input,objects,retainedRowWord,retainedClaimByte),error=0;
 for(let row=0;row<30;row++)for(let col=0;col<30;col++){
  const index=(29-row)*30+col,t=terrain[row*30+col];let tile=track[index];
  if(!tile||!t||t===6)continue;
  if(t>=1&&t<=5){
   if(tile===255)tile=track[index-1];else if(tile===254)tile=track[index+30];else if(tile===253)tile=track[index+29];
   if(!(tile>=34&&tile<=35||tile>=103&&tile<=108||tile>=171&&tile<=174)){track[index]=0;error=12;}
  }else if(t>=7&&t<=10){if(!slopeRoadMap(t,tile)){track[index]=0;error=13;}}
  else{track[index]=0;error=14;}
 }
 if(error)track=repairOriginalEditorMarkers(track,objects,retainedRowWord,retainedClaimByte);
 return {track,error};
}
