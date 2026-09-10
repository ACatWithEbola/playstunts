import type {OriginalSetupTextScreen} from './setup-text-screen.ts';
/** VGA mode 3 text cells using the bundled reference machine's 8x16 font.
 * The ninth column extends CP437 line graphics C0..DF, not ordinary letters.
 * Cursor scanlines are supplied after BIOS cursor-shape translation. */
export function renderOriginalSetupTextPixels(screen:OriginalSetupTextScreen,font:Uint8Array,options:{blinkVisible?:boolean;cursor?:{start:number;end:number;visible:boolean}}={}){
 if(font.length!==4096||screen.cells.length!==2000)throw Error('SETUP text presentation requires 256 sixteen-row glyphs and 80 by 25 cells');
 const pixels=new Uint8Array(720*400),blinkVisible=options.blinkVisible??true;
 for(let row=0;row<25;row++)for(let column=0;column<80;column++){
  const cell=screen.cells[row*80+column],glyph=cell&255,attribute=cell>>>8,foreground=attribute&15,background=(attribute>>>4)&7,visible=!(attribute&128)||blinkVisible;
  for(let y=0;y<16;y++){const bits=visible?font[glyph*16+y]:0,at=(row*16+y)*720+column*9;
   for(let x=0;x<8;x++)pixels[at+x]=bits&(128>>>x)?foreground:background;
   pixels[at+8]=glyph>=0xc0&&glyph<=0xdf&&bits&1?foreground:background;
  }
 }
 const cursor=options.cursor;
 if(cursor?.visible&&screen.row>=0&&screen.row<25&&screen.column>=0&&screen.column<80){const colour=(screen.cells[screen.row*80+screen.column]>>>8)&15;for(let y=Math.max(0,cursor.start);y<=Math.min(15,cursor.end);y++){const at=(screen.row*16+y)*720+screen.column*9;pixels.fill(colour,at,at+9);}}
 return pixels;
}
