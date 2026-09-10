/** update_player_state loc_15A30: split motion at a collision-plane crossing.
 * Inputs are already transformed to plane-local coordinates. This is only
 * the positive-to-negative crossing branch, not a complete contact resolver.
 * Long positions use 1/64 world units; local vectors use world units.
 */
import { i16, intHypot3d, type Vector } from './math.ts';
import { intersectZ } from './intersection.ts';

export function splitPlaneCrossing(
  origin: Vector,
  proposed: Vector,
  localOrigin: Vector,
  localProposed: Vector,
  fallSpeed: number,
  scaledRoadSpeed: number,
): { approach: Vector; remainingDistance: number } {
  if (localOrigin[1] <= 0 || localProposed[1] >= 0) {
    throw new Error('Plane crossing requires an above-to-below segment');
  }
  // The recovered intersection routine works on Z, so swap Y/Z and negate Y.
  const swap = (v: Vector): Vector => [v[0], v[2], i16(-v[1])];
  const end = swap(localProposed);
  const intersection = intersectZ(end, swap(localOrigin), 0);
  const remainder = end.map((n, axis) => i16((n - intersection[axis]) << 6)) as Vector;
  const remainingDistance = intHypot3d(remainder);
  const total = i16(fallSpeed + scaledRoadSpeed);
  if (total === 0) throw new Error('Original plane-crossing division by zero');
  const numerator = i16(total - remainingDistance);
  const approach = proposed.map((n, axis) => {
    // Original signed long multiplication wraps before division; storing the
    // quotient into a VECTOR then truncates to a signed 16-bit component.
    const product = Math.imul((n - origin[axis]) | 0, numerator);
    return i16(Math.trunc(product / total));
  }) as Vector;
  return { approach, remainingDistance };
}
