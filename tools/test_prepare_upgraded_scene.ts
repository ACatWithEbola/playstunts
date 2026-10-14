import assert from 'node:assert/strict';
import {prepareUpgradedScene} from '../lib/game/prepare-upgraded-scene.ts';
for(const outcome of ['ready','cancel','failure'] as const){
 let release!:()=>void,closed=false,disposals=0,installed=0;
 const pending=new Promise<void>(resolve=>{release=resolve;});
 const scene={async prepare(){await pending;if(outcome==='failure')throw Error('shader failure');},close(){disposals++;}};
 const ready=prepareUpgradedScene(scene,()=>closed,value=>{assert.equal(value,scene);installed++;});
 assert.equal(installed,0,'An unfinished scene cannot reach drawing');
 if(outcome==='cancel')closed=true;
 release();
 if(outcome==='failure')await assert.rejects(ready,/shader failure/);else await ready;
 assert.equal(installed,outcome==='ready'?1:0);
 assert.equal(disposals,outcome==='ready'?0:1,'Failed/cancelled preparation releases its GPU owner once');
}
console.log('Enhanced scene handover awaits shader readiness; cancellation/failure disposes without late drawing');
