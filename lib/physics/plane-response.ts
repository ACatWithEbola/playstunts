/** Original update_player_state motion response after plane-local conversion.
 * This reconstructs the movement/correction block, not track-plane selection,
 * wall collisions, suspension, or crash-state transitions.
 */
import { i16, vecTransform, type Vector } from './math.ts';
import { planeDistance, planeMovement, type CollisionPlane } from './plane.ts';
import { splitPlaneCrossing } from './plane-crossing.ts';

export interface PlaneResponseInput {
  origin: Vector;
  proposed: Vector;
  localOrigin: Vector;
  localProposed: Vector;
  plane: CollisionPlane;
  tileOrigin: Vector;
  carRotation: Vector;
  wheelAngle: number;
  fallSpeed: number;
  scaledRoadSpeed: number;
  /** Set by the caller's original underside-crash branch. */
  undersideCrash: boolean;
}

export function planeResponse(s: PlaneResponseInput): Vector {
  const motion = (distance: number) => planeMovement(distance, s.wheelAngle, s.carRotation, s.plane);
  // Original local-Y zero branch backs up one world unit along the plane.
  // It bypasses the subsequent penetration correction.
  if (s.localProposed[1] === 0) {
    const back = motion(64);
    return s.proposed.map((n, axis) => (n - back[axis]) | 0) as Vector;
  }
  let position: Vector;
  if (s.localOrigin[1] > 0 && s.localProposed[1] < 0) {
    const split = splitPlaneCrossing(s.origin, s.proposed, s.localOrigin, s.localProposed, s.fallSpeed, s.scaledRoadSpeed);
    const along = motion(split.remainingDistance);
    position = s.origin.map((n, axis) => (n + split.approach[axis] + along[axis]) | 0) as Vector;
  } else {
    const along = motion(s.scaledRoadSpeed);
    position = s.origin.map((n, axis) => (n + along[axis]) | 0) as Vector;
  }
  let distance = planeDistance(position.map(n => i16(n >> 6)) as Vector, s.plane, s.tileOrigin);
  if (distance < 0) {
    if (s.undersideCrash) distance = i16(-distance + 6);
    const correction = vecTransform([0, i16(-distance << 6), 0], s.plane.rotation);
    position = position.map((n, axis) => (n + correction[axis]) | 0) as Vector;
  }
  return position;
}
