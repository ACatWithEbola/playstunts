/** Preserve explicitly supplied test replay/capture pairs, never deploy assets. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync,copyFileSync,constants} from 'node:fs';
import {join,isAbsolute,basename,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const [destination,...inputs]=process.argv.slice(2);
if(!destination||!isAbsolute(destination)||inputs.length===0||inputs.length%3)throw Error('Supply NEW absolute destination and replay/capture/evidence triples');
if(existsSync(destination))throw Error('Refusing existing evidence directory');
const physical=join(realpathSync(dirname(destination)),basename(destination)),publicRoot=realpathSync('public');
if(physical===publicRoot||physical.startsWith(publicRoot+'/'))throw Error('Evidence is not a public asset');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[],names=new Set();
for(let i=0;i<inputs.length;i+=3){
 const paths=inputs.slice(i,i+3);if(!paths.every(isAbsolute))throw Error('Require explicit absolute input paths');
 const [replay,capture,evidence]=paths.map(path=>readFileSync(path));
 const proof=JSON.parse(evidence);
 if(hash(replay)!==proof.replaySha256||hash(capture)!==proof.captureSha256)throw Error('Oracle input hash mismatch');
 if(capture.length!==2+proof.frames*1120||capture.readUInt16LE(0)!==proof.frames)throw Error('Incomplete oracle capture');
 if(replay.length!==0x724+proof.frames||replay.readUInt16LE(24)!==proof.frames)throw Error('Replay/capture frame mismatch');
 const files=paths.map((path,index)=>{const name=basename(path);if(names.has(name))throw Error('Duplicate evidence filename');names.add(name);return {path,name,sha256:hash([replay,capture,evidence][index])};});
 cases.push({frames:proof.frames,files});
}
mkdirSync(destination);
for(const entry of cases)for(const file of entry.files){copyFileSync(file.path,join(destination,file.name),constants.COPYFILE_EXCL);if(hash(readFileSync(join(destination,file.name)))!==file.sha256)throw Error('Copied evidence differs');}
const manifest={cases,testEvidenceOnly:true,productionDatabaseIncluded:false,privateSaveBackupIncluded:false,comparisonMustBeRerun:true};
writeFileSync(join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,cases:cases.length,files:cases.reduce((sum,c)=>sum+c.files.length,0),allCopiedHashesVerified:true,productionDatabaseIncluded:false}));
