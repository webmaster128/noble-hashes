import { assertNumber, Hash, Input, toBytes, u32 } from './utils';
// prettier-ignore
export const SIGMA = new Uint8Array([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
  11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
  7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
  9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
  2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
  12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
  13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
  6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
  10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
  // For BLAKE2b, the two extra permutations for rounds 10 and 11 are SIGMA[10..11] = SIGMA[0..1].
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
]);

export type BlakeOpts = {
  dkLen?: number;
  key?: Input;
  salt?: Input;
  personalization?: Input;
};

export abstract class BLAKE2<T extends BLAKE2<T>> extends Hash<T> {
  protected abstract compress(msg: Uint32Array, offset: number, isLast: boolean): void;
  protected abstract get(): number[];
  protected abstract set(...args: number[]): void;
  abstract destroy(): void;
  protected buffer: Uint8Array;
  protected buffer32: Uint32Array;
  protected length: number = 0;
  protected pos: number = 0;
  protected finished = false;
  protected destroyed = false;

  constructor(
    readonly blockLen: number,
    public outputLen: number,
    opts: BlakeOpts = {},
    keyLen: number,
    saltLen: number,
    persLen: number
  ) {
    super();
    assertNumber(blockLen);
    assertNumber(outputLen);
    assertNumber(keyLen);
    if (outputLen < 0 || outputLen > keyLen)
      throw new Error('Blake2: outputLen bigger than keyLen');
    if (opts.key !== undefined && (opts.key.length < 1 || opts.key.length > keyLen))
      throw new Error(`Key should be up 1..${keyLen} byte long or undefined`);
    if (opts.salt !== undefined && opts.salt.length !== saltLen)
      throw new Error(`Salt should be ${saltLen} byte long or undefined`);
    if (opts.personalization !== undefined && opts.personalization.length !== persLen)
      throw new Error(`Personalization should be ${persLen} byte long or undefined`);
    this.buffer32 = u32((this.buffer = new Uint8Array(blockLen)));
  }
  update(data: Input) {
    if (this.destroyed) throw new Error('instance is destroyed');
    // Main difference with other hashes: there is flag for last block,
    // so we cannot process current block before we know that there
    // is the next one. This significantly complicates logic and reduces ability
    // to do zero-copy processing
    const { finished, blockLen, buffer, buffer32 } = this;
    if (finished) throw new Error('digest() was already called');
    data = toBytes(data);
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      // If buffer is full and we still have input (don't process last block, same as blake2s)
      if (this.pos === blockLen) {
        this.compress(buffer32, 0, false);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = data.byteOffset + pos;
      // full block && aligned to 4 bytes && not last in input
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(data.buffer, dataOffset, Math.floor((len - pos) / 4));
        for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out: Uint8Array) {
    if (this.destroyed) throw new Error('instance is destroyed');
    if (!(out instanceof Uint8Array) || out.length < this.outputLen)
      throw new Error('_Blake2: Invalid output buffer');
    const { finished, pos, buffer32 } = this;
    if (finished) throw new Error('digest() was already called');
    this.finished = true;
    // Padding
    this.buffer.subarray(pos).fill(0);
    this.compress(buffer32, 0, true);
    const out32 = u32(out);
    this.get().forEach((v, i) => (out32[i] = v));
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to?: T): T {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to ||= new (this.constructor as any)({ dkLen: outputLen }) as T;
    to.set(...this.get());
    to.length = length;
    to.finished = finished;
    to.destroyed = destroyed;
    to.outputLen = outputLen;
    to.buffer.set(buffer);
    to.pos = pos;
    return to;
  }
}
