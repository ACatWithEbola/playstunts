import type {EditorCursorImage} from './editor-cursor-render.ts';
/** Original terrain-page cursor preparation 0x1cb24..0x1cbb0. */
export function editorTerrainCursorArt(tile:number,color:number,names:string[],images:Record<string,EditorCursorImage>){
 const source=images[names[tile]];if(!source||source.width!==16||source.height!==16)throw Error('Missing original 16x16 terrain cursor artwork');
 const pixels=Uint8Array.from(source.pixels);
 for(let x=1;x<=15;x++){pixels[x]=color;pixels[14*16+x]=color;}
 for(let y=0;y<=14;y++){pixels[y*16+1]=color;pixels[y*16+15]=color;}
 return {width:16,height:16,pixels};
}
