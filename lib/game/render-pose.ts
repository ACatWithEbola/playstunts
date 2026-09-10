import type { Vector } from '../physics/math.ts';
export interface RenderPose {
  position: Vector;
  rotation: Vector;
}

/** Display-only interpolation. Original positions are 1/64 world unit and angles wrap at 1024. */
export function interpolatePose(
  before: RenderPose,
  after: RenderPose,
  fraction: number,
): RenderPose {
  const t = Math.max(0, Math.min(1, fraction));
  return {
    position: before.position.map(
      (n, i) => n + (after.position[i] - n) * t,
    ) as Vector,
    rotation: before.rotation.map((n, i) => {
      const delta =
        ((((after.rotation[i] - n + 512) % 1024) + 1024) % 1024) - 512;
      return n + delta * t;
    }) as Vector,
  };
}
