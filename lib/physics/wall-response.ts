/** Original wall crossing and four-wheel repositioning, before contact retry.
 * Returns a crash request; the caller owns original global crash side effects.
 */
import { i16, u16, intHypot3d, vecTransform, type Vector } from './math.ts';
import { rotateY, rotateZXY } from './rotation.ts';
import { intersectZ } from './intersection.ts';
export interface WallResponseInput {
  proposed: Vector[];
  origins: Vector[];
  previous: Vector;
  wheel: number;
  wall: { orientation: number; origin: [number, number] };
  distance: number;
  wallLower: number;
  wallUpper: number;
  carRotation: Vector;
  roadSpeed: number;
  scaledRoadSpeed: number;
  wheelAngle: number;
  soundFlags: number;
}
export function wallResponse(s: WallResponseInput) {
  if (s.distance <= s.wallLower || s.distance >= s.wallUpper) return null;
  const matrix = rotateY(i16(-s.wall.orientation - 256));
  const local = (p: Vector) =>
    vecTransform(
      [i16(p[0] - s.wall.origin[0]), 0, i16(p[2] - s.wall.origin[1])],
      matrix,
    );
  let first = local(s.proposed[s.wheel].map((n) => i16(n >> 6)) as Vector),
    second = local(s.previous);
  if ((first[2] > 0 && second[2] > 0) || (first[2] < 0 && second[2] < 0))
    return null;
  const reversed = first[2] > second[2];
  if (reversed) [first, second] = [second, first];
  let remaining: number, approach: number;
  if (first[2] === 0) {
    approach = s.scaledRoadSpeed;
    remaining = 0;
  } else if (second[2] === 0) {
    approach = 0;
    remaining = s.scaledRoadSpeed;
  } else {
    const crossing = intersectZ(first, second, 0);
    remaining = intHypot3d(
      first.map((n, a) => i16((n - crossing[a]) << 6)) as Vector,
    );
    approach = i16(s.scaledRoadSpeed - remaining);
  }
  const [yaw, pitch, roll] = s.carRotation;
  const relative = (-yaw - s.wall.orientation) & 1023;
  const heading =
    relative < 256 || relative > 768
      ? s.wall.orientation
      : (s.wall.orientation + 512) & 1023;
  let side = relative < 256 || relative > 768 ? 768 : -768;
  if (reversed) side = -side;
  const offset = vecTransform(
    [side, 0, remaining],
    rotateZXY(-roll, -pitch, heading),
  );
  let impactAngle = (-yaw - heading) & 1023;
  const reverseCrash = impactAngle > 256;
  if (reverseCrash) impactAngle = 1024 - impactAngle;
  const crashThreshold = u16(
    (100 - Math.trunc(i16(impactAngle * 70) / 256)) << 8,
  );
  const crash = u16(s.roadSpeed) > crashThreshold;
  const wheelAngle = crash
    ? i16((reverseCrash ? -impactAngle : impactAngle) << 1)
    : s.wheelAngle;
  if (approach !== 0 && s.scaledRoadSpeed === 0)
    throw Error('Original wall-response division by zero');
  const proposed = s.proposed.map(
    (p, w) =>
      p.map((n, a) => {
        const fraction =
          approach === 0
            ? 0
            : i16(
                Math.trunc(
                  Math.imul((n - s.origins[w][a]) | 0, approach) /
                    s.scaledRoadSpeed,
                ),
              );
        return (s.origins[w][a] + i16(fraction + offset[a])) | 0;
      }) as Vector,
  );
  return {
    proposed,
    wheelAngle,
    soundFlags: s.soundFlags | 0x10,
    crashEvents: crash ? [1] : [],
  };
}
