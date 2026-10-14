import assert from 'node:assert/strict';
import {test} from 'node:test';
import {drawOriginalDialog} from '../lib/game/dialog-raster.ts';
import {editNativePath} from '../lib/game/native-path-entry.ts';
import {editNativeSaveName} from '../lib/game/native-save-name.ts';
import {enterNativeHighScore} from '../lib/game/native-high-score-runtime.ts';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
import {measureOriginalFont} from '../lib/game/font-raster.ts';
import {originalKeyboardScanWord} from '../lib/game/keyboard-scan-word.ts';
import {isChaseToggle} from '../lib/game/chase-shortcut.ts';

// A minimal proportional font with the original resource's cyan foreground.
// Every non-space glyph has an 8x8 vertical stroke, making pixel checks exact.
function fixture(inputKeys=[65,0,13]){
 const font=new Uint8Array(4096),view=new DataView(font.buffer),pixels=new Uint8Array(65536);
 view.setUint16(0,3,true);view.setUint16(2,6,true);view.setUint16(14,8,true);view.setUint16(18,8,true);font[20]=1;
 for(let code=32;code<127;code++){
  const at=600+(code-32)*9;view.setUint16(22+code*2,at,true);font[at]=8;font.fill(code===32?0:128,at+1,at+9);
 }
 const keys=inputKeys.slice(),snapshots:Uint8Array[]=[];
 let clock=0,field:{x:number;y:number}|undefined;
 const host={pixels,font,present(){},counters(){return {input:0,game:0};},async keyboard(){clock+=20;return {key:keys.shift()??13,input:clock,game:clock/5};},
  async editPath(path:string,length:number,timeout:number,position:{x:number;y:number}){
   field=position;
   return editNativePath({...host,present(){snapshots.push(pixels.slice());}},path,length,timeout,position);
  }};
 return {host,font,view,pixels,snapshots,field:()=>field!};
}
function checkWhiteEntry(f:ReturnType<typeof fixture>){
 assert.equal(f.view.getUint16(0,true),15,'dialog retains white foreground in the font');
 assert.equal(f.view.getUint16(2,true),0,'dialog retains black background in the font');
 const {x,y}=f.field();
 assert.ok(f.snapshots.length>=4,'initial, typed, cursor-blink and completed entry were drawn');
 for(const pixels of f.snapshots.slice(1)){
  assert.equal(pixels[y*320+x],15,'typed glyph remains white through cursor blink and completion');
  assert.equal(pixels[y*320+x+1],0,'glyph background is black');
  for(let row=y;row<y+8;row++)for(let column=x;column<x+8;column++)assert.ok([0,15].includes(pixels[row*320+column]),'field and XOR cursor use only black and white');
 }
}
const resource=(text:string)=>Array.from(text+'\0',c=>c.charCodeAt(0));

await test('plain v/V reaches native replay-name editing and Escape cancels',async()=>{
 for(const shiftKey of [false,true]){
  const event={code:'KeyV',ctrlKey:false,metaKey:false,altKey:false,shiftKey,repeat:false};
  assert.equal(isChaseToggle(event),false);
  const key=originalKeyboardScanWord(47,scan=>shiftKey&&scan===42);
  assert.equal(key,shiftKey?86:118);
  const f=fixture([key,0,27]),state={name:'OLD',path:'C:\\'};
  const result=await editNativeSaveName({...f.host,resources:{esav:resource('Save @]Path:]@                 ]Name:]@]')}},state,'Replay');
  assert.equal(result,null,'Escape must not request a save');
  assert.equal(state.name,shiftKey?'V':'v');
  assert.equal(state.path,'C:\\');
 }
});

await test('saving a track keeps typed text and blinking cursor white',async()=>{
 const f=fixture(),state={name:'OLD',path:''};
 const result=await editNativeSaveName({...f.host,resources:{esav:resource('Save @]Path:]@                 ]Name:]@]')}},state,'Track');
 assert.deepEqual(result,{name:'A',path:''});checkWhiteEntry(f);
});

await test('entering a high-score name keeps typed text and blinking cursor white',async()=>{
 const f=fixture(),file=new Uint8Array(364);file.fill(255);
 const state={file,order:[0,1,2,3,4,5,6],selected:0,name:'OLD',retainedRecord:Array(52).fill(0)};
 let saved:Uint8Array|undefined;
 const result=await enterNativeHighScore({...f.host,async release(){},drawTable(){},async save(bytes){saved=bytes;}},state,{time:100,classification:0,carName:'COUN',opponentSelected:0,opponentCode:'',opponentCarCode:''},resource("You've got a high score!]Please input your name.]@]"),4);
 assert.equal(result,true);assert.equal(state.name,'A');assert.equal(saved?.[0],65);checkWhiteEntry(f);
});

await test('dialog retains the final original selection colors instead of forcing all fonts white',()=>{
 const f=fixture();
 drawOriginalDialog(f.pixels,f.font,resource('Choose][One][Two]'),1,{text:15,border:4,disabled:1});
 assert.equal(f.view.getUint16(0,true),0);assert.equal(f.view.getUint16(2,true),15);
 drawOriginalDialog(f.pixels,f.font,resource('Choose][One][Two]'),0,{text:15,border:4,disabled:1},[0,1]);
 assert.equal(f.view.getUint16(0,true),1);assert.equal(f.view.getUint16(2,true),0);
});

await test('MS91 high-score name entry uses versioned dialog field geometry',async()=>{
 const f=fixture(),message=resource('High score]}Please input your name]@]');
 const expected=originalDialogContent(message,line=>measureOriginalFont(f.font,line),-1,-1,3,'ms-1991');
 const legacy=originalDialogContent(message,line=>measureOriginalFont(f.font,line),-1,-1,3,'ms-1990');
 assert.notDeepEqual(expected.fields[0],legacy.fields[0]);
 const file=new Uint8Array(364).fill(255),state={file,order:[0,1,2,3,4,5,6],selected:0,name:'OLD',retainedRecord:Array(52).fill(0)};
 assert.equal(await enterNativeHighScore({...f.host,async release(){},drawTable(){},async save(){}},state,
  {time:100,classification:0,carName:'INDY',opponentSelected:0,opponentCode:'',opponentCarCode:'',physicsEngine:'ms-1991',framesPerSecond:20},message,4),true);
 assert.deepEqual(f.field(),{x:expected.fields[0].x,y:expected.fields[0].y});checkWhiteEntry(f);
});
