import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const modern=process.argv[2];assert.ok(modern,'Provide the isolated MS91 distribution directory');
const rows=[];
for(const name of ['FONTDEF.FNT','FONTN.FNT','FONTLED.FNT']){
 const shipped=readFileSync(join('public/game/original-resources',name)),original=readFileSync(join(modern,name));
 assert.deepEqual(shipped,original,name+' supplied font matches originalMS91 bytes');
 const v=new DataView(shipped.buffer,shipped.byteOffset,shipped.byteLength),height=v.getUint16(14,true),proportional=!!shipped[20];
 const widths:number[]=[];
 for(let code=0;code<256;code++){
  const at=v.getUint16(22+code*2,true);if(!at)continue;
  assert.ok(at<shipped.length,name+' glyph pointer is inside file');
  const width=proportional?shipped[at]:v.getUint16(16,true);assert.ok(width>0,name+' has no present zero-width glyph: '+code);
  const stride=proportional?Math.ceil(width/8):v.getUint16(12,true);
  assert.ok(at+(proportional?1:0)+stride*height<=shipped.length,name+' complete glyph bitmap is inside file');widths.push(width);
 }
 rows.push({font:name,height,proportional,glyphs:widths.length,minimumWidth:Math.min(...widths),sha256:createHash('sha256').update(shipped).digest('hex')});
}
console.log(JSON.stringify({fonts:rows,noPresentZeroWidthGlyphs:true,allGlyphsBounded:true,suppliedFontsExactlyMatchMS91:true,pass:true}));
