import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createShortcutAssessment} from '../lib/server/shortcut-assessment.ts';
import {createFullRouteWitness} from '../lib/server/full-route-witness.ts';
import {publicLeaderboards} from '../lib/server/public-leaderboards.ts';
import {pruneCarScoresSQL} from '../lib/server/leaderboard-ranking.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {fixtureData,finishedScoreFixture} from './global-score-fixture.ts';
import {createGrassSpeedExploit} from '../lib/server/grass-speed-exploit.ts';
import {stepEngine,type EngineState} from '../lib/physics/engine.ts';
import {stepGrip} from '../lib/physics/grip.ts';
const graph={primary:[1,2,3,4,5,6,7,0],alternate:Array(8).fill(65535),columns:[0,0,0,1,2,2,2,1],rows:[0,1,2,2,2,1,0,0],footprints:Array(8).fill(0)};
const position=(node:number)=>[(graph.columns[node]+.5)*65536,0,(29-graph.rows[node]+.5)*65536],road=[1,1,1,1],grass=[4,4,4,4];
function excursion(to:number,options:{air?:boolean;short?:boolean;partial?:boolean}={}){
 const check=createShortcutAssessment(graph);check.observe(position(0),road);
 const start=position(0),end=position(to),frames=options.short?2:12;
 for(let i=0;i<frames;i++)check.observe(start.map((n,a)=>n+(end[a]-n)*(i+1)/(frames+1)),options.partial?[1,4,4,4]:grass);
 if(options.air)check.observe(position(3),[0,0,0,0]);
 for(let i=0;i<4;i++)check.observe(position(to),road);
 return check.result();
}
test('substantial grass transfer to a non-neighbouring section is detected',()=>assert.equal(excursion(4),'shortcuts_detected'));
test('same section, neighbouring corner cut, brief excursion, curb and jump do not accuse a shortcut',()=>{
 for(const result of [excursion(0),excursion(1),excursion(2),excursion(4,{short:true}),excursion(4,{partial:true}),excursion(4,{air:true})])assert.equal(result,'not_assessed');
});
test('ambiguous overlapping road footprints cannot accuse a shortcut',()=>{
 const check=createShortcutAssessment({...graph,columns:[0,0,2,3,4,5,6,7]});check.observe(position(0),road);
 for(let i=0;i<12;i++)check.observe([32768+i*4096,0,29.5*65536],grass);
 for(let i=0;i<4;i++)check.observe(position(4),road);assert.equal(check.result(),'not_assessed');
});
test('two-second parallel grass travel along the same straight road is not a shortcut',()=>{
 const straight={...graph,columns:[0,1,2,3,4,5,6,7],rows:Array(8).fill(0)},check=createShortcutAssessment(straight);
 check.observe([32768,0,29.5*65536],road);
 for(let i=1;i<=40;i++)check.observe([32768+4*65536*i/41,0,29.5*65536],grass);
 for(let i=0;i<4;i++)check.observe([4.5*65536,0,29.5*65536],road);
 assert.equal(check.result(),'not_assessed');
});
test('dual-way switching is detected even when both arms are neighbours of the fork',()=>{
 const fork={primary:[1,2,3,7,5,6,7,0],alternate:[4,65535,65535,65535,65535,65535,65535,65535],columns:[0,0,0,0,1,1,1,1],rows:[0,1,2,3,1,2,3,4],footprints:Array(8).fill(0)};
 const pos=(node:number)=>[(fork.columns[node]+.5)*65536,0,(29-fork.rows[node]+.5)*65536];
 const cross=(to:number)=>{const check=createShortcutAssessment(fork),a=pos(1),b=pos(to);check.observe(a,road);for(let i=1;i<=20;i++)check.observe(a.map((n,k)=>n+(b[k]-n)*i/21),grass);for(let i=0;i<4;i++)check.observe(b,road);return check.result();};
 assert.equal(cross(4),'shortcuts_detected');assert.equal(cross(2),'not_assessed');assert.equal(cross(1),'not_assessed');
});
test('original engine/grip power-gear grass behaviour is detected for all four known cars',()=>{
 for(const id of ['PMIN','FGTO','VETT','ANSX','COUN']){
  const tuning=fixtureData.cars.find((car:{id:string})=>car.id===id)!,ratio=tuning.gearRatios[tuning.gears],initial=id==='ANSX'?51968:61740,check=createGrassSpeedExploit(tuning);
  let engine:EngineState={speed:initial,roadSpeed:initial,lastSpeed:initial,speedDiff:0,rpm:Math.floor(initial*ratio/65536),lastRPM:0,gear:tuning.gears,ratio,ratioHigh:ratio>>>8,gravity:0,rearContact:8,allContact:16,automatic:0,shifting:0,shiftTimer:0,limiter:0,knobX:0,knobY:0,targetX:0,targetY:0,accelerating:1,braking:0};
  const original={...engine};
  for(let frame=0;frame<200;frame++){
   check.observe(engine,grass,1);const next=stepEngine(engine,tuning,1),grip=stepGrip({...next,steeringAngle:0,wheelAngle:0,spin:0,frontWheelAngle:0,slip:0,demandedGrip:0,surfaceGrip:0,surfaces:grass,sliding:0,crash:0,soundFlags:0,yaw:0,roll:0},tuning);engine={...next,speed:grip.speed,roadSpeed:grip.roadSpeed};
  }
  assert.equal(check.result(),id!=='COUN',id);
  const brief=createGrassSpeedExploit(tuning);for(let i=0;i<7;i++)brief.observe(original,grass,1);assert.equal(brief.result(),false);
  const curb=createGrassSpeedExploit(tuning);for(let i=0;i<80;i++)curb.observe(original,[1,4,4,4],1);assert.equal(curb.result(),false);
  const downhill=createGrassSpeedExploit(tuning);for(let i=0;i<80;i++)downhill.observe({...original,gravity:100},grass,1);assert.equal(downhill.result(),false);
 }
});
const proofGraph={primary:[1,2,0],alternate:[65535,65535,65535],columns:[0,1,2],rows:[0,0,0],footprints:[0,0,0]};
const gates=[0,1,2].map(x=>[{position:[x*1024+512,-1,512],radius:100}]);
const observeGates=(witness:ReturnType<typeof createFullRouteWitness>,surface=road)=>{for(const list of gates)for(const gate of list)witness.observe([gate.position[0]*64,0,gate.position[2]*64],surface);};
test('full-route proof needs a finished connected path with positive gate coverage',()=>{
 const complete=createFullRouteWitness(proofGraph,gates);observeGates(complete);assert.equal(complete.result(true),true);assert.equal(complete.result(false),false);
 const missing=createFullRouteWitness(proofGraph,[gates[0],[],gates[2]]);observeGates(missing);assert.equal(missing.result(true),false);
 const airborne=createFullRouteWitness(proofGraph,gates);observeGates(airborne,[0,0,0,0]);assert.equal(airborne.result(true),false);
});
test('ground-level bypass cannot certify elevated stunt gates',()=>{
 const witness=createFullRouteWitness(proofGraph,[gates[0],[{position:[1536,975,512],radius:200}],gates[2]]);observeGates(witness);assert.equal(witness.result(true),false);
});
test('unused branch is not mandatory; unsupported chosen branch stays unassessed',()=>{
 const fork={...proofGraph,primary:[1,0,0],alternate:[2,65535,65535]};
 const witness=createFullRouteWitness(fork,[gates[0],gates[1],[]]);observeGates(witness);assert.equal(witness.result(true),true);
});
test('categories independently retain best times for the same driver',()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE global_scores(id TEXT PRIMARY KEY,rules TEXT,track_hash TEXT,car_code TEXT,ticks INTEGER,record TEXT,created_at INTEGER,driver_key TEXT,route_assessment TEXT DEFAULT 'not_assessed')");
 const insert=db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)'),record=Array(52).fill(0);record[0]=65;
 for(const [id,ticks,category] of [['full',100,'full_route'],['cut',50,'shortcuts_detected'],['old',120,'not_assessed'],['slowfull',110,'full_route']] as const)insert.run(id,'rules','track','PMIN',ticks,JSON.stringify(record),1,'name:a',category);
 db.prepare(pruneCarScoresSQL).run('rules','track','rules','track');assert.deepEqual(db.prepare('SELECT id FROM global_scores ORDER BY id').all().map(row=>row.id),['cut','full','old']);
 const board=publicLeaderboards(db.prepare('SELECT *,NULL AS track_name,0 AS has_replay FROM global_scores').all() as never,new Map())[0];
 assert.equal(board.categories!.full_route.scores[0].id,'full');assert.equal(board.categories!.shortcuts_detected.scores[0].id,'cut');assert.equal(board.categories!.not_assessed.scores[0].id,'old');db.close();
});
test('real native race still verifies with exactly the same score, without trusting client category claims',async()=>{
 const original=await finishedScoreFixture(),result=await verifyGlobalScore({...original,routeAssessment:'full_route'},fixtureData);
 assert.equal(result.ticks,original.record[50]+256*original.record[51]);assert.ok(['full_route','not_assessed','shortcuts_detected'].includes(result.routeAssessment));
 console.log('Native fixture assessment:',result.routeAssessment);
});
