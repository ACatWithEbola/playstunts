export interface OriginalRacePresentationHost {
 memory():Uint8Array;
 clip(left:number,right:number,top:number,bottom:number):void;
 cockpit(mode:1|2,framePointer:number):void;
 replay(mode:1|4,first:number,last:number):void;
 world(buffer:number,rectangle:number):void;
 combineRectangles(first:number,second:number,destination:number):void;
 andDefault(offset:number,segment:number):void;orDefault(offset:number,segment:number):void;
 present(rectangle:number):void;
 selectBackBuffer():void;swapScreen():void;selectFrontBuffer():void;
}
/** Original13D1A..13F05 after viewport preparation. Preserves original layer,
 * redraw, replay-control and alternate-buffer order. */
export function drawOriginalRacePresentation(host:OriginalRacePresentationHost,d:number,bp:number,address:(mcga:number)=>number=n=>n){
 const u=(n:number)=>n&65535,byte=(at:number)=>host.memory()[d+u(at)],put=(at:number,n:number)=>{host.memory()[d+u(at)]=n&255;};
 const word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+u(at),true);};
 const set=(at:number,n:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+u(at),u(n),true);};
 const clear=()=>put(address(0x8ff2)+(byte(address(0x897c))<<24>>24),0),cockpit=()=>byte(bp-2)!==0,clipCockpit=()=>host.clip(0,320,word(address(0x9ac0)),word(address(0x9fe6)));
 if(byte(address(0x9ab6))){
  clear();if(cockpit()){clipCockpit();host.cockpit(1,u(bp-0x20));}
  if(byte(address(0xaae6))){host.clip(0,320,0,200);host.replay(1,word(address(0x8c26)),word(address(0x8c26)));}
 }else if(!byte(address(0xaae6)))clear();
 host.world(byte(address(0x8998))<<24>>24,address(0x7fe6));
 if(word(address(0xa7d2))&&cockpit()){
  set(bp-12,0);set(bp-10,320);set(bp-8,word(address(0xa7d2)));set(bp-6,word(address(0x9ac0)));
  if(word(address(0x73d6)))host.combineRectangles(word(address(0x73d6)),u(bp-12),word(address(0x73d6)));
  host.andDefault(word(address(0x9ab2)),word(address(0x9ab4)));host.orDefault(word(address(0x9aae)),word(address(0x9ab0)));
 }
 host.present(address(0x7fe6));
 if(byte(address(0x9ab6))&&!byte(address(0xaa46)))host.replay(4,0,0);
 if(cockpit()){clipCockpit();host.cockpit(2,u(bp-0x20));host.clip(0,320,0,200);}
 if(byte(address(0x9ab6)))put(address(0x9ab6),byte(address(0x9ab6))-1);
 if(byte(address(0xaa46))){host.selectBackBuffer();host.swapScreen();put(address(0x8998),byte(address(0x8998))^1);put(address(0x897c),byte(address(0x8998)));host.selectFrontBuffer();}
}
