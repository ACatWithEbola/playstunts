import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function releaseProgress(source){
 const items=[...source.matchAll(/^(\d+)\. \[([ x])\] (.+)$/gm)].map(row=>({id:Number(row[1]),verified:row[2]==='x',description:row[3]}));
 if(items.length!==103||items.some((item,index)=>item.id!==index+1))throw Error('Release checklist must contain exactly items1–103 in order; review missing/duplicate/changed scope');
 const verified=items.filter(item=>item.verified).length;
 return {verified,total:items.length,remaining:items.length-verified,percentCompleted:Number((100*verified/items.length).toFixed(1)),openItems:items.filter(item=>!item.verified)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(releaseProgress(readFileSync(new URL('../docs/MS91-DETAILED-RELEASE-CHECKS.md',import.meta.url),'utf8')),null,2));
