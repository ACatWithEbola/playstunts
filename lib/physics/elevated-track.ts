/** Original build_track_object branches for ramps and straight elevated roads.
 * Coordinates have already been translated and rotated into the tile frame.
 * Plane IDs here are canonical groups; the caller applies tile orientation.
 */
import {i16,intSin,intCos,intHypot,intAtan2,type Vector} from './math.ts';
export interface ElevatedSelection {
  planeGroup: number;
  surface: number;
  wall: number;
  wallRotation: number;
  wallLower: number;
  wallUpper: number;
  underside: boolean;
}
export function elevatedTrackSelection(
  physics: number,
  point: Vector,
  previous: Vector,
  roadSurface: number,
): ElevatedSelection {
  const [x, y, z] = point,
    [oldX, , oldZ] = previous;
  const out: ElevatedSelection = {
    planeGroup: 0,
    surface: 4,
    wall: -1,
    wallRotation: 0,
    wallLower: -1000,
    wallUpper: -12,
    underside: true,
  };
  const side = (coordinate: number) => {
    out.wall = coordinate < 0 ? 100 : 101;
  };
  if (physics === 21 || physics === 26) {
    if (physics === 21 && y <= 390) return out;
    const offsetX=i16(x+1024),offsetZ=i16(z+1024);
    const radius=i16(intHypot(offsetX,offsetZ)-1536);
    if (physics === 21 ? radius<=-150 || radius>=150 : radius<=-120 || radius>=126) return out;
    out.surface=roadSurface;
    const section=()=>17-(((intAtan2(offsetX,offsetZ)&255)*18)>>8);
    if(physics===21){
      out.planeGroup=2;out.underside=false;
      if(radius>=-108 && radius<=108)return out;
      out.wallUpper=42;out.wallLower=-12;
      out.wall=section()+(radius<0?105:123);
    }else{
      const segment=section();out.planeGroup=segment+7;
      if(radius<=102)return out;
      out.wallRotation=512;out.wall=segment+123;out.underside=false;
    }
    return out;
  }
  if (physics === 23 || physics === 24) {
    if (Math.abs(x) > 120) return out;
    const left = physics === 24, base = left ? 35 : 25, angle = left ? -672 : 160;
    if (left ? oldX <= -120 : oldX >= 120) {
      out.wallRotation = 512;
      out.wall = left ? 100 : 101;
    }
    out.surface = roadSurface;
    if (z < -334) {out.planeGroup = base; return out;}
    if (z >= 334) {out.planeGroup = base + 9; return out;}
    const section = z < -168 ? 0 : z < 0 ? 1 : z < 168 ? 2 : 3;
    const center = [-251,-84,84,251][section];
    const multiply = (a:number,b:number) => i16((Math.imul(i16(a),i16(b)) + 8192) >> 14);
    const side = i16(multiply(intSin(angle),i16(z-center)) + multiply(intCos(angle),x));
    out.planeGroup = base + section*2 + 1 + (side > 0 ? 1 : 0);
    return out;
  }
  if (physics === 25) {
    if (Math.abs(x) > 120) return out;
    out.surface = roadSurface;
    out.planeGroup = 6;
    if (oldX >= 120) {
      out.wallRotation = 512;
      out.wall = 101;
    }
    return out;
  }
  if (physics === 16 || physics === 17) {
    if (physics === 16) {
      if (z > 0) out.underside = false;
      else if (oldZ >= 0) out.wall = 102;
    } else if (oldZ >= 476) out.wall = 103;
    if (Math.abs(oldX) < 120) {
      out.planeGroup = 3;
      out.surface = roadSurface;
      if (out.wall !== -1 || z < 0 || Math.abs(x) < 120) return out;
      out.wallUpper = 42;
      out.wallLower = -12;
      side(x);
    } else {
      if (!out.underside || Math.abs(x) > 120) return out;
      out.planeGroup = 3;
      if (out.wall !== -1) return out;
      out.wallRotation = 512;
      side(x);
    }
    return out;
  }
  if (physics === 22 && y <= 390) {
    if (Math.abs(z) <= 120) out.surface = roadSurface;
    return out;
  }
  if (physics === 18 || physics === 19) {
    if (y <= 390) return out;
    out.underside = false;
  } else if (physics === 22) out.underside = false;
  else if (physics !== 20)
    throw Error(`Elevated physics ${physics} has not been reconstructed`);
  if (Math.abs(oldX) <= 120) {
    out.planeGroup = 2;
    out.surface = roadSurface;
    if (out.underside) {
      if (oldZ >= 476) out.wall = 103;
      else if (oldZ <= -476) out.wall = 104;
    }
    if (Math.abs(x) < 120) return out;
    out.wallUpper = 42;
    side(x);
  } else {
    if (!out.underside || Math.abs(x) > 120) return out;
    out.planeGroup = 2;
    out.wallUpper = 42;
    out.wallRotation = 512;
    side(oldX);
  }
  return out;
}
