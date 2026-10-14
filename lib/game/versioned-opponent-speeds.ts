import {uses1991Physics,type PhysicsEngineVersion} from '../physics/engine-version.ts';
const legacy=[
 [120,75,50,40,30,20,60,40,20,80,115,20,30,70,80,50],
 [150,120,100,40,30,20,80,60,40,110,115,30,30,100,120,50],
 [120,120,100,40,30,20,80,60,40,90,115,20,30,100,120,50],
 [150,120,80,20,10,5,50,40,30,90,115,20,30,70,120,50],
 [170,140,100,40,30,20,70,60,40,100,115,20,30,120,120,50],
 [200,150,100,50,30,20,100,80,40,150,115,40,30,150,140,50]
];
/** Full unpacked original OPP1..6 comparisons: only these speed bytes differ. */
export function versionedOpponentSpeeds(profile:Uint8Array,opponent:number,engine?:PhysicsEngineVersion){
 const newer=uses1991Physics(engine);
 if(!Number.isInteger(opponent)||opponent<1||opponent>6||profile.length!==16){if(!newer)return profile;throw Error('Unsupported versioned opponent profile');}
 const old=legacy[opponent-1],modern=old.slice();modern[9]=[90,120,110,120,140,175][opponent-1];
 if(opponent===6){modern[11]=60;modern[12]=50;}
 if(!newer)return profile.every((value,index)=>value===modern[index])?Uint8Array.from(old):profile;
 if(profile.every((value,index)=>value===modern[index]))return profile;
 if(!profile.every((value,index)=>value===old[index]))throw Error('Unexpected original opponent speed profile');
 return Uint8Array.from(modern);
}
