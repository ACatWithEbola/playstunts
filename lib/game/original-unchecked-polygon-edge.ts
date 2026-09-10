import {rasterCockpitLine} from './cockpit-line-raster.ts';
/** Original optimized backward-edge updates, 23C6F..23E30. Once a side is
 * selected it stays selected; preserve the original partial-row tail writes.
 */
export function originalUncheckedPolygonEdge(record:Uint8Array,before:{left:number[];right:number[]}){
 const left=[...before.left],right=[...before.right],v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16,kind=record[18];let n=v.getInt16(14,true);
 if(n<=0)return {left,right};
 if(kind<=6){let side:'left'|'right'|undefined;for(const [x,y] of rasterCockpitLine(record)){if(!side){if(left[y]>x)side='left';else if(right[y]<x)side='right';}if(side)(side==='left'?left:right)[y]=x;}return {left,right};}
 let x=v.getInt16(2,true),f=v.getUint16(4,true)+32768,y=signed(v.getInt16(6,true)+(f>>>16));f&=65535;const step=v.getUint16(12,true);
 const advance=()=>{const sum=f+step;f=sum&65535;return sum>65535;};
 let state='search';
 if(kind===7){while(n>0){
  if(state==='search'){if(right[y]<x){state='right-write';continue;}if(advance()){if(left[y]>x){state='left-write';continue;}y++;}x=signed(x-1);n--;}
  else if(state==='right-write'){right[y++]=x;state='right-inner';}
  else if(state==='right-inner'){x=signed(x-1);const carry=advance();n--;if(carry)state='right-write';}
  else if(state==='left-write'){left[y++]=x;x=signed(x-1);n--;state='left-inner';}
  else{if(advance())state='left-write';else{x=signed(x-1);n--;if(!n)left[y]=signed(x+1);}}
 }}else if(kind===8){while(n>0){
  if(state==='search'){if(left[y]>x){state='left-write';continue;}if(advance()){if(right[y]<x){state='right-write';continue;}y++;}x=signed(x+1);n--;}
  else if(state==='left-write'){left[y++]=x;state='left-inner';}
  else if(state==='left-inner'){x=signed(x+1);n--;if(n&&advance())state='left-write';}
  else if(state==='right-write'){right[y]=x;state='right-inner';}
  else{x=signed(x+1);const carry=advance();n--;if(carry){y++;state='right-write';}if(!n){if(!carry)y++;right[y]=signed(x-1);}}
 }}else throw Error('Original polygon edge requires a non-horizontal line');
 return {left,right};
}
