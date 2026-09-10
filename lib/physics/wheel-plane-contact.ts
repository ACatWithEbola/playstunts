/** Supplied executable's per-wheel surface path, after wall processing.
 * Crash event requests are returned for the caller to process. This does not
 * implement their global side effects or the wall-driven four-wheel retry.
 */
import { i16, vecTransform, type Vector } from './math.ts';
import { transpose } from './rotation.ts';
import { planeDistance, type CollisionPlane } from './plane.ts';
import { planeResponse } from './plane-response.ts';
export interface WheelPlaneInput {
  directHeight?: boolean;
  origin: Vector;
  proposed: Vector;
  plane: CollisionPlane;
  groundPlane: CollisionPlane;
  tileOrigin: Vector;
  carRotation: Vector;
  wheelAngle: number | undefined;
  scaledRoadSpeed: number;
  fallSpeed: number;
  fallIncrement: number;
  surface: number;
  underside: boolean;
  invertedPull: number;
  invertedOffset: Vector;
  soundFlags: number;
}
export function wheelPlaneContact(s: WheelPlaneInput) {
  let position = [...s.proposed] as Vector,
    plane = s.plane,
    fallSpeed = s.fallSpeed,
    surface = s.surface,
    underside = s.underside,
    soundFlags = s.soundFlags;
  const crashEvents: number[] = [];
  const distanceToPlane = () => s.directHeight ? i16(position[1]>>6) :
    planeDistance(
      position.map((n) => i16(n >> 6)) as Vector,
      plane,
      s.tileOrigin,
    );
  let distance = distanceToPlane();
  for (;;) {
    if (distance > 0) {
      if (s.invertedPull > 0 && distance < 24) {
        position = position.map(
          (n, a) => (n + s.invertedOffset[a]) | 0,
        ) as Vector;
      } else {
        // This executable adds the initialized per-wheel table value once.
        fallSpeed = i16(fallSpeed + s.fallIncrement);
        position[1] = (position[1] - fallSpeed) | 0;
        distance = distanceToPlane();
        if (distance > 12) surface = 0;
      }
    }
    // The original stores this distance for suspension before moving the point.
    if (distance > 0)
      return {
        position,
        distance,
        fallSpeed,
        surface,
        planeId: plane.id,
        underside,
        soundFlags,
        crashEvents,
      };
    if (distance < 0) {
      const inverse = transpose(plane.rotation);
      const local = (v: Vector) =>
        vecTransform(
          v.map((n, a) =>
            i16((n >> 6) - plane.origin[a] - s.tileOrigin[a]),
          ) as Vector,
          inverse,
        );
      const localOrigin = local(s.origin),
        localProposed = local(position);
      let undersideCrash = false;
      if (!underside && localOrigin[1] < -12 && localProposed[1] < -12) {
        if (localProposed[1] <= -24) {
          plane = s.groundPlane;
          underside = true;
          distance = distanceToPlane();
          continue;
        }
        crashEvents.push(5);
        undersideCrash = true;
      }
      if (s.wheelAngle === undefined) throw Error("Plane response requires original retained wheel-angle state");
      position = planeResponse({
        origin: s.origin,
        proposed: position,
        localOrigin,
        localProposed,
        plane,
        tileOrigin: s.tileOrigin,
        carRotation: s.carRotation,
        wheelAngle: s.wheelAngle,
        fallSpeed,
        scaledRoadSpeed: s.scaledRoadSpeed,
        undersideCrash,
      });
    }
    // Version-specific constants from the supplied executable, not Restunts C.
    if (fallSpeed > 190) soundFlags |= 0x20;
    if (fallSpeed > 931) crashEvents.push(1);
    fallSpeed = 0;
    return {
      position,
      distance,
      fallSpeed,
      surface,
      planeId: plane.id,
      underside,
      soundFlags,
      crashEvents,
    };
  }
}
