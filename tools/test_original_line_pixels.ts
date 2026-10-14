import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {rasterOriginalLine} from '../lib/game/raster-original-line.ts';
import {rasterOriginalPolygon} from '../lib/game/raster-original-polygon.ts';
import {rasterOriginalWheel} from '../lib/game/raster-original-wheel.ts';
const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
const wheels=process.argv.includes('--wheels'),patternIndex=process.argv.indexOf('--pattern'),pattern=patternIndex<0?undefined:process.argv[patternIndex+1],polygons=process.argv.includes('--polygons')||!!pattern;
const result=spawnSync('python3',['tools/check_original_line_pixels.py',legacy,modern,'--libraries',libraries,...(polygons?['--polygons']:[]),...(pattern?['--pattern',pattern]:[]),...(wheels?['--wheels']:[])],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
const oracle=JSON.parse(result.stdout);assert.equal(oracle.rows.length,64);assert.equal(oracle.sourceUnchanged,true);
for(const row of oracle.rows){
 const pixels=new Uint8Array(64000);
 if(wheels)rasterOriginalWheel(row.points,0x2500,[3,7,11],[0,320,0,200],(x,y,count,colour)=>pixels.fill(colour,y*320+x,y*320+x+count));
 else if(polygons)rasterOriginalPolygon(row.points,[0,320,0,200],pattern==='two-colour'?3:7,(x,y,count,colour)=>pixels.fill(colour,y*320+x,y*320+x+count),pattern?0xaa55:undefined,pattern==='two-colour'?7:undefined);
 else{const [x0,y0,x1,y1]=row.coords;for(const [x,y,colour]of rasterOriginalLine(x0,y0,x1,y1,7,[0,320,0,200]))pixels[y*320+x]=colour;}
 assert.equal(createHash('sha256').update(pixels).digest('hex'),row.sha256,`${row.engine} ${row.coords}`);
}
console.log(JSON.stringify({originalPixelCases:64,engines:2,primitive:wheels?'wheels':pattern??(polygons?'solid polygons':'lines'),sourceUnchanged:true}));
