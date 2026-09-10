/** Original-format verification course used by work/ramp-oracle.py. */
export function rampCircuit(): number[] {
  const raw = Array<number>(1802).fill(0);
  for (let row = 0; row < 30; row++) raw[row * 30 + 7] = 4;
  raw[7 * 30 + 7] = 38;
  raw[8 * 30 + 7] = 34;
  raw[9 * 30 + 7] = 39;
  return raw;
}
