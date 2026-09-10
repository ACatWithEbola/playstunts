import {TRACK_DISPLAY_LAYOUTS,type OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {hillRenderSelection} from './hill-render-selection.ts';
import {suppressOriginalMultiTile} from './multitile-render-skip.ts';
export interface RenderTileSlots {skip:number[];east:number[];south:number[];terrain:number[];tile:number[];detail:number[]}
const signed=(n:number)=>n<<24>>24;
/** Supplied C47E..C743: reverse scan, slope substitution, filler resolution,
 * detail filtering and multi-tile suppression. Retained skipped slots survive.
 */
export function selectOriginalRenderTiles(memory:Uint8Array,d:number,heading:number,camera:readonly number[],car:readonly number[],threshold:number,before:RenderTileSlots,layout:OriginalTrackDisplayLayout=TRACK_DISPLAY_LAYOUTS.mcga):RenderTileSlots{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(offset:number)=>v.getUint16(d+(offset&65535),true),byte=(offset:number)=>memory[d+(offset&65535)];
 const table=word(0x872+((heading&1023)>>>7)*2),lookahead=Array.from({length:23},(_,i)=>[signed(byte(table+i*3)),signed(byte(table+i*3+1)),signed(byte(table+i*3+2))]);
 const out=Object.fromEntries(Object.entries(before).map(([k,value])=>{if(value.length!==23)throw Error('Invalid original render slots');return [k,[...value]];})) as unknown as RenderTileSlots;
 const readTile=(x:number,y:number,rows:number,pointer:number)=>memory[word(pointer+2)*16+((word(pointer)+word(rows+signed(y)*2)+signed(x))&65535)];
 for(let index=22;index>=0;index--){
  if(out.skip[index])continue;
  const [dx,dy,detail]=lookahead[index];
  let x=signed(dx+camera[0]),y=signed(dy+camera[1]);
  if(detail>signed(threshold)||x<0||x>29||y<0||y>29){out.skip[index]=2;continue;}
  let tile=readTile(x,y,layout.address(0xa350),layout.address(0x9356)),terrain=readTile(x,y,layout.address(0x89d4),layout.address(0x9ad0));
  ({tile,terrain}=hillRenderSelection(terrain,tile));
  if(tile>=253){
   if(tile===253||tile===255)x=signed(x-1);
   if(tile===253||tile===254)y=signed(y-1);
   tile=readTile(x,y,layout.address(0xa350),layout.address(0x9356));terrain=readTile(x,y,layout.address(0x89d4),layout.address(0x9ad0));
  }
  out.terrain[index]=terrain;out.detail[index]=detail&255;
  // Both coordinates must differ in this supplied build; reference C differs.
  if(tile&&byte(0x134)&&signed(byte(0x2024+tile*14))>=64&&x!==signed(car[0])&&y!==signed(car[1]))tile=0;
  out.east[index]=x&255;out.south[index]=y&255;out.tile[index]=tile;
  if(tile)out.skip=suppressOriginalMultiTile(lookahead,out.skip,index,signed(byte(0x2023+tile*14)),[x,y],camera);
 }
 return out;
}
