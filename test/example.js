import { sha256 } from '@noble/hashes/lib/sha256.js';
// function sha256(data: Uint8Array): Uint8Array;
const hash1 = sha256('abc');
const hash2 = sha256.init().update(Uint8Array.from([1, 2, 3])).digest();
import { sha512 } from '@noble/hashes/lib/sha512.js';
// function sha512(data: Uint8Array): Uint8Array;
const hash3 = sha512('abc');
const hash4 = sha512.init().update(Uint8Array.from([1, 2, 3])).digest();
import {
  sha3_224, sha3_256, sha3_384, sha3_512,
  keccak_224, keccak_256, keccak_384, keccak_512
} from '@noble/hashes/lib/sha3.js';
const hash5 = sha3_256('abc');
const hash6 = sha3_256.init().update(Uint8Array.from([1, 2, 3])).digest();
const hash7 = keccak_256('abc');
import { ripemd160 } from '@noble/hashes/lib/ripemd160.js';
// function ripemd160(data: Uint8Array): Uint8Array;
const hash8 = ripemd160('abc');
const hash9 = ripemd160().init().update(Uint8Array.from([1, 2, 3])).digest();
import { blake2b } from '@noble/hashes/lib/blake2b.js';
import { blake2s } from '@noble/hashes/lib/blake2s.js';
const hash10 = blake2s('abc');
const b2params = {key: new Uint8Array([1]), personalization: t, salt: t, dkLen: 32};
const hash11 = blake2s('abc', b2params);
const hash12 = blake2s.init(b2params).update(Uint8Array.from([1, 2, 3])).digest();
import { hmac } from '@noble/hashes/lib/mac.js';
import { sha256 } from '@noble/hashes/lib/sha256.js';
const mac1 = hmac(sha256, 'key', 'message');
const mac2 = hmac.init(sha256, Uint8Array.from([1, 2, 3])).update(Uint8Array.from([4, 5, 6])).digest();

import { hkdf } from '@noble/hashes/lib/kdf.js';
import { sha256 } from '@noble/hashes/lib/sha256.js';
import { randomBytes } from '@noble/hashes/utils.js';
const inputKey = randomBytes(32);
const salt = randomBytes(32);
const info = 'abc';
const dkLen = 32;
const hk1 = hkdf(sha256, inputKey, salt, info, dkLen);

// == same as
import { hkdf_extract, hkdf_expand } from '@noble/hashes/lib/kdf.js';
import { sha256 } from '@noble/hashes/lib/sha256.js';
const prk = hkdf_extract(sha256, inputKey, salt)
const hk2 = hkdf_expand(sha256, prk, info, dkLen);
import { pbkdf2, pbkdf2Async } from '@noble/hashes/lib/kdf.js';
import { sha256 } from '@noble/hashes/lib/sha256.js';
const pbkey1 = pbkdf2(sha256, 'password', 'salt', { c: 32, dkLen: 32 });
const pbkey2 = await pbkdf2Async(sha256, 'password', 'salt', { c: 32, dkLen: 32 });
const pbkey3 = await pbkdf2Async(
  sha256, Uint8Array.from([1, 2, 3]), Uint8Array.from([4, 5, 6]), { c: 32, dkLen: 32 }
);
import { scrypt, scryptAsync } from '@noble/hashes/lib/scrypt.js';
const scr1 = scrypt('password', 'salt', { N: 2 ** 16, r: 8, p: 1, dkLen: 32 });
const scr2 = await scryptAsync('password', 'salt', { N: 2 ** 16, r: 8, p: 1, dkLen: 32 });
const scr3 = await scryptAsync(
  Uint8Array.from([1, 2, 3]), Uint8Array.from([4, 5, 6]),
  {
    N: 2 ** 22,
    r: 8,
    p: 1,
    dkLen: 32,
    onProgress(percentage) { console.log('progress', percentage); },
    maxmem: 2 ** 32 + (128 * 8 * 1) // N * r * p * 128 + (128*r*p)
  }
);
