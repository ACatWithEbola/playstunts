import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeDisplayCommonState} from '../lib/game/native-display-common-state.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {enterNativeDisplayHighScore} from '../lib/game/native-display-high-score-entry.ts';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
import {measureOriginalFont} from '../lib/game/font-raster.ts';
import {originalPackedDisplayPixels} from '../lib/game/packed-display-pixels.ts';
const packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));
let cases=0;
for(const mode of ['cga','tandy','ega'] as const)for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const owner=await createNativeDisplayCommonState(mode,decodeNativeInitialDisplayData(packet.modes[mode]),fixtureData.catalog);
 const word=(at:number)=>owner.memory()[owner.d+at]|owner.memory()[owner.d+at+1]<<8;
 const fontAt=word(0x4dd2)*16,font=owner.memory().subarray(fontAt,fontAt+65536);
 const message=Array.from(new TextEncoder().encode('High score]}Please input your name]@]\0'));
 const expected=originalDialogContent(message,line=>measureOriginalFont(font,line),-1,-1,3,physicsEngine);
 const pixels=()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode);
 const backdrop=pixels().slice();let entered=false,saved:Uint8Array|undefined;
 const result=await enterNativeDisplayHighScore(owner,{drawTable(){},present(){},async release(){},async save(bytes){saved=bytes.slice();},async editPath(path,length,timeout,field){
  entered=true;assert.deepEqual(field,{x:expected.fields[0].x,y:expected.fields[0].y});
  assert.notDeepEqual(pixels(),backdrop,'Actual allocator-backed drawing must change the image');
  return {path:'MARCO',key:27};
 }},{file:new Uint8Array(364).fill(255),order:[0,1,2,3,4,5,6],selected:255,name:'OLD',retainedRecord:Array(52).fill(0)},
 {time:650,physicsEngine,framesPerSecond:10,classification:0,carName:'INDY',opponentSelected:0,opponentCode:'',opponentCarCode:''},message,4);
 assert.equal(result,true);assert.ok(entered&&saved);
 assert.equal(saved[50]|saved[51]<<8,physicsEngine==='ms-1991'?1300:650);
 assert.deepEqual(pixels(),backdrop,'Dismissal restores actual display backdrop');cases++;
}
console.log(JSON.stringify({allocatedDisplayCases:cases,allThreeDisplaysAndBothEngines:true,actualHeapAndDrawing:true,fieldRoutingAndCadenceMatch:true,backgroundRestored:true,onlyMemoryScoreWrites:true,pass:true}));
