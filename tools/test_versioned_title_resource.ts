import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixtureData} from './global-score-fixture.ts';
import {versionedTitleResourceCatalog,versionedTitleArtwork} from '../lib/game/versioned-title-resource.ts';
import resource from '../lib/game/ms91-title-resource.json' with {type:'json'};
import {prepareNativeDisplayTitleCards} from '../lib/game/native-display-title-cards.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {originalPackedDisplayPixels} from '../lib/game/packed-display-pixels.ts';
const legacy=fixtureData.catalog,modern=versionedTitleResourceCatalog(legacy,'ms-1991');
assert.equal(versionedTitleResourceCatalog(legacy),legacy);
assert.equal(versionedTitleResourceCatalog(legacy,'ms-1990'),legacy);
const old=await legacy.read('SDTITL.PVS'),newBytes=await modern.read('C:\\SDTITL.PVS');assert.ok(old&&newBytes);
assert.equal(createHash('sha256').update(newBytes).digest('hex'),resource.sha256);
assert.notDeepEqual(old,newBytes);
newBytes[0]^=255;assert.notDeepEqual(await modern.read('SDTITL.PVS'),newBytes);
assert.deepEqual(await legacy.read('SDTITL.PVS'),old);
assert.deepEqual(await modern.read('SDTITL.PES'),await legacy.read('SDTITL.PES'));
const root=process.argv[2];if(root)assert.deepEqual(await modern.read('SDTITL.PVS'),new Uint8Array(readFileSync(root+'/ms91/SDTITL.PVS')));
const packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));
const originalArt=JSON.parse(readFileSync('public/game/title-art.json','utf8')),artBefore=structuredClone(originalArt);
assert.equal(versionedTitleArtwork(originalArt),originalArt);
assert.equal(versionedTitleArtwork(originalArt,'ms-1990'),originalArt);
const modernArt=versionedTitleArtwork(originalArt,'ms-1991');
assert.equal(modernArt.resources.prod,originalArt.resources.prod,'Unchanged publisher art remains shared');
assert.equal(modernArt.resources.titl.bytes.length,64016);
assert.equal(createHash('sha256').update(Uint8Array.from(modernArt.resources.titl.bytes)).digest('hex'),'81c3ea366d053af2a7a8f551be39fd63c4b74cb615c4574176dcd77dfb73e284');
modernArt.resources.titl.bytes[16]^=255;
assert.notDeepEqual(versionedTitleArtwork(originalArt,'ms-1991').resources.titl.bytes,modernArt.resources.titl.bytes);
assert.deepEqual(originalArt,artBefore,'Raster title overlay must not mutate legacy data');
for(const mode of ['cga','tandy','ega'] as const){
const pictures:Uint8Array[][]=[];
for(const catalog of [legacy,modern]){
 const frames:Uint8Array[]=[];
 const cards=await prepareNativeDisplayTitleCards(mode,decodeNativeInitialDisplayData(packet.modes[mode]),catalog,()=>{
  frames.push((mode==='ega'?cards.owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(cards.owner.memory(),mode)).slice());
 });
 try{
  const flow=cards.titles();let step=flow.next();
  while(!step.done){
   if(step.value.type==='present'){
    const presentation=cards.presentation(step.value.argument);let part=presentation.next();let guard=0;
    while(!part.done){assert.ok(++guard<10000,'Presentation must terminate');part=presentation.next(part.value.type==='timer'?1:0);}
   }
   step=flow.next(0);
  }
 }
 finally{cards.release();}
 assert.ok(frames.length>0);pictures.push(frames);
}
assert.equal(pictures[0].length,pictures[1].length);
assert.ok(pictures[0].some((frame,i)=>frame.some((pixel,j)=>pixel!==pictures[1][i][j])),'Allocated modern title actually renders different pixels in '+mode);
}
assert.deepEqual(await legacy.read('SDTITL.PVS'),old);
console.log('Versioned title: exact modern packed hash, isolated copy-only reads, preserved legacy catalog and real allocated CGA/Tandy/EGA title rendering pass');
