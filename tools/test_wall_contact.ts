import assert from 'node:assert/strict';
import {test} from 'node:test';
import {wallResponse, type WallResponseInput} from '../lib/physics/wall-response.ts';
import {trackContact, type TrackGeometry} from '../lib/physics/track-contact.ts';
import {reconstructPose, type ChassisState} from '../lib/physics/chassis.ts';
import {rotateY, rotateZXY} from '../lib/physics/rotation.ts';
import {vecTransform, type Vector} from '../lib/physics/math.ts';

function stationaryCrossing(orientation: number, side: number): WallResponseInput {
  const rotate = (v: Vector) => vecTransform(v, rotateY(orientation));
  const origins = [[side * 64, 640, 1920], [-side * 4032, 640, 1920],
    [-side * 4032, 640, -1920], [side * 64, 640, -1920]].map(p => rotate(p as Vector));
  return {
    proposed: structuredClone(origins), origins, previous: rotate([-side, 10, 30]), wheel: 0,
    wall: {orientation, origin: [0, 0]}, distance: 10, wallLower: -12, wallUpper: 42,
    carRotation: [0, 0, 0], roadSpeed: 0, scaledRoadSpeed: 0, wheelAngle: 17, soundFlags: 8,
  };
}

await test('stopped wall crossings separate every wheel without forward travel or a divide', () => {
  for (const orientation of [0, 256, 512, 768]) for (const side of [-1, 1]) {
    const input = stationaryCrossing(orientation, side), before = structuredClone(input);
    const response = wallResponse(input);
    assert.ok(response);
    const unrotate = (p: Vector) => vecTransform(p, rotateY(-orientation));
    for (let w = 0; w < 4; w++) {
      const actual = unrotate(response.proposed[w]), origin = unrotate(input.origins[w]);
      assert.deepEqual(actual, [origin[0] - side * 832, origin[1], origin[2]]);
      assert.ok(actual[0] * side < 0, 'all wheels remain on the previous side of the wall');
      assert.ok(actual.every(Number.isFinite));
    }
    assert.equal(response.wheelAngle, 17);
    assert.equal(response.soundFlags, 24);
    assert.deepEqual(response.crashEvents, []);
    assert.equal(wallResponse({...input, proposed: response.proposed}), null, 'separation needs no further wall retry');
    assert.deepEqual(input, before, 'contact inputs remain unchanged');
  }
});

await test('a deeply penetrating or overturned stopped wreck separates along the wall normal', () => {
  for (const orientation of [0, 256, 512, 768]) for (const side of [-1, 1]) {
    for (const rotation of [[0, 0, 256], [0, 256, 0], [391, -170, 511]] as Vector[]) {
      const input = stationaryCrossing(orientation, side);
      const penetration = vecTransform([side * 64 * 64, 0, 0], rotateY(orientation));
      input.origins = input.origins.map(p => p.map((n, a) => n + penetration[a]) as Vector);
      input.proposed = structuredClone(input.origins);
      input.carRotation = rotation;
      const response = wallResponse(input);
      assert.ok(response);
      const local = response.proposed.map(p => vecTransform(p, rotateY(-orientation)));
      assert.equal(local[0][0], -side * 768, 'the crossing wheel clears the wall by 12 world units');
      assert.ok(local.every(p => p[0] * side < 0));
      assert.deepEqual(response.proposed.map(p => p[1]), input.origins.map(p => p[1]), 'separation does not lift the wreck');
      assert.equal(wallResponse({...input, proposed: response.proposed}), null);
    }
  }
});

await test('zero-distance wall endpoints and quantized low speed remain finite', () => {
  for (const roadSpeed of [0, 1, 10]) for (const endpoint of ['previous', 'proposed', 'both']) {
    const input = stationaryCrossing(0, 1);
    input.roadSpeed = roadSpeed;
    if (endpoint !== 'proposed') input.previous[0] = 0;
    if (endpoint !== 'previous') input.proposed[0][0] = 0;
    const response = wallResponse(input);
    assert.ok(response);
    assert.ok(response.proposed.flat().every(Number.isFinite));
  }
  const input = stationaryCrossing(0, 1);
  assert.equal(wallResponse({...input, distance: input.wallLower}), null);
  assert.equal(wallResponse({...input, distance: input.wallUpper}), null);
});

await test('stopped wreck separation survives ground projection and subsequent suspension settling', () => {
  // A synthetic road-barrier tile, with its left wall at local X=23.
  // The front-right wheel moves from X=22 to X=24 while forward speed is zero.
  const walls: TrackGeometry['walls'] = [];
  walls[148] = {id: 148, orientation: 512, origin: [23, -271]};
  const track: TrackGeometry = {
    raw: Array(1802).fill(0),
    objects: [{id: 0, rotation: 0, surface: 1, multiTile: 0, physics: 34}],
    planes: [{id: 0, roll: 0, pitch: 0, origin: [0, 0, 0], normal: [0, 8192, 0], rotation: rotateZXY(0, 0, 0)}],
    walls,
  };
  const wheels = [[32, 0, 30], [-32, 0, 30], [-32, 0, -30], [32, 0, -30]]
    .map(p => p.map(n => n * 64) as Vector);
  let history = wheels.map(p => [502 + p[0] / 64, 0, 232 + p[2] / 64] as Vector);
  let chassis: ChassisState = {
    position: [504 * 64, 384, 232 * 64], rotation: [0, 0, 0], roadSpeed: 0,
    frontWheelAngle: 0, wheelAngle: 0, spin: 0, allContact: 4, suspension: [0, 0, 0, 0],
  };
  let suspension = {rc1: [0, 0, 0, 0], rc2: [0, 0, 0, 0], rc4: [0, 0, 0, 0], rc5: [0, 0, 0, 0]};
  for (let tick = 0; tick < 40; tick++) {
    const result = trackContact(chassis, wheels, history, suspension, track, 1, 0,
      [0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1]);
    assert.equal(result.passes, tick === 0 ? 2 : 1, 'retry completes without exhausting the contact loop');
    assert.equal(result.crash, 1, 'the existing crash remains active');
    assert.deepEqual(result.crashEvents, [], 'settling must not request another crash');
    assert.ok(result.wheelPositions.every(p => p[0] < 535), 'ground contact must not put a wheel back inside the wall');
    assert.ok(result.centres.flat().every(Number.isFinite));
    assert.equal(result.roadSpeed, 0);
    history = result.wheelPositions;
    suspension = result.suspension;
    chassis = {...chassis, ...reconstructPose(result.centres), suspension: suspension.rc2};
  }
});

await test('moving collision preserves an original executable wall-response capture', () => {
  // Generated arithmetic fixture from wall-response-oracle.py, seed 732961.
  // The full private oracle separately covers 3,000 moving contact cases.
  const response = wallResponse({
    proposed: [[689745,1709,684858],[683996,1975,692479],[692793,483,692703],[692427,915,688850]],
    origins: [[690279,878,684650],[684971,1727,692190],[691435,805,692379],[692807,1296,687790]],
    previous: [10803,0,10720], wheel: 0, wall: {orientation: 908, origin: [10752,10752]},
    distance: -1, wallLower: -12, wallUpper: 42, carRotation: [109,100,-39],
    roadSpeed: 36900, scaledRoadSpeed: 4111, wheelAngle: -20, soundFlags: 8,
  });
  assert.deepEqual(response, {
    proposed: [[689965,2239,685846],[684325,2650,693447],[692540,1301,693662],[692608,1747,689625]],
    wheelAngle: 14, soundFlags: 24, crashEvents: [1],
  });
});
