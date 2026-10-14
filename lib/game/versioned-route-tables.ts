import {uses1991Physics} from '../physics/engine-version.ts';
import type {NativeRaceData} from './native-race-session.ts';
/** Original MS91 route-table audit: tiles40..47 omit the middle pair. Shared
 * legacy assets and their normalized address words must never be rewritten. */
export function versionedRouteTables<T extends Pick<NativeRaceData,'physicsEngine'|'records'|'points'>>(data:T):T{
 const modern=uses1991Physics(data.physicsEngine);
 let records=data.records,points=data.points;
 for(let tile=40;tile<=47;tile++){
  const row=records[tile]?.records[0],pair=points[tile]?.records[0];
  if(!modern&&row?.[5]!==2)continue;
  if(!row||!pair||pair.alternate)throw Error('Missing versioned route definition for tile '+tile);
  if(modern&&row[5]===2&&pair.primary?.length===4)continue;
  if(!modern){
   if(pair.primary?.length!==4)throw Error('Unexpected modern route definition for tile '+tile);
   if(records===data.records)records=records.slice();if(points===data.points)points=points.slice();
   const next=row.slice();next[5]=3;
   records[tile]={...records[tile],records:[next,...records[tile].records.slice(1)]};
   points[tile]={...points[tile],records:[{...pair,primary:[...pair.primary.slice(0,2),[-120,-1,0],[120,-1,0],...pair.primary.slice(2)].map(vector=>vector.slice())},...points[tile].records.slice(1)]};
   continue;
  }
  if(row[5]!==3||pair.primary?.length!==6||pair.primary[2].join(',')!=='-120,-1,0'||pair.primary[3].join(',')!=='120,-1,0')throw Error('Unexpected legacy route definition for tile '+tile);
  if(records===data.records)records=records.slice();
  if(points===data.points)points=points.slice();
  const next=row.slice();next[5]=2;
  records[tile]={...records[tile],records:[next,...records[tile].records.slice(1)]};
  points[tile]={...points[tile],records:[{...pair,primary:[...pair.primary.slice(0,2),...pair.primary.slice(4)].map(vector=>vector.slice())},...points[tile].records.slice(1)]};
 }
 return records===data.records?data:{...data,records,points};
}
