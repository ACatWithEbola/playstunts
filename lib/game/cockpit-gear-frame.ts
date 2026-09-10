export interface CockpitGearFrameHost {
 memory():Uint8Array;
 selectWindow(offset:number,segment:number):void;
 selectBackBuffer():void;restoreVideoWindow():void;selectDirectScreen():void;
 clip(left:number,right:number,top:number,bottom:number):void;
 drawPacked(offset:number,segment:number,x:number,y:number):void;
 andAnchored(offset:number,segment:number,x:number,y:number):void;
 orAnchored(offset:number,segment:number,x:number,y:number):void;
 copyBitmap(offset:number,segment:number,x:number,y:number):void;
}
/** Original14D62..14ECE: per-buffer gearbox redraw and background restoration.
 * Cache bytes and word comparisons retain the original shift-animation quirk. */
export function updateOriginalCockpitGear(host:CockpitGearFrameHost,d:number,address:(mcga:number)=>number=n=>n){
 const u=(n:number)=>n&65535,byte=(at:number)=>host.memory()[d+u(at)],word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+u(at),true);};
 const set=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+u(at),value,true);};
 const index=()=>byte(address(0x897c))<<24>>24;
 const pointer=(at:number)=>[word(at),word(at+2)] as const;
 const shape=(at:number,field:number)=>{const [off,seg]=pointer(at),m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(seg*16+u(off+field),true);};
 const copyWindow=(at:number)=>host.copyBitmap(shape(at,0),shape(at,2),shape(address(0x547a),8),shape(address(0x547a),10));
 const clip=()=>host.clip(0,320,0,word(address(0x9fe6)));
 if((byte(address(0x8ceb))|byte(address(0x8cea)))===0&&byte(address(0x54b4)+index())!==0){
  if(!byte(address(0xaa46)))host.selectBackBuffer();clip();copyWindow(address(0x54b6));host.memory()[d+u(address(0x54b4)+index())]=0;return;
 }
 const i=index();
 if(byte(address(0x54b4)+i)===byte(address(0x8cea))&&word(address(0x542a)+i*2)===word(address(0x8c6c))&&word(address(0x542e)+i*2)===word(address(0x8c70))&&(!byte(address(0x8ceb))||byte(address(0x54b4)+i)!==0))return;
 host.selectWindow(...pointer(address(0x54a6)));host.memory()[d+u(address(0x54b4)+index())]=1;
 host.drawPacked(...pointer(address(0x547a)),0,0);
 const x=word(address(0x8c6c)),y=word(address(0x8c70)),buffer=index();set(address(0x542a)+buffer*2,x);set(address(0x542e)+buffer*2,y);
 host.andAnchored(...pointer(address(0x5492)),x,y);host.orAnchored(...pointer(address(0x548e)),x,y);
 if(byte(address(0xaa46)))host.selectDirectScreen();else{host.restoreVideoWindow();host.selectBackBuffer();}
 clip();copyWindow(address(0x54a6));
}
