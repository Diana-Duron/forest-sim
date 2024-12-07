const width = 256;        // each RC4 output is 0 <= x < 256
const chunks = 6;         // at least six RC4 outputs for each double
const digits = 52;        // there are 52 significant digits in a double
const rngname = 'random'; // rngname: name for Math.random and Math.seedrandom
const startdenom = Math.pow(width, chunks);
const significance = Math.pow(2, digits);
const overflow = significance * 2;
const mask = width - 1;

let nodecrypto; // node.js crypto module, initialized if available

function seedrandom(seed, options = {}, callback) {
  const key = [];
  options = options === true ? { entropy: true } : options;

  const shortseed = mixkey(flatten(
    options.entropy ? [seed, tostring([])] :
    (seed == null) ? autoseed() : seed, 3), key);

  const arc4 = new ARC4(key);

  const prng = function() {
    let n = arc4.g(chunks), d = startdenom, x = 0;
    while (n < significance) {
      n = (n + x) * width;
      d *= width;
      x = arc4.g(1);
    }
    while (n >= overflow) {
      n /= 2;
      d /= 2;
      x >>>= 1;
    }
    return (n + x) / d;
  };

  prng.int32 = function() { return arc4.g(4) | 0; };
  prng.quick = function() { return arc4.g(4) / 0x100000000; };
  prng.double = prng;

  mixkey(tostring(arc4.S), []);

  return (options.pass || callback || ((prng, seed, isMathCall, state) => {
    if (state) {
      if (state.S) copy(state, arc4);
      prng.state = () => copy(arc4, {});
    }
    if (isMathCall) {
      Math[rngname] = prng;
      return seed;
    } else {
      return prng;
    }
  }))(prng, shortseed, options.global || false, options.state);
}

function ARC4(key) {
  let t, keylen = key.length,
      i = 0, j = this.i = this.j = 0, s = this.S = [];

  if (!keylen) key = [keylen++];

  while (i < width) s[i] = i++;
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  this.g = function(count) {
    let t, r = 0, i = this.i, j = this.j, s = this.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    this.i = i;
    this.j = j;
    return r;
  };

  this.g(width); // Discard the first batch for robust unpredictability
}

function copy(f, t) {
  t.i = f.i;
  t.j = f.j;
  t.S = f.S.slice();
  return t;
}

function flatten(obj, depth) {
  const result = [];
  if (depth && typeof obj === 'object') {
    for (const prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return result.length ? result : typeof obj === 'string' ? obj : obj + '\0';
}

function mixkey(seed, key) {
  let stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

function autoseed() {
  try {
    if (nodecrypto) {
      return tostring(nodecrypto.randomBytes(width));
    } else {
      const out = new Uint8Array(width);
      (globalThis.crypto || globalThis.msCrypto).getRandomValues(out);
      return tostring(out);
    }
  } catch (e) {
    return [+new Date, globalThis.navigator, globalThis.screen, tostring([])];
  }
}

function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

try {
  nodecrypto = require('crypto');
} catch (e) {}

export default seedrandom;
