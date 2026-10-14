import assert from 'node:assert/strict';
import {createNativeMs91RepaintHost,presentMs91Repaint} from '../lib/game/ms91-repaint-presentation.ts';
import {createOriginalPackedDisplayDrawingHost} from '../lib/game/packed-display-drawing-host.ts';
import {createMs91RepaintState} from '../lib/game/ms91-repaint-state.ts';
import type {Ms91Rectangle} from '../lib/game/ms91-rectangle-list.ts';
for(const mode of ['cga','tandy'] as const){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),c=0x209e0,width=mode==='cga'?80:160,descriptor=c+0x3000;
 // Detached linear packed surface and explicit row table. This checks real
 // driver clipping/copy, not the DOS interleaved screen initialization.
 v.setUint16(descriptor+2,0x5000,true);v.setUint16(descriptor+10,0x1000,true);
 v.setUint16(descriptor+14,width,true);v.setUint16(descriptor+18,200,true);
 for(let y=0;y<200;y++)v.setUint16(c+0x1000+y*2,y*width,true);
 const source=0x60000;v.setUint16(source,width,true);v.setUint16(source+2,200,true);memory.fill(0xab,source+16,source+16+width*200);
 const drawing=createOriginalPackedDisplayDrawingHost(()=>memory,0x2d1a0,mode),full:Ms91Rectangle=[8,16,2,4],empty:Ms91Rectangle=[320,0,200,0],state=createMs91RepaintState(full,empty),regions=Array.from({length:15},()=>[...empty] as Ms91Rectangle);
 regions[0]=full;const host=createNativeMs91RepaintHost(drawing,{offset:0x3000,segment:0x209e},{offset:0,segment:0x6000},{beginCopy(){},endCopy(){}});
 presentMs91Repaint(state.prepare(regions,full,0,{enabled:true,fullRedraw:false,pageFlipping:false,detail:0,alignment:mode==='cga'?4:2}),host);
 const shift=mode==='cga'?2:1;
 for(let y=0;y<200;y++)for(let x=0;x<width;x++)assert.equal(memory[0x50000+y*width+x],y>=2&&y<4&&x>=(8>>shift)&&x<(16>>shift)?0xab:0,`${mode} ${x},${y}`);
}
console.log('Native MS91 presentation adapter copies only planned regions through real CGA and Tandy packed bitmap drivers');
