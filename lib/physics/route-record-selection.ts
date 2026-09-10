/** Original0x12c55..0x12c6d and0x12a7a..0x12a91; before visited-route handling. */
export function selectRouteRecord(record:number[],entry:number,state:number):{error:number;direction:number|null}{
 if(record[1]===entry)return record[3]===state?{error:0,direction:0}:{error:4,direction:null};
 if(record[2]===entry)return record[4]===state?{error:0,direction:1}:{error:4,direction:null};
 return {error:0,direction:-1};
}
