/** Combined original contact pass for reconstructed track geometry at 20 Hz.
 * Race/audio/particle consumers receive accepted crash events separately.
 */
import { i16, vecTransform, type Vector } from './math.ts';
import { rotateZXY } from './rotation.ts';
import { proposeWheels, type ChassisState } from './chassis.ts';
import { type WheelSuspension } from './contact.ts';
import { trackPlaneContact, type TrackObject } from './track.ts';
import { planeDistance, type CollisionPlane } from './plane.ts';
import { placeWall, type CollisionWall } from './wall.ts';
import { wallResponse } from './wall-response.ts';
import { wheelPlaneContact } from './wheel-plane-contact.ts';
import { stepSuspension } from './suspension.ts';
export interface CrashImpact {cause:1|2|3|4|5;yaw:number;roadSpeed:number}
export interface TrackGeometry {
  mode?: number;
  otherCar?:{selected:0|1;body:import('./car-overlap.ts').CollisionBody;state:import('./race-car-contact.ts').RaceContactCar;dimensions:Vector;radius:number};
  landmarks?: {dimensions:Vector;radius:number;hillHeight:number};
  posts?: {column:number;terrainRow:number;height:number;heading:number;dimensions:Vector;radius:number};
  raw: number[];
  objects: TrackObject[];
  planes: CollisionPlane[];
  walls: CollisionWall[];
}
export function trackContact(
  chassis: ChassisState,
  wheels: Vector[],
  history: Vector[],
  before: WheelSuspension,
  track: TrackGeometry,
  previousCrash: number,
  previousSoundFlags: number,
  retainedWheelAngles?: number[],
  initialDistances?: number[],
  retainedSurfaces?: number[],
) {
  if (history.length !== 4)
    throw Error('Original four-wheel contact history is required');
  const rotation = chassis.rotation,
    orientation = rotateZXY(-rotation[2], -rotation[1], -rotation[0]);
  const inverted =
    chassis.allContact !== 0 && vecTransform([0, 30000, 0], orientation)[1] < 0;
  const invertedPull = inverted ? (chassis.roadSpeed > 7680 ? 192 : -192) : 0;
  const invertedOffset =
    invertedPull > 0
      ? vecTransform([0, -192, 0], orientation)
      : ([0, 0, 0] as Vector);
  const proposalState = {
    ...chassis,
    suspension: chassis.suspension.map((n) =>
      i16(n + (invertedPull < 0 ? invertedPull : 0)),
    ),
  };
  let origins = proposeWheels({ ...proposalState, roadSpeed: 0 }, wheels);
  let proposed = proposeWheels(proposalState, wheels);
  const scaledRoadSpeed = i16(
    Math.trunc(((chassis.roadSpeed & 65535) * 1408) / 15360),
  );
  const front = chassis.allContact
    ? Math.trunc(chassis.frontWheelAngle / 4)
    : 0;
  // File 0x7851 skips the stack-array writes at zero scaled movement.
  const wheelAngles = scaledRoadSpeed === 0 ? retainedWheelAngles :
    [0, 1, 2, 3].map(w => i16(chassis.wheelAngle - (w < 2 ? front : 0)));
  const suspension = {
    rc1: [...before.rc1],
    rc2: [...before.rc2],
    rc4: [...before.rc4],
    rc5: [...before.rc5],
  };
  const surfaces: number[] = retainedSurfaces?.slice() ?? [],
    distances: (number | undefined)[] = initialDistances?.slice() ?? Array(4);
  let soundFlags = previousSoundFlags,
    crash = previousCrash,
    wheelAngle = chassis.wheelAngle,
    roadSpeed = chassis.roadSpeed,
    speedStopped = false,
    passes = 0;
  const crashEvents: number[] = [];
  const crashImpacts: CrashImpact[] = [];
  function requestCrash(cause: number) {
    if (crash) return;
    crashEvents.push(cause);
    crashImpacts.push({cause:cause as CrashImpact["cause"],yaw:rotation[0],roadSpeed});
    crash = cause === 5 ? 1 : cause;
    if (cause === 5 || cause === 2) {
      roadSpeed = 0;
      speedStopped = true;
    }
  }
  for (;;) {
    passes++;
    if (passes === 5) {
      wheelAngle = 512;
      requestCrash(1);
      break;
    }
    let retry = false;
    for (let w = 0; w < 4; w++) {
      const contact = track.mode===2 ? {planeId:0,tileOrigin:[0,0,0] as Vector,surface:1,wall:-1,wallRotation:0,wallLower:0,wallUpper:0,underside:false,rotation:0} : trackPlaneContact(
        track.raw,
        track.objects,
        proposed[w],
        history[w].map((n) => n * 64) as Vector,
        track.mode??0,
      );
      const plane = track.planes[contact.planeId];
      if (!plane) throw Error(`Missing original plane ${contact.planeId}`);
      surfaces[w] = contact.surface;
      const distance = track.mode===2 ? i16(proposed[w][1]>>6) : planeDistance(
        proposed[w].map((n) => i16(n >> 6)) as Vector,
        plane,
        contact.tileOrigin,
      );
      if (contact.wall !== -1) {
        const wall = track.walls[contact.wall];
        if (!wall) throw Error(`Missing original wall ${contact.wall}`);
        const response = wallResponse({
          proposed,
          origins,
          previous: history[w],
          wheel: w,
          wall: placeWall(
            wall,
            contact.rotation,
            contact.wallRotation,
            contact.tileOrigin,
          ),
          distance,
          wallLower: contact.wallLower,
          wallUpper: contact.wallUpper,
          carRotation: rotation,
          roadSpeed,
          scaledRoadSpeed,
          wheelAngle,
          soundFlags,
        });
        if (response) {
          proposed = response.proposed;
          // At rest the wall correction is a separation, not forward travel.
          // Ground contact must start there too, or its zero-motion projection
          // restores the old origin inside the wall during this same retry.
          if (scaledRoadSpeed === 0) origins = proposed.map(p => [...p] as Vector);
          wheelAngle = response.wheelAngle;
          soundFlags = response.soundFlags;
          response.crashEvents.forEach(requestCrash);
          retry = true;
          break;
        }
      }
      const result = wheelPlaneContact({
        directHeight:track.mode===2,
        origin: origins[w],
        proposed: proposed[w],
        plane,
        groundPlane: track.planes[0],
        tileOrigin: contact.tileOrigin,
        carRotation: rotation,
        wheelAngle: wheelAngles?.[w],
        scaledRoadSpeed,
        fallSpeed: suspension.rc1[w],
        fallIncrement: w < 2 ? 21 : 15,
        surface: contact.surface,
        underside: contact.underside,
        invertedPull,
        invertedOffset,
        soundFlags,
      });
      proposed[w] = result.position;
      distances[w] = result.distance;
      surfaces[w] = result.surface;
      suspension.rc1[w] = result.fallSpeed;
      soundFlags = result.soundFlags;
      result.crashEvents.forEach(requestCrash);
    }
    if (!retry) break;
  }
  if (surfaces.every((s) => s === 5) && surfaces.length === 4) requestCrash(2);
  // Original BP-0x14..-0x0e is reused caller stack, not prior-frame distances.
  // Require the caller values if retries bypass all writes for a wheel.
  if (
    distances.some((d) => d === undefined) ||
    distances.filter((d) => d !== undefined).length !== 4
  )
    throw Error('Retry exhaustion requires original suspension-distance state');
  const wheelPositions = proposed.map(
    (p) => p.map((n) => i16(n >> 6)) as Vector,
  );
  const centres = proposed.map((p, w) => {
    const result = stepSuspension(
      {
        rc2: suspension.rc2[w],
        rc4: suspension.rc4[w],
        rc5: suspension.rc5[w],
      },
      distances[w]!,
    );
    suspension.rc2[w] = result.rc2;
    suspension.rc4[w] = result.rc4;
    suspension.rc5[w] = result.rc5;
    const height = i16(result.height + 384);
    const offset =
      rotation[1] || rotation[2]
        ? vecTransform([0, height, 0], orientation)
        : [0, height, 0];
    return p.map((n, a) => (n + offset[a]) | 0) as Vector;
  });
  return {
    centres,
    wheelPositions,
    suspension,
    surfaces,
    crash,
    soundFlags,
    wheelAngle,
    roadSpeed,
    speedStopped,
    crashEvents,
    crashImpacts,
    passes,
    contactWheelAngles: wheelAngles,
    contactOrigins: origins,
    contactFrontAngle: front,
  };
}
