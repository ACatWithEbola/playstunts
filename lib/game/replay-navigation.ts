/** Original15fb4..16020 arrow navigation. Tables and view limits belong
 * to retained executable data; selection7 routes vertical arrows to zoom. */
export function originalReplayNavigation(memory:Uint8Array,d:number,key:number){
 key&=65535;
 const selected=memory[d+0x31e9],s8=(n:number)=>n<<24>>24;
 let table:number;
 switch(key&65535){
  case 0x4b00:table=0x31ea;break;
  case 0x4d00:table=0x31f4;break;
  case 0x4800:if(selected===7)return 'zoom-in' as const;table=0x31fe;break;
  case 0x5000:if(selected===7)return 'zoom-out' as const;table=0x3208;break;
  default:return 'unhandled' as const;
 }
 const target=memory[d+((table+s8(selected))&65535)];
 if(key!==0x4b00||s8(memory[d+((0x3212+s8(memory[d+0x12f]))&65535)])>=s8(target))memory[d+0x31e9]=target;
 return 'redraw' as const;
}
