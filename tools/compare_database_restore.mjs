/** Read-only comparison of two offline SQLite snapshots. No export/deployment. */
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,existsSync,realpathSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const hash=value=>createHash('sha256').update(value).digest('hex');
const quote=name=>'"'+name.replaceAll('"','""')+'"';
const encode=value=>{
 if(typeof value==='number'){const bytes=Buffer.alloc(8);bytes.writeDoubleLE(value);return ['real',bytes.toString('hex')];}
 return value===null?['null']:typeof value==='bigint'?['integer',value.toString()]:value instanceof Uint8Array?['blob',Buffer.from(value).toString('hex')]:[typeof value,value];
};
export function inspectSnapshot(path){
 const resolved=realpathSync(path);
 if(existsSync(resolved+'-wal')||existsSync(resolved+'-shm'))throw Error('Require a consistent offline snapshot without WAL/SHM sidecars');
 const fileHash=hash(readFileSync(resolved));
 const db=new DatabaseSync(resolved,{readOnly:true});
 try{
  const integrity=db.prepare('PRAGMA integrity_check').all();
  if(integrity.length!==1||Object.values(integrity[0])[0]!=='ok')throw Error('SQLite integrity check failed');
  const schema=db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name').all();
  const tables=Object.create(null);
  for(const {name} of schema.filter(row=>row.type==='table')){
   const columns=db.prepare('PRAGMA table_xinfo('+quote(name)+')').all();
   const statement=db.prepare('SELECT * FROM '+quote(name));statement.setReadBigInts(true);
   const rows=statement.all().map(row=>JSON.stringify(Object.entries(row).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>[key,encode(value)]))).sort();
   tables[name]={columnsHash:hash(JSON.stringify(columns)),rowCount:rows.length,rowsHash:hash(JSON.stringify(rows))};
  }
  if(hash(readFileSync(resolved))!==fileHash)throw Error('Snapshot changed during inspection');
  return {fileHash,schemaHash:hash(JSON.stringify(schema)),tables};
 }finally{db.close();}
}
export function compareSnapshots(source,restored){
 const sourceStat=statSync(source),restoredStat=statSync(restored);
 if(realpathSync(source)===realpathSync(restored)||(sourceStat.dev===restoredStat.dev&&sourceStat.ino===restoredStat.ino))throw Error('Independent restored snapshot required');
 const original=inspectSnapshot(source),copy=inspectSnapshot(restored);
 if(original.schemaHash!==copy.schemaHash||JSON.stringify(original.tables)!==JSON.stringify(copy.tables))throw Error('Restored schema or stored values differ');
 return {source:original,restored:copy,allStoredValuesMatch:true,
  sourceCompletenessVerified:false,scope:'Logical equality of provided offline snapshots; obtaining a complete production export remains separate'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [source,restored]=process.argv.slice(2);if(!source||!restored)throw Error('Provide source and independently restored SQLite snapshot paths');
 console.log(JSON.stringify(compareSnapshots(source,restored)));
}
