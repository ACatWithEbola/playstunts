/** Test-only car matrix from a copied input prefix; never rewrite real replays. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [source,destination,image,resources,libraries,framesText]=process.argv.slice(2);
if(![source,destination,image,resources,libraries].every(p=>p&&isAbsolute(p))||existsSync(destination))throw Error('Require absolute inputs and NEW output directory');
const hash=b=>createHash('sha256').update(b).digest('hex'),original=readFileSync(source),sourceHash=hash(original);
if(original.readUInt16LE(22)!==20||original.length!==0x724+original.readUInt16LE(24)||original[6]!==0)throw Error('Require solo modern20Hz recording');
const frames=framesText===undefined?300:Number(framesText);
if(!Number.isSafeInteger(frames)||frames<1||frames>1200||original.readUInt16LE(24)<frames)throw Error('Require bounded1..1200tick prefix covered by recording');
mkdirSync(destination);
const run=(command,args)=>{const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:32*1024*1024});if(result.status!==0)throw Error(result.stderr||result.stdout);return result.stdout;};
const results=[];
for(const car of ['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']){
 const replay=Buffer.from(original.subarray(0,0x724+frames));replay.write(car,0,'ascii');replay.writeUInt16LE(frames,24);
 const path=join(destination,car+'.RPL'),capture=join(destination,car+'.bin'),evidence=join(destination,car+'.json');writeFileSync(path,replay,{flag:'wx'});
 run('python3',['tools/check_original_ms91_track_allocation.py',image,'--libraries',libraries,'--replay',path,'--game',join(resources,'GAME.PRE'),'--analyze','--car',join(resources,'CAR'+car+'.RES'),'--position','690432','0','805760','--chassis-step','--driving-step','0','--recorded-inputs','--driving-steps',String(frames),'--race-init','--full-player','--update-race','--state-output',capture,'--capture-evidence',evidence]);
 const comparison=run(process.execPath,['tools/compare_external_replay.ts',path,capture,'ms-1991','','--no-finish-expected',evidence]);
 results.push({car,frames,comparison:comparison.trim().split('\n').map(JSON.parse)});
 console.log(JSON.stringify({car,frames,matched:true,testOnly:true}));
}
if(hash(readFileSync(source))!==sourceHash)throw Error('Source recording changed');
writeFileSync(join(destination,'matrix.json'),JSON.stringify({source,sourceHash,sourceUnchanged:true,frames,cases:results,scope:'Synthetic car substitutions using actual solo input prefix; not full-race finishes or audio verification'},null,2),{flag:'wx'});
