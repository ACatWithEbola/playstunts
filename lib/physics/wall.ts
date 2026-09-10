/** build_track_object wall finalization from the supplied executable. */
import { i16, type Vector } from './math.ts';
export interface CollisionWall {
  id: number;
  orientation: number;
  origin: [number, number];
}
export function placeWall(
  wall: CollisionWall,
  rotation: number,
  adjustment: number,
  tileOrigin: Vector,
) {
  let [x, z] = wall.origin;
  if (rotation === 256) [x, z] = [z, i16(-x)];
  else if (rotation === 512) [x, z] = [i16(-x), i16(-z)];
  else if (rotation === 768) [x, z] = [i16(-z), x];
  else if (rotation !== 0)
    throw Error('Original track wall rotation must be a quarter turn');
  return {
    orientation: (-wall.orientation + rotation + adjustment) & 1023,
    origin: [i16(x + tileOrigin[0]), i16(z + tileOrigin[2])] as [
      number,
      number,
    ],
  };
}
