import {drawOriginalFont} from './font-raster.ts';
import {drawOriginalMenuButton} from './menu-button-raster.ts';
export const originalOpponentMenuBounds=Array.from({length:5},(_,i)=>({left:20+i*56,right:76+i*56,top:177,bottom:197}));
/** Source 2635a, indexed sprite with stored origin and index255 transparency. */
export function drawOriginalIndexedMenuArt(target:Uint8Array,bytes:ReadonlyArray<number>){
 const word=(offset:number)=>bytes[offset]|bytes[offset+1]<<8,width=word(0),height=word(2),x=word(8),y=word(10);
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){const color=bytes[16+row*width+col];if(color!==255)target[((y+row)*320+x+col)&65535]=color;}
}
/** Source 51bb..5462, normal VGA framebuffer. Supplied art is unchanged. */
export function drawOriginalOpponentMenu(target:Uint8Array,font:Uint8Array,smallFont:Uint8Array,art:Record<string,ReadonlyArray<number>>,misc:Record<string,ReadonlyArray<number>>,description:ReadonlyArray<number>,opponent:number){
 target.fill(0,0,64000);drawOriginalIndexedMenuArt(target,art.scrn);
 for(const [i,name] of ['ebla','ebnx','ebcl','ebca','ebdo'].entries())drawOriginalMenuButton(target,font,misc[name],21+i*56,178,54,18,15,8,7,0);
 drawOriginalIndexedMenuArt(target,art['opp'+opponent]);drawOriginalIndexedMenuArt(target,art.clip);
 const rows=Array.from({length:256},(_,i)=>(i*320)&65535);let line:number[]=[],y=33;
 for(const code of description){if(code===0)break;if(code===93){if(line.length)drawOriginalFont(target,smallFont,String.fromCharCode(...line),12,y,0,rows);line=[];y+=8;}else line.push(code);}
 return originalOpponentMenuBounds;
}
