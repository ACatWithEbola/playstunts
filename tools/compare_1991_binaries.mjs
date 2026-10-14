/** Read-only locator for original 16-bit routines; not a compatibility claim. */
import {readFileSync} from 'node:fs';
const [bbPath,msPath]=process.argv.slice(2);
if(!bbPath||!msPath)throw Error('Usage: node tools/compare_1991_binaries.mjs BB_IMAGE MS_IMAGE');
const bb=readFileSync(bbPath),ms=readFileSync(msPath);
// Engine signature includes the frame-rate comparison, rather than only a
// common compiler prologue. The data address is version-specific.
for(const [name,hex] of [['grip','558bec83ec1057568b5e0680bfc10000'],['engine','558bec83ec0a5756833e']]){
 const pattern=Buffer.from(hex,'hex');
 const positions=bytes=>{const found=[];for(let i=bytes.indexOf(pattern);i>=0;i=bytes.indexOf(pattern,i+1))found.push(i);return found;};
 const candidates={bb:positions(bb),ms:positions(ms)};
 console.log(JSON.stringify({name,candidates}));
 for(const b of candidates.bb){
  const ranked=candidates.ms.map(m=>({bbOffset:b,msOffset:m,equalBytes:Array.from({length:512},(_,i)=>bb[b+i]===ms[m+i]).filter(Boolean).length})).sort((a,b)=>b.equalBytes-a.equalBytes);
  console.log(JSON.stringify({name,bestWindowMatch:ranked[0],notProofOfEquivalentPhysics:true}));
 }
 if(candidates.bb.length===1&&candidates.ms.length===1){
  const differences=[];
  for(let i=0;i<512;i++)if(bb[candidates.bb[0]+i]!==ms[candidates.ms[0]+i])differences.push({offset:i,bb:bb[candidates.bb[0]+i],ms:ms[candidates.ms[0]+i]});
  console.log(JSON.stringify({name,windowBytes:512,differingBytes:differences.length,firstDifferences:differences.slice(0,20)}));
 }
}
