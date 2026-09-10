import {updateOriginalCockpitGear,type CockpitGearFrameHost} from './cockpit-gear-frame.ts';
import {cockpitWheel} from './cockpit-wheel.ts';
import {cockpitInstrumentMode} from './cockpit-instrument-mode.ts';
export interface CockpitFrameHost extends CockpitGearFrameHost {
 selectFrontBuffer():void;
 drawPackedDefault(offset:number,segment:number):void;
 drawPackedUnclipped(offset:number,segment:number,x:number,y:number):void;
 andDefault(offset:number,segment:number):void;orDefault(offset:number,segment:number):void;
 orClipped(offset:number,segment:number,x:number,y:number):void;
 line(x0:number,y0:number,x1:number,y1:number,color:number):void;
 saveBackground(offset:number,segment:number,x:number,y:number):void;
}
/** Original14a60 mode2: cockpit animation caches, gauges and steering marker.
 * The digital leading-zero byte is an original retained caller local. */
export function updateOriginalCockpitFrame(host:CockpitFrameHost,d:number,bp:number,address:(mcga:number)=>number=n=>n){
 updateOriginalCockpitGear(host,d,address);
 const u=(n:number)=>n&65535,byte=(at:number)=>host.memory()[d+u(at)],word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+u(at),true);};
 const set=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+u(at),u(value),true);};
 const put=(at:number,value:number)=>{host.memory()[d+u(at)]=value&255;},index=()=>byte(address(0x897c))<<24>>24,display=()=>byte(address(0x8998))<<24>>24;
 const pointer=(at:number)=>[word(at),word(at+2)] as const;
 const shape=(at:number,field:number)=>{const [off,seg]=pointer(at),m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(seg*16+u(off+field),true);};
 const clip=()=>host.clip(0,320,0,word(address(0x9fe6)));let markerErased=false;
 const eraseMarker=(mark:boolean)=>{const i=index();if(word(address(0x54b0)+i*2)){host.copyBitmap(...pointer(address(0x549e)+display()*4),word(address(0x54ac)+i*2),word(address(0x54b0)+i*2));set(address(0x54b0)+index()*2,0);if(mark)markerErased=true;}};
 const wheel=cockpitWheel(word(address(0x8c58)));let wheelChanged=false;
 if(byte(address(0x54aa)+index())!==wheel.frame||byte(address(0x9ab6))){
  if(!byte(address(0xaa46)))host.selectBackBuffer();eraseMarker(true);host.drawPackedDefault(...pointer(address(0x546a)+wheel.frame*4));put(address(0x54aa)+index(),wheel.frame);wheelChanged=true;
 }
 const gauges=cockpitInstrumentMode(word(address(0x8c62)),word(address(0x8c5a)),word(address(0xa594)),word(address(0xa596)),word(address(0xa66c)));
 if(wheelChanged||byte(address(0x9ab6))||word(address(0x5432)+index()*2)!==u(gauges.speedIndex)||word(address(0x5426)+index()*2)!==u(gauges.rpmIndex)){
  if(!byte(address(0xaa46)))host.selectBackBuffer();eraseMarker(true);host.selectWindow(...pointer(address(0x543a)));host.drawPackedUnclipped(...pointer(address(0x5476)),0,0);
  set(address(0x5432)+index()*2,gauges.speedIndex);set(address(0x5426)+index()*2,gauges.rpmIndex);
  const gaugeLine=(center:number,points:number,point:number)=>host.line(word(center),word(center+2),byte(points+point*2),byte(points+point*2+1),word(address(0x9372)));
  if(gauges.mode===1){
   let remaining=gauges.speedIndex,hundreds=0;if(remaining>=200){hundreds=2;remaining-=200;}else if(remaining>=100){hundreds=1;remaining-=100;}
   const digit=(value:number,point:number)=>host.orClipped(...pointer(address(0x5442)+value*4),byte(address(0xa598)+point*2),byte(address(0xa599)+point*2));
   if(hundreds){digit(hundreds,0);put(bp-0x1c,1);}
   const tens=Math.trunc(remaining/10);if(tens||byte(bp-0x1c)){digit(tens,1);remaining-=tens*10;put(bp-0x1c,1);}digit(remaining,2);
  }else if(gauges.mode===0)gaugeLine(address(0xa592),address(0xa598),gauges.speedIndex);
  gaugeLine(address(0xa668),address(0xa66e),gauges.rpmIndex);
  if(wheel.frame===0){host.andDefault(...pointer(address(0x5486)));host.orDefault(...pointer(address(0x547e)));}
  else if(wheel.frame===2){host.andDefault(...pointer(address(0x548a)));host.orDefault(...pointer(address(0x5482)));}
  if(byte(address(0xaa46)))host.selectDirectScreen();else host.restoreVideoWindow();clip();host.copyBitmap(shape(address(0x543a),0),shape(address(0x543a),2),shape(address(0x5476),8),shape(address(0x5476),10));
 }
 if(word(address(0x54ba)+index()*2)!==u(wheel.scaled)||byte(address(0x9ab6))||markerErased){
  if(!byte(address(0xaa46)))host.selectBackBuffer();clip();eraseMarker(false);
  const point=u(address(0xa554)+Math.abs(wheel.scaled)*2),y=byte(point+1);let x=byte(point);
  if(wheel.scaled<0)x=(x-((x-byte(address(0xa554)))*2))&255;
  const i=index(),left=u(x-shape(address(0x5496),4))&word(address(0x9ae8)),top=u(y-shape(address(0x5496),6));set(address(0x54ac)+i*2,left);set(address(0x54b0)+i*2,top);
  host.saveBackground(...pointer(address(0x549e)+display()*4),left,top);host.andAnchored(...pointer(address(0x549a)),x,y);host.orAnchored(...pointer(address(0x5496)),x,y);set(address(0x54ba)+index()*2,wheel.scaled);
 }
 host.selectFrontBuffer();
}
