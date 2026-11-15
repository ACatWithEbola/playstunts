import assert from 'node:assert/strict';
import {createRouteEnvelope} from '../lib/server/route-envelope.ts';
const graph={primary:[1,2,0,4,0],alternate:[3,65535,65535,65535,65535],columns:[5,15,5,1,5],rows:[15,15,16,15,16],footprints:[0,0,0,0,0]};
const check=()=>createRouteEnvelope(graph);let c=check();assert.equal(c.result(true),false);c.observe([5.5*1024*64,0,14.5*1024*64]);assert.equal(c.result(false),false);assert.equal(c.result(true),true,'both possible arms are far outside the driven area');
c=check();c.observe([5.5*1024*64,0,14.5*1024*64]);c.observe([15.5*1024*64,0,14.5*1024*64]);assert.equal(c.result(true),false,'primary arm remains possible');
c=check();c.observe([5.5*1024*64,0,14.5*1024*64]);c.observe([1.5*1024*64,0,14.5*1024*64]);assert.equal(c.result(true),false,'alternate arm remains possible');
c=createRouteEnvelope({...graph,primary:[1,99,0,4,0]});c.observe([5.5*1024*64,0,14.5*1024*64]);assert.equal(c.result(true),false,'outside graph is inconclusive');
c=check();c.observe([NaN,0,0]);assert.equal(c.result(true),false);
console.log('Route-envelope diagnostic respects alternatives, missing graphs, and invalid positions');
