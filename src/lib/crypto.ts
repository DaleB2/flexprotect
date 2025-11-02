function utf8Bytes(input: string): number[] {
  const str = input ?? "";
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      i++;
      const surrogate = str.charCodeAt(i);
      const combined = 0x10000 + (((code & 0x3ff) << 10) | (surrogate & 0x3ff));
      bytes.push(0xf0 | (combined >> 18));
      bytes.push(0x80 | ((combined >> 12) & 0x3f));
      bytes.push(0x80 | ((combined >> 6) & 0x3f));
      bytes.push(0x80 | (combined & 0x3f));
    }
  }
  return bytes;
}

function rotateLeft(value: number, shift: number) {
  return (value << shift) | (value >>> (32 - shift));
}

export function sha1HexUpper(input: string): string {
  const bytes = utf8Bytes(input);
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      ((bytes[i] ?? 0) << 24) |
        ((bytes[i + 1] ?? 0) << 16) |
        ((bytes[i + 2] ?? 0) << 8) |
        (bytes[i + 3] ?? 0)
    );
  }

  const bitLength = bytes.length * 8;
  const remainder = bytes.length % 4;
  let paddingWord = 0x80 << ((3 - remainder) * 8);
  if (remainder === 0) {
    words.push(0x80000000);
  } else {
    let lastWord = words.pop() ?? 0;
    const shift = (3 - remainder) * 8;
    lastWord |= paddingWord;
    words.push(lastWord);
  }

  while ((words.length % 16) !== 14) {
    words.push(0);
  }
  words.push(Math.floor(bitLength / 0x100000000));
  words.push(bitLength & 0xffffffff);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Array<number>(80);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t] ?? 0;
    }
    for (let t = 16; t < 80; t++) {
      w[t] = rotateLeft(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t++) {
      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotateLeft(a, 5) + f + e + k + w[t]) & 0xffffffff;
      e = d;
      d = c;
      c = rotateLeft(b, 30) & 0xffffffff;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) & 0xffffffff;
    h1 = (h1 + b) & 0xffffffff;
    h2 = (h2 + c) & 0xffffffff;
    h3 = (h3 + d) & 0xffffffff;
    h4 = (h4 + e) & 0xffffffff;
  }

  const result = [h0, h1, h2, h3, h4]
    .map((value) => ((value >>> 0).toString(16).padStart(8, "0")))
    .join("")
    .toUpperCase();

  return result;
}
