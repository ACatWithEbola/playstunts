/** Full content IDs use equality, not a text-name LIKE pattern. */
export function leaderboardSearch(query:string,label:string,text:(from:number,to:number)=>string,catalog:string){
 if(/^[a-f0-9]{64}$/i.test(query))return {sql:'s.track_hash=?',params:[query.toLowerCase()]};
 const pattern='%'+query.replace(/[\\%_]/g,c=>'\\'+c)+'%';
 return {sql:`(${label} LIKE ? ESCAPE '\\' OR ${text(0,17)} LIKE ? ESCAPE '\\' OR ${text(17,41)} LIKE ? ESCAPE '\\' OR s.car_code LIKE ? ESCAPE '\\' OR s.track_hash LIKE ? ESCAPE '\\')`,params:[catalog,pattern,pattern,pattern,pattern,pattern]};
}
