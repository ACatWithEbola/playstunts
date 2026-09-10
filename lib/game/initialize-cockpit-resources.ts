import {COCKPIT_DISPLAY_LAYOUTS} from './cockpit-display-layout.ts';
import {allocateOriginalDisplayWindow} from './allocate-display-window.ts';
import {initializeOriginalResourceList} from './initialize-resource-list.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {allocateOriginalSpriteWindow} from './allocate-sprite-window.ts';
type Pointer={offset:number;segment:number};
export interface NativeCockpitResourceHost {
 memory():Uint8Array;writeMemory(memory:Uint8Array):void;
 loadBank(kind:number,nameOffset:number):Promise<Pointer>;
 selectWindow(offset:number,segment:number):void;
 drawBitmap(offset:number,segment:number,x:number,y:number):void;
 restoreWindow():void;
}
/** Original14a60 mode0. Loads each car's two instrument banks, resolves the
 * original tables and allocates three windows before preparing the dashboard. */
export async function initializeNativeCockpitResources(host:NativeCockpitResourceHost,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const address=COCKPIT_DISPLAY_LAYOUTS[mode];
 const word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+at,true);};
 const put=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+at,value&65535,true);};
 const pointer=(at:number):Pointer=>({offset:word(at),segment:word(at+2)});
 const save=(at:number,p:Pointer)=>{put(at,p.offset);put(at+2,p.segment);};
 const shapeWord=(p:Pointer,at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(p.segment*16+((p.offset+at)&65535),true);};
 const lookup=(name:number,required=false)=>{const p=pointer(address(0x5436));return findOriginalResource(host.memory(),d,p.offset,p.segment,name,required);};
 for(let i=0;i<4;i++){host.memory()[d+0x3124+i]=host.memory()[d+address(0x8fc2)+i];host.memory()[d+0x312e+i]=host.memory()[d+address(0x8fc2)+i];}
 save(address(0x5436),await host.loadBank(3,0x3120));save(address(0x543e),await host.loadBank(2,0x312a));
 for(const [bank,names,table] of [[address(0x5436),0x3091,address(0x546a)],[address(0x543e),0x30b6,address(0x548e)],...(word(address(0xa594))===0?[[address(0x543e),0x30cf,address(0x5442)]]:[])]){
  const p=pointer(bank);initializeOriginalResourceList(host.memory(),d,p.offset,p.segment,names,table);
 }
 for(const [source,destination] of [[address(0x5476),address(0x543a)],[address(0x547a),address(0x54a6)],[address(0x547a),address(0x54b6)]]){
  const p=pointer(source),width=shapeWord(p,0)*word(address(0x90fa)),height=shapeWord(p,2),result=mode==='mcga'?allocateOriginalSpriteWindow(host.memory(),d,width,height):allocateOriginalDisplayWindow(host.memory(),d,mode,width,height);
  host.writeMemory(result.memory);if(result.error||!result.window)throw Error('Original cockpit window allocation failed: '+result.error);save(destination,result.window);
 }
 const dash=lookup(0x30f8,true)!,window=pointer(address(0x54b6));host.selectWindow(window.offset,window.segment);
 const gear=pointer(address(0x547a)),signed=(n:number)=>(n<<16)>>16;
 host.drawBitmap(dash.offset,dash.segment,signed(shapeWord(dash,8)-shapeWord(gear,8)),signed(shapeWord(dash,10)-shapeWord(gear,10)));
 host.restoreWindow();put(address(0xa3ca),shapeWord(dash,10));
 put(address(0xa7dc),lookup(0x30fd)?shapeWord(lookup(0x3102,true)!,2):0);
 const extension=lookup(0x3107);
 if(extension){put(address(0xa7d2),shapeWord(extension,10));save(address(0x9aae),extension);save(address(0x9ab2),lookup(0x310c,true)!);}
 else put(address(0xa7d2),0);
}
