import {adlibOperatorControl} from './adlib-operator-control.ts';
/** Register primitives reconstructed from the supplied AD15.DRV, not a MIDI approximation. */
export type RegisterWrite = [number, number];
const operators = [0, 1, 2, 8, 9, 10, 16, 17, 18];

/** Driver entry 0x24 (body 0x48c): unsigned 16-bit frequency to OPL f-number/block. */
export function adlibPitch(frequency: number): number {
  let value = (frequency & 0xffff) * 65536;
  let block = 0;
  while (Math.floor(value / 65536) > 0x185) {
    value = Math.floor(value / 2);
    block++;
  }
  // The original jumps back to JB after INC, preserving RCR's carry.
  // Replacing this edge branch with a single numeric threshold changes pitches.
  if (Math.floor(value / 65536) === 0x185) {
    while ((value & 65535) > 0xdcb0) {
      const carry = value & 1;
      value = Math.floor(value / 2);
      block++;
      if (carry) break;
    }
  }
  return (Math.floor(value / 50000) | (block << 10)) & 0xffff;
}

/** Driver entry 0x21: voice setup, followed by nonzero retained controller overrides. */
export function adlibInstrument(
  voice: readonly number[],
  channel = 0,
  timer?:ArrayLike<number>,
): RegisterWrite[] {
  if (
    voice.length < 100 ||
    channel < 0 ||
    channel > 8 ||
    !Number.isInteger(channel)
  ) {
    throw Error('Invalid original AdLib instrument');
  }
  const writes: RegisterWrite[] = [
    [0xc0 + channel, ((voice[0x45] << 1) | voice[0x44]) & 255],
  ];
  for (const [offset, operator] of [
    [0x46, operators[channel]],
    [0x52, operators[channel] + 3],
  ]) {
    const v = voice.slice(offset, offset + 12);
    writes.push(
      [
        0x20 + operator,
        ((v[10] << 7) | (v[9] << 6) | (v[8] << 5) | (v[7] << 4) | v[6]) & 255,
      ],
      [0x40 + operator, ((v[5] << 6) | v[4]) & 255],
      [0x60 + operator, ((v[0] << 4) | v[1]) & 255],
      [0x80 + operator, ((v[2] << 4) | v[3]) & 255],
      [0xe0 + operator, v[11]],
    );
  }
  if(timer)for(const [field,control] of [[0x29,0x16],[0x2b,0x17],[0x2c,0x18]])if(timer[field])writes.push(...adlibOperatorControl(voice,channel,voice[control],timer[field]));
  return writes;
}
