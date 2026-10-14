import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// Reference-only firmware, outside app/public. Pinned source, exclusive files.
// 86Box machine_tandy1000sl2_init maps64KiB atF0000 using file offset18000.
const commit='be34bde82fae674aefdd80cad196a9a2fa3b5211';
const specs=[['8079047.hu1','9c653567779899cec58a423db83bf5157278d7bf'],['8079048.hu2','4e526ae52245f49c0e69e69f6ec2ed380fe0085b']];
const scratch=mkdtempSync(join(tmpdir(),'playstunts-sl2-firmware-')),parts=[],files=[];
for(const [name,expected] of specs){
 const url=`https://raw.githubusercontent.com/86Box/roms/${commit}/machines/tandy1000sl2/${name}`,response=await fetch(url);assert.ok(response.ok);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,262144);
 const blob=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');assert.equal(blob,expected);
 parts.push(bytes);files.push({name,url,gitBlobSha1:blob,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 writeFileSync(join(scratch,name),bytes,{flag:'wx'});
}
const full=Buffer.alloc(524288);for(let index=0;index<262144;index++){full[index*2]=parts[0][index];full[index*2+1]=parts[1][index];}
const bios=full.subarray(0x30000,0x40000);assert.equal(bios[0xfff0],0xea,'Expected far reset jump in selected BIOS bank');
writeFileSync(join(scratch,'bios-f000.bin'),bios,{flag:'wx'});
const candidates=[];for(let offset=0;offset<bios.length-2;offset++)if(bios[offset]===0x80&&bios[offset+1]===0xfc&&bios[offset+2]>=0x80&&bios[offset+2]<=0x85)candidates.push({offset,ah:bios[offset+2]});
const manifest={commit,scope:'Reference-only SL/2 firmware bank, not shipped code or executed timing proof',files,bios:{physicalAddress:0xf0000,interleavedOffset:0x30000,bytes:bios.length,sha256:createHash('sha256').update(bios).digest('hex'),resetJump:bios.subarray(0xfff0,0xfff5).toString('hex')},soundDispatchCandidates:candidates};
writeFileSync(join(scratch,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
console.log(JSON.stringify({scratch,...manifest},null,2));
