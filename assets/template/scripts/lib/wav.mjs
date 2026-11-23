// Minimal WAV reader/writer. Internally everything is mono Float32 at one sample rate.
import fs from "node:fs";

export function readWav(path) {
  const b = fs.readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`${path}: not a RIFF/WAVE file`);
  }
  let fmt = null;
  let data = null;
  for (let p = 12; p + 8 <= b.length; ) {
    const id = b.toString("ascii", p, p + 4);
    const size = b.readUInt32LE(p + 4);
    const body = p + 8;
    if (id === "fmt ") {
      let format = b.readUInt16LE(body);
      if (format === 0xfffe) format = b.readUInt16LE(body + 24); // WAVE_FORMAT_EXTENSIBLE
      fmt = {
        format,
        channels: b.readUInt16LE(body + 2),
        sampleRate: b.readUInt32LE(body + 4),
        bits: b.readUInt16LE(body + 14),
      };
    } else if (id === "data") {
      data = b.subarray(body, Math.min(body + size, b.length));
    }
    p = body + size + (size % 2);
  }
  if (!fmt || !data) throw new Error(`${path}: missing fmt or data chunk`);
  const { format, channels, bits } = fmt;
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < channels; c++) {
      const o = (i * channels + c) * bytes;
      if (format === 3 && bits === 32) s += data.readFloatLE(o);
      else if (format === 1 && bits === 16) s += data.readInt16LE(o) / 32768;
      else if (format === 1 && bits === 24) s += data.readIntLE(o, 3) / 8388608;
      else if (format === 1 && bits === 32) s += data.readInt32LE(o) / 2147483648;
      else throw new Error(`${path}: unsupported WAV format ${format}/${bits}-bit`);
    }
    out[i] = s / channels;
  }
  return { sampleRate: fmt.sampleRate, data: out };
}

export function writeWav(path, samples, sampleRate) {
  const n = samples.length;
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0, "ascii");
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVE", 8, "ascii");
  b.write("fmt ", 12, "ascii");
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(sampleRate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36, "ascii");
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    b.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path, b);
}
