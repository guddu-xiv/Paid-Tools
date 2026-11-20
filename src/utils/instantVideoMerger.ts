import {
  inspectMpegTsFile,
  isMpegTsFile,
  remuxTsFileToMp4,
  TsCodecHint,
} from './mpegTsRemuxer';

export interface VideoClipInfo {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  durationSec: number;
  width: number;
  height: number;
  videoCodec: string;
  hasAudio: boolean;
}

export interface MergeProgressInfo {
  phase: 'remuxing-ts' | 'merging-mp4' | 'completed';
  overallPercent: number;
  processedBytes: number;
  totalBytes: number;
  currentClipIndex: number;
  totalClips: number;
  currentClipName: string;
  currentClipPercent: number;
  tsConvertedCount: number;
  tsTotalCount: number;
  clipProgressByIndex: Record<number, number>;
}

export interface InstantMergeResult {
  blob: Blob;
  url: string;
  totalDurationSec: number;
  originalDurationSec: number;
  clipDurationsSec?: number[];
  speedMultiplier: number;
  totalSizeBytes: number;
  elapsedMs: number;
  clipCount: number;
  tsRemuxedCount: number;
  method: 'iso-bmff-instant' | 'blob-concat';
}

interface BoxHeader {
  type: string;
  offset: number;
  size: number;
  headerSize: number;
  contentOffset: number;
  contentSize: number;
}

interface SttsEntry {
  sampleCount: number;
  sampleDelta: number;
}

interface CttsEntry {
  sampleCount: number;
  sampleOffset: number;
}

interface StscEntry {
  firstChunk: number;
  samplesPerChunk: number;
  sampleDescriptionIndex: number;
}

interface ParsedTrack {
  handlerType: 'vide' | 'soun' | string;
  trackId: number;
  timescale: number;
  duration: number;
  width: number;
  height: number;
  rawTrakBytes: Uint8Array;
  stsdEntries: Uint8Array[];
  stts: SttsEntry[];
  stss: Uint32Array | null;
  ctts: CttsEntry[] | null;
  stsc: StscEntry[];
  stszUniformSize: number;
  stszSampleCount: number;
  stszSampleSizes: Uint32Array;
  chunkOffsets: Float64Array;
}

interface ParsedMp4File {
  file: File;
  fileSize: number;
  ftypBytes: Uint8Array | null;
  mvhdTimescale: number;
  rawMoovBytes: Uint8Array;
  tracks: ParsedTrack[];
}

function readFourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

function writeFourCC(view: DataView, offset: number, fourcc: string) {
  for (let i = 0; i < 4; i++) {
    view.setUint8(offset + i, fourcc.charCodeAt(i) || 0x20);
  }
}

function parseBoxesInBuffer(
  buf: Uint8Array,
  startOffset = 0,
  endOffset = buf.byteLength
): BoxHeader[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const boxes: BoxHeader[] = [];
  let pos = startOffset;

  while (pos + 8 <= endOffset) {
    let size = view.getUint32(pos);
    const type = readFourCC(view, pos + 4);
    let headerSize = 8;

    if (size === 1) {
      if (pos + 16 > endOffset) break;
      const hi = view.getUint32(pos + 8);
      const lo = view.getUint32(pos + 12);
      size = hi * 4294967296 + lo;
      headerSize = 16;
    } else if (size === 0) {
      size = endOffset - pos;
    }

    if (size < headerSize || pos + size > endOffset) {
      break;
    }

    boxes.push({
      type,
      offset: pos,
      size,
      headerSize,
      contentOffset: pos + headerSize,
      contentSize: size - headerSize,
    });

    pos += size;
  }

  return boxes;
}

function makeBox(type: string, payload: Uint8Array): Uint8Array {
  const total = 8 + payload.byteLength;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, total >>> 0);
  writeFourCC(view, 4, type);
  out.set(payload, 8);
  return out;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((acc, a) => acc + a.byteLength, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.byteLength;
  }
  return out;
}

function areUint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function parseTrackBox(trakBytes: Uint8Array): ParsedTrack | null {
  const view = new DataView(
    trakBytes.buffer,
    trakBytes.byteOffset,
    trakBytes.byteLength
  );
  const topBoxes = parseBoxesInBuffer(trakBytes, 8, trakBytes.byteLength);

  let trackId = 1;
  let width = 0;
  let height = 0;
  let handlerType = '';
  let timescale = 0;
  let duration = 0;

  const tkhdBox = topBoxes.find((b) => b.type === 'tkhd');
  if (tkhdBox) {
    const version = view.getUint8(tkhdBox.contentOffset);
    if (version === 1) {
      trackId = view.getUint32(tkhdBox.contentOffset + 20);
      width = view.getUint32(tkhdBox.contentOffset + 88) >>> 16;
      height = view.getUint32(tkhdBox.contentOffset + 92) >>> 16;
    } else {
      trackId = view.getUint32(tkhdBox.contentOffset + 12);
      width = view.getUint32(tkhdBox.contentOffset + 76) >>> 16;
      height = view.getUint32(tkhdBox.contentOffset + 80) >>> 16;
    }
  }

  const mdiaBox = topBoxes.find((b) => b.type === 'mdia');
  if (!mdiaBox) return null;

  const mdiaBoxes = parseBoxesInBuffer(
    trakBytes,
    mdiaBox.contentOffset,
    mdiaBox.offset + mdiaBox.size
  );

  const mdhdBox = mdiaBoxes.find((b) => b.type === 'mdhd');
  if (mdhdBox) {
    const version = view.getUint8(mdhdBox.contentOffset);
    if (version === 1) {
      timescale = view.getUint32(mdhdBox.contentOffset + 20);
      const hi = view.getUint32(mdhdBox.contentOffset + 24);
      const lo = view.getUint32(mdhdBox.contentOffset + 28);
      duration = hi * 4294967296 + lo;
    } else {
      timescale = view.getUint32(mdhdBox.contentOffset + 12);
      duration = view.getUint32(mdhdBox.contentOffset + 16);
    }
  }

  const hdlrBox = mdiaBoxes.find((b) => b.type === 'hdlr');
  if (hdlrBox && hdlrBox.contentSize >= 12) {
    handlerType = readFourCC(view, hdlrBox.contentOffset + 8);
  }

  const minfBox = mdiaBoxes.find((b) => b.type === 'minf');
  if (!minfBox) return null;

  const minfBoxes = parseBoxesInBuffer(
    trakBytes,
    minfBox.contentOffset,
    minfBox.offset + minfBox.size
  );
  const stblBox = minfBoxes.find((b) => b.type === 'stbl');
  if (!stblBox) return null;

  const stblBoxes = parseBoxesInBuffer(
    trakBytes,
    stblBox.contentOffset,
    stblBox.offset + stblBox.size
  );

  // 1. stsd entries
  const stsdEntries: Uint8Array[] = [];
  const stsdBox = stblBoxes.find((b) => b.type === 'stsd');
  if (stsdBox && stsdBox.contentSize >= 8) {
    const entryCount = view.getUint32(stsdBox.contentOffset + 4);
    let pos = stsdBox.contentOffset + 8;
    const end = stsdBox.offset + stsdBox.size;
    for (let i = 0; i < entryCount && pos + 8 <= end; i++) {
      const entrySize = view.getUint32(pos);
      if (entrySize < 8 || pos + entrySize > end) break;
      stsdEntries.push(trakBytes.subarray(pos, pos + entrySize));
      pos += entrySize;
    }
  }

  // 2. stts (Time-to-Sample)
  const stts: SttsEntry[] = [];
  const sttsBox = stblBoxes.find((b) => b.type === 'stts');
  if (sttsBox && sttsBox.contentSize >= 8) {
    const count = view.getUint32(sttsBox.contentOffset + 4);
    let pos = sttsBox.contentOffset + 8;
    const end = sttsBox.offset + sttsBox.size;
    for (let i = 0; i < count && pos + 8 <= end; i++) {
      stts.push({
        sampleCount: view.getUint32(pos),
        sampleDelta: view.getUint32(pos + 4),
      });
      pos += 8;
    }
  }

  // 3. stss (Sync Samples / Keyframes) — stored in compact Uint32Array for large 2GB+ videos
  let stss: Uint32Array | null = null;
  const stssBox = stblBoxes.find((b) => b.type === 'stss');
  if (stssBox && stssBox.contentSize >= 8) {
    const count = view.getUint32(stssBox.contentOffset + 4);
    let pos = stssBox.contentOffset + 8;
    const safeCount = Math.min(count, Math.floor((stssBox.contentSize - 8) / 4));
    stss = new Uint32Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      stss[i] = view.getUint32(pos);
      pos += 4;
    }
  }

  // 4. ctts (Composition Time-to-Sample)
  let ctts: CttsEntry[] | null = null;
  const cttsBox = stblBoxes.find((b) => b.type === 'ctts');
  if (cttsBox && cttsBox.contentSize >= 8) {
    ctts = [];
    const count = view.getUint32(cttsBox.contentOffset + 4);
    let pos = cttsBox.contentOffset + 8;
    const end = cttsBox.offset + cttsBox.size;
    for (let i = 0; i < count && pos + 8 <= end; i++) {
      ctts.push({
        sampleCount: view.getUint32(pos),
        sampleOffset: view.getInt32(pos + 4),
      });
      pos += 8;
    }
  }

  // 5. stsc (Sample-to-Chunk)
  const stsc: StscEntry[] = [];
  const stscBox = stblBoxes.find((b) => b.type === 'stsc');
  if (stscBox && stscBox.contentSize >= 8) {
    const count = view.getUint32(stscBox.contentOffset + 4);
    let pos = stscBox.contentOffset + 8;
    const end = stscBox.offset + stscBox.size;
    for (let i = 0; i < count && pos + 12 <= end; i++) {
      stsc.push({
        firstChunk: view.getUint32(pos),
        samplesPerChunk: view.getUint32(pos + 4),
        sampleDescriptionIndex: view.getUint32(pos + 8),
      });
      pos += 12;
    }
  }

  // 6. stsz (Sample Sizes) — stored in compact Uint32Array for zero-overhead on 800MB-2GB+ files
  let stszUniformSize = 0;
  let stszSampleCount = 0;
  let stszSampleSizes = new Uint32Array(0);
  const stszBox = stblBoxes.find((b) => b.type === 'stsz');
  if (stszBox && stszBox.contentSize >= 12) {
    stszUniformSize = view.getUint32(stszBox.contentOffset + 4);
    stszSampleCount = view.getUint32(stszBox.contentOffset + 8);
    if (stszUniformSize === 0) {
      let pos = stszBox.contentOffset + 12;
      const safeCount = Math.min(
        stszSampleCount,
        Math.floor((stszBox.contentSize - 12) / 4)
      );
      stszSampleCount = safeCount;
      stszSampleSizes = new Uint32Array(safeCount);
      for (let i = 0; i < safeCount; i++) {
        stszSampleSizes[i] = view.getUint32(pos);
        pos += 4;
      }
    }
  }

  // 7. stco or co64 (Chunk Offsets) — stored in Float64Array to support 64-bit offsets > 4GB
  let chunkOffsets = new Float64Array(0);
  const stcoBox = stblBoxes.find((b) => b.type === 'stco');
  const co64Box = stblBoxes.find((b) => b.type === 'co64');
  if (stcoBox && stcoBox.contentSize >= 8) {
    const count = view.getUint32(stcoBox.contentOffset + 4);
    let pos = stcoBox.contentOffset + 8;
    const safeCount = Math.min(count, Math.floor((stcoBox.contentSize - 8) / 4));
    chunkOffsets = new Float64Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      chunkOffsets[i] = view.getUint32(pos);
      pos += 4;
    }
  } else if (co64Box && co64Box.contentSize >= 8) {
    const count = view.getUint32(co64Box.contentOffset + 4);
    let pos = co64Box.contentOffset + 8;
    const safeCount = Math.min(count, Math.floor((co64Box.contentSize - 8) / 8));
    chunkOffsets = new Float64Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const hi = view.getUint32(pos);
      const lo = view.getUint32(pos + 4);
      chunkOffsets[i] = hi * 4294967296 + lo;
      pos += 8;
    }
  }

  if (
    stsdEntries.length === 0 ||
    stszSampleCount === 0 ||
    chunkOffsets.length === 0 ||
    timescale === 0
  ) {
    return null;
  }

  // Sanitize stts entries so corrupt/overflow uint32 sampleDeltas (e.g. 0xFFFFFFFF -> 18+ hours) never inflate track duration or freeze playback
  const maxReasonableDelta = handlerType === 'soun' ? timescale : timescale * 2;
  let typicalDelta = handlerType === 'soun' ? 1024 : Math.max(1, Math.round(timescale / 30));
  let bestWeight = 0;
  for (const e of stts) {
    if (e.sampleCount > 0 && e.sampleDelta > 0 && e.sampleDelta <= maxReasonableDelta) {
      if (e.sampleCount > bestWeight) {
        bestWeight = e.sampleCount;
        typicalDelta = e.sampleDelta;
      }
    }
  }
  const sanitizedStts: SttsEntry[] = [];
  for (const e of stts) {
    if (e.sampleCount <= 0) continue;
    const cleanDelta =
      e.sampleDelta > 0 && e.sampleDelta <= maxReasonableDelta ? e.sampleDelta : typicalDelta;
    if (
      sanitizedStts.length > 0 &&
      sanitizedStts[sanitizedStts.length - 1].sampleDelta === cleanDelta
    ) {
      sanitizedStts[sanitizedStts.length - 1].sampleCount += e.sampleCount;
    } else {
      sanitizedStts.push({ sampleCount: e.sampleCount, sampleDelta: cleanDelta });
    }
  }
  if (sanitizedStts.length === 0) {
    sanitizedStts.push({ sampleCount: stszSampleCount, sampleDelta: typicalDelta });
  }

  // Sanitize ctts offsets so corrupt/huge composition offsets never freeze video frames
  let sanitizedCtts: CttsEntry[] | null = null;
  if (ctts && ctts.length > 0) {
    const maxCto = typicalDelta * 8;
    const hasCorruptCto = ctts.some((c) => c.sampleOffset < -maxCto || c.sampleOffset > maxCto);
    if (!hasCorruptCto) {
      sanitizedCtts = ctts;
    }
  }

  return {
    handlerType,
    trackId,
    timescale,
    duration,
    width,
    height,
    rawTrakBytes: trakBytes,
    stsdEntries,
    stts: sanitizedStts,
    stss,
    ctts: sanitizedCtts,
    stsc,
    stszUniformSize,
    stszSampleCount,
    stszSampleSizes,
    chunkOffsets,
  };
}

/**
 * Reads ONLY the lightweight container headers (ftyp + moov) via File.slice().
 * Even for 800 MB, 2 GB, or 10 GB video files, the massive `mdat` payload is NEVER read into memory!
 */
async function parseMp4HeaderOnly(file: File): Promise<ParsedMp4File | null> {
  const fileSize = file.size;
  let pos = 0;
  let ftypBytes: Uint8Array | null = null;
  let rawMoovBytes: Uint8Array | null = null;
  let sawMdat = false;

  while (pos + 8 <= fileSize) {
    const headerSlice = await file
      .slice(pos, Math.min(fileSize, pos + 16))
      .arrayBuffer();
    if (headerSlice.byteLength < 8) break;
    const view = new DataView(headerSlice);
    let boxSize = view.getUint32(0);
    const boxType = readFourCC(view, 4);

    if (boxSize === 1) {
      if (headerSlice.byteLength < 16) break;
      const hi = view.getUint32(8);
      const lo = view.getUint32(12);
      boxSize = hi * 4294967296 + lo;
    } else if (boxSize === 0) {
      boxSize = fileSize - pos;
    }

    if (boxSize < 8 || pos + boxSize > fileSize) {
      break;
    }

    if (boxType === 'ftyp') {
      const buf = await file.slice(pos, pos + boxSize).arrayBuffer();
      ftypBytes = new Uint8Array(buf);
    } else if (boxType === 'moov') {
      const buf = await file.slice(pos, pos + boxSize).arrayBuffer();
      rawMoovBytes = new Uint8Array(buf);
    } else if (boxType === 'mdat') {
      sawMdat = true;
    } else if (boxType === 'moof') {
      return null;
    }

    pos += boxSize;
  }

  if (!rawMoovBytes || !sawMdat) return null;

  const moovBoxes = parseBoxesInBuffer(rawMoovBytes, 8, rawMoovBytes.byteLength);
  const mvhdBox = moovBoxes.find((b) => b.type === 'mvhd');
  if (!mvhdBox) return null;

  const moovView = new DataView(
    rawMoovBytes.buffer,
    rawMoovBytes.byteOffset,
    rawMoovBytes.byteLength
  );
  const mvhdVersion = moovView.getUint8(mvhdBox.contentOffset);
  const mvhdTimescale =
    mvhdVersion === 1
      ? moovView.getUint32(mvhdBox.contentOffset + 20)
      : moovView.getUint32(mvhdBox.contentOffset + 12);

  const tracks: ParsedTrack[] = [];
  for (const b of moovBoxes) {
    if (b.type === 'trak') {
      const trakSlice = rawMoovBytes.subarray(b.offset, b.offset + b.size);
      const parsedTrack = parseTrackBox(trakSlice);
      if (
        parsedTrack &&
        (parsedTrack.handlerType === 'vide' || parsedTrack.handlerType === 'soun')
      ) {
        tracks.push(parsedTrack);
      }
    }
  }

  if (tracks.length === 0) return null;

  // Cross-check video vs audio duration: if an MP4 file has a corrupted video stts duration (e.g. 18+ hours)
  // while its audio track has a normal physical sample count duration, lock video stts to audio duration!
  const vTrack = tracks.find((t) => t.handlerType === 'vide');
  const aTrack = tracks.find((t) => t.handlerType === 'soun');
  if (vTrack && aTrack && vTrack.timescale > 0 && aTrack.timescale > 0 && vTrack.stszSampleCount > 0) {
    const vTicks = vTrack.stts.reduce((s, e) => s + e.sampleCount * e.sampleDelta, 0);
    const aTicks = aTrack.stts.reduce((s, e) => s + e.sampleCount * e.sampleDelta, 0);
    const vSec = vTicks / vTrack.timescale;
    const aSec = aTicks / aTrack.timescale;
    if (aSec > 0.5 && (vSec > aSec * 1.35 || vSec < aSec * 0.5)) {
      const targetVTicks = Math.max(
        vTrack.stszSampleCount,
        Math.round(aSec * vTrack.timescale)
      );
      const baseD = Math.max(1, Math.floor(targetVTicks / vTrack.stszSampleCount));
      const remD = targetVTicks - baseD * vTrack.stszSampleCount;
      vTrack.stts =
        remD === 0 || vTrack.stszSampleCount === 1
          ? [{ sampleCount: vTrack.stszSampleCount, sampleDelta: baseD + remD }]
          : [
              { sampleCount: vTrack.stszSampleCount - 1, sampleDelta: baseD },
              { sampleCount: 1, sampleDelta: baseD + remD },
            ];
      vTrack.duration = targetVTicks;
      vTrack.ctts = null;
    }
  }

  return {
    file,
    fileSize,
    ftypBytes,
    mvhdTimescale: mvhdTimescale || 1000,
    rawMoovBytes,
    tracks,
  };
}

function buildStblBox(
  stsdEntries: Uint8Array[],
  stts: SttsEntry[],
  stss: Uint32Array | null,
  ctts: CttsEntry[] | null,
  stsc: StscEntry[],
  stszSampleSizes: Uint32Array,
  relativeChunkOffsets: Float64Array,
  baseByteOffset: number
): Uint8Array {
  // 1. stsd
  const stsdHeader = new Uint8Array(8);
  const stsdHeaderView = new DataView(stsdHeader.buffer);
  stsdHeaderView.setUint32(0, 0);
  stsdHeaderView.setUint32(4, stsdEntries.length);
  const stsdBox = makeBox('stsd', concatUint8Arrays([stsdHeader, ...stsdEntries]));

  // 2. stts
  const sttsPayload = new Uint8Array(8 + stts.length * 8);
  const sttsView = new DataView(sttsPayload.buffer);
  sttsView.setUint32(0, 0);
  sttsView.setUint32(4, stts.length);
  for (let i = 0; i < stts.length; i++) {
    sttsView.setUint32(8 + i * 8, stts[i].sampleCount);
    sttsView.setUint32(12 + i * 8, Math.max(1, stts[i].sampleDelta));
  }
  const sttsBox = makeBox('stts', sttsPayload);

  // 3. stss (optional)
  let stssBox: Uint8Array | null = null;
  if (stss && stss.length > 0) {
    const stssPayload = new Uint8Array(8 + stss.length * 4);
    const stssView = new DataView(stssPayload.buffer);
    stssView.setUint32(0, 0);
    stssView.setUint32(4, stss.length);
    for (let i = 0; i < stss.length; i++) {
      stssView.setUint32(8 + i * 4, stss[i]);
    }
    stssBox = makeBox('stss', stssPayload);
  }

  // 4. ctts (optional)
  let cttsBox: Uint8Array | null = null;
  if (ctts && ctts.length > 0) {
    const cttsPayload = new Uint8Array(8 + ctts.length * 8);
    const cttsView = new DataView(cttsPayload.buffer);
    cttsView.setUint32(0, 0);
    cttsView.setUint32(4, ctts.length);
    for (let i = 0; i < ctts.length; i++) {
      cttsView.setUint32(8 + i * 8, ctts[i].sampleCount);
      cttsView.setInt32(12 + i * 8, ctts[i].sampleOffset);
    }
    cttsBox = makeBox('ctts', cttsPayload);
  }

  // 5. stsc
  const stscPayload = new Uint8Array(8 + stsc.length * 12);
  const stscView = new DataView(stscPayload.buffer);
  stscView.setUint32(0, 0);
  stscView.setUint32(4, stsc.length);
  for (let i = 0; i < stsc.length; i++) {
    stscView.setUint32(8 + i * 12, stsc[i].firstChunk);
    stscView.setUint32(12 + i * 12, stsc[i].samplesPerChunk);
    stscView.setUint32(16 + i * 12, stsc[i].sampleDescriptionIndex);
  }
  const stscBox = makeBox('stsc', stscPayload);

  // 6. stsz
  const stszPayload = new Uint8Array(12 + stszSampleSizes.length * 4);
  const stszView = new DataView(stszPayload.buffer);
  stszView.setUint32(0, 0);
  stszView.setUint32(4, 0);
  stszView.setUint32(8, stszSampleSizes.length);
  for (let i = 0; i < stszSampleSizes.length; i++) {
    stszView.setUint32(12 + i * 4, stszSampleSizes[i]);
  }
  const stszBox = makeBox('stsz', stszPayload);

  // 7. Always use 64-bit co64 so multi-GB merges (800MB + 2GB + 2GB > 4GB) NEVER overflow 32-bit offsets
  const co64Payload = new Uint8Array(8 + relativeChunkOffsets.length * 8);
  const co64View = new DataView(co64Payload.buffer);
  co64View.setUint32(0, 0);
  co64View.setUint32(4, relativeChunkOffsets.length);
  for (let i = 0; i < relativeChunkOffsets.length; i++) {
    const val = relativeChunkOffsets[i] + baseByteOffset;
    const hi = Math.floor(val / 4294967296);
    const lo = val >>> 0;
    co64View.setUint32(8 + i * 8, hi);
    co64View.setUint32(12 + i * 8, lo);
  }
  const chunkOffsetBox = makeBox('co64', co64Payload);

  const childBoxes: Uint8Array[] = [stsdBox, sttsBox];
  if (stssBox) childBoxes.push(stssBox);
  if (cttsBox) childBoxes.push(cttsBox);
  childBoxes.push(stscBox, stszBox, chunkOffsetBox);

  return makeBox('stbl', concatUint8Arrays(childBoxes));
}

function rebuildTrakWithMergedStbl(
  templateTrak: Uint8Array,
  newTrackId: number,
  newTkhdDurationInMvhd: number,
  newMdhdTimescale: number,
  newMdhdDuration: number,
  newStblBox: Uint8Array
): Uint8Array {
  const trakBoxes = parseBoxesInBuffer(templateTrak, 8, templateTrak.byteLength);
  const outTrakChildren: Uint8Array[] = [];

  for (const b of trakBoxes) {
    if (b.type === 'edts') {
      continue;
    }
    if (b.type === 'tkhd') {
      const tkhdCopy = new Uint8Array(templateTrak.subarray(b.offset, b.offset + b.size));
      const view = new DataView(tkhdCopy.buffer, tkhdCopy.byteOffset, tkhdCopy.byteLength);
      const version = view.getUint8(8);
      view.setUint8(9, 0);
      view.setUint8(10, 0);
      view.setUint8(11, 7);
      if (version === 1) {
        view.setUint32(8 + 20, newTrackId);
        const hi = Math.floor(newTkhdDurationInMvhd / 4294967296);
        const lo = newTkhdDurationInMvhd >>> 0;
        view.setUint32(8 + 28, hi);
        view.setUint32(8 + 32, lo);
      } else {
        view.setUint32(8 + 12, newTrackId);
        view.setUint32(
          8 + 20,
          Math.min(0xffffffff, Math.round(newTkhdDurationInMvhd)) >>> 0
        );
      }
      outTrakChildren.push(tkhdCopy);
      continue;
    }
    if (b.type === 'mdia') {
      const mdiaBoxes = parseBoxesInBuffer(templateTrak, b.contentOffset, b.offset + b.size);
      const outMdiaChildren: Uint8Array[] = [];

      for (const mb of mdiaBoxes) {
        if (mb.type === 'mdhd') {
          const origMdhd = templateTrak.subarray(mb.offset, mb.offset + mb.size);
          const origView = new DataView(
            origMdhd.buffer,
            origMdhd.byteOffset,
            origMdhd.byteLength
          );
          const origVersion = origView.getUint8(8);

          // Upgrade mdhd to 64-bit version 1 if long multi-hour duration exceeds 32-bit uint
          if (origVersion === 0 && newMdhdDuration > 0xffffffff) {
            const v1Payload = new Uint8Array(36);
            const v1View = new DataView(v1Payload.buffer);
            v1View.setUint8(0, 1); // version 1
            v1View.setUint32(20, newMdhdTimescale >>> 0);
            const hi = Math.floor(newMdhdDuration / 4294967296);
            const lo = newMdhdDuration >>> 0;
            v1View.setUint32(24, hi);
            v1View.setUint32(28, lo);
            if (origMdhd.byteLength >= 32) {
              v1View.setUint16(32, origView.getUint16(8 + 20));
              v1View.setUint16(34, origView.getUint16(8 + 22));
            }
            outMdiaChildren.push(makeBox('mdhd', v1Payload));
          } else {
            const mdhdCopy = new Uint8Array(origMdhd);
            const view = new DataView(
              mdhdCopy.buffer,
              mdhdCopy.byteOffset,
              mdhdCopy.byteLength
            );
            if (origVersion === 1) {
              view.setUint32(8 + 20, newMdhdTimescale >>> 0);
              const hi = Math.floor(newMdhdDuration / 4294967296);
              const lo = newMdhdDuration >>> 0;
              view.setUint32(8 + 24, hi);
              view.setUint32(8 + 28, lo);
            } else {
              view.setUint32(8 + 12, newMdhdTimescale >>> 0);
              view.setUint32(8 + 16, newMdhdDuration >>> 0);
            }
            outMdiaChildren.push(mdhdCopy);
          }
        } else if (mb.type === 'minf') {
          const minfBoxes = parseBoxesInBuffer(
            templateTrak,
            mb.contentOffset,
            mb.offset + mb.size
          );
          const outMinfChildren: Uint8Array[] = [];
          for (const minfChild of minfBoxes) {
            if (minfChild.type === 'stbl') {
              outMinfChildren.push(newStblBox);
            } else {
              outMinfChildren.push(
                templateTrak.subarray(
                  minfChild.offset,
                  minfChild.offset + minfChild.size
                )
              );
            }
          }
          outMdiaChildren.push(makeBox('minf', concatUint8Arrays(outMinfChildren)));
        } else {
          outMdiaChildren.push(templateTrak.subarray(mb.offset, mb.offset + mb.size));
        }
      }

      outTrakChildren.push(makeBox('mdia', concatUint8Arrays(outMdiaChildren)));
      continue;
    }

    outTrakChildren.push(templateTrak.subarray(b.offset, b.offset + b.size));
  }

  return makeBox('trak', concatUint8Arrays(outTrakChildren));
}

function buildMergedMoovBox(
  templateMoov: Uint8Array,
  mvhdTimescale: number,
  totalMvhdDuration: number,
  mergedTrakBoxes: Uint8Array[]
): Uint8Array {
  const moovBoxes = parseBoxesInBuffer(templateMoov, 8, templateMoov.byteLength);
  const outMoovChildren: Uint8Array[] = [];

  for (const b of moovBoxes) {
    if (b.type === 'mvhd') {
      const mvhdCopy = new Uint8Array(templateMoov.subarray(b.offset, b.offset + b.size));
      const view = new DataView(mvhdCopy.buffer, mvhdCopy.byteOffset, mvhdCopy.byteLength);
      const version = view.getUint8(8);
      if (version === 1) {
        view.setUint32(8 + 20, mvhdTimescale);
        const hi = Math.floor(totalMvhdDuration / 4294967296);
        const lo = totalMvhdDuration >>> 0;
        view.setUint32(8 + 24, hi);
        view.setUint32(8 + 28, lo);
        view.setUint32(8 + 32, 0x00010000); // normal 1.0 container rate (tracks are already time-scaled)
        view.setUint32(8 + 108, mergedTrakBoxes.length + 1);
      } else {
        view.setUint32(8 + 12, mvhdTimescale);
        view.setUint32(
          8 + 16,
          Math.min(0xffffffff, Math.round(totalMvhdDuration)) >>> 0
        );
        view.setUint32(8 + 20, 0x00010000);
        view.setUint32(8 + 96, mergedTrakBoxes.length + 1);
      }
      outMoovChildren.push(mvhdCopy);
    } else if (b.type === 'trak' || b.type === 'mvex') {
      continue;
    } else {
      outMoovChildren.push(templateMoov.subarray(b.offset, b.offset + b.size));
    }
  }

  outMoovChildren.push(...mergedTrakBoxes);
  return makeBox('moov', concatUint8Arrays(outMoovChildren));
}

/**
 * Unrolls a track's chunk/sample tables into per-sample (byteOffset, byteSize, sampleDescIdx, sampleDelta)
 * and resamples grains of consecutive audio frames so the audio track duration matches `1 / speedMultiplier`
 * without re-encoding a single byte of `mdat`!
 */
function buildTimeScaledAudioSamples(
  tr: ParsedTrack,
  fileBaseOffset: number,
  stsdIndexMap: Map<number, number>,
  timescaleRatio: number,
  speedMultiplier: number
): {
  sampleSizes: Uint32Array;
  chunkOffsets: Float64Array;
  stsc: StscEntry[];
  stts: SttsEntry[];
} {
  const N = tr.stszSampleCount;
  const origOffsets = new Float64Array(N);
  const origSizes = new Uint32Array(N);
  const origDescIdx = new Uint16Array(N);
  const origDeltas = new Uint32Array(N);

  // 1. Expand per-sample deltas from stts
  let sPtr = 0;
  const fallbackDelta = tr.stts.length > 0 ? tr.stts[0].sampleDelta : 1024;
  for (const entry of tr.stts) {
    const scaledDelta = Math.max(1, Math.round(entry.sampleDelta * timescaleRatio));
    const count = Math.min(entry.sampleCount, N - sPtr);
    for (let i = 0; i < count; i++) {
      origDeltas[sPtr++] = scaledDelta;
    }
    if (sPtr >= N) break;
  }
  while (sPtr < N) {
    origDeltas[sPtr++] = Math.max(1, Math.round(fallbackDelta * timescaleRatio));
  }

  // 2. Expand per-sample byte offset & size from stsc + chunkOffsets + stsz
  const numChunks = tr.chunkOffsets.length;
  let sampleIdx = 0;
  for (let stscIdx = 0; stscIdx < tr.stsc.length; stscIdx++) {
    const cur = tr.stsc[stscIdx];
    const firstChunk1 = Math.max(1, cur.firstChunk);
    const nextFirstChunk1 =
      stscIdx + 1 < tr.stsc.length ? tr.stsc[stscIdx + 1].firstChunk : numChunks + 1;
    const mappedDesc = stsdIndexMap.get(cur.sampleDescriptionIndex) || 1;

    for (
      let chunk1 = firstChunk1;
      chunk1 < nextFirstChunk1 && chunk1 <= numChunks;
      chunk1++
    ) {
      let curByteOffset = fileBaseOffset + tr.chunkOffsets[chunk1 - 1];
      for (let k = 0; k < cur.samplesPerChunk && sampleIdx < N; k++) {
        const sz =
          tr.stszUniformSize > 0 ? tr.stszUniformSize : tr.stszSampleSizes[sampleIdx];
        origOffsets[sampleIdx] = curByteOffset;
        origSizes[sampleIdx] = sz;
        origDescIdx[sampleIdx] = mappedDesc;
        curByteOffset += sz;
        sampleIdx++;
      }
    }
  }

  const validSampleCount = sampleIdx;
  if (validSampleCount === 0) {
    return {
      sampleSizes: new Uint32Array(0),
      chunkOffsets: new Float64Array(0),
      stsc: [],
      stts: [],
    };
  }

  // 3. Grain-based resampling (4 consecutive AAC frames per ~85ms grain preserves MDCT overlap-add continuity)
  const GRAIN_SIZE = Math.min(4, validSampleCount);
  const numInputGrains = Math.max(1, Math.floor(validSampleCount / GRAIN_SIZE));
  const numOutputGrains = Math.max(1, Math.round(numInputGrains / speedMultiplier));
  const outSampleCount = numOutputGrains * GRAIN_SIZE;

  const outSizes = new Uint32Array(outSampleCount);
  const outOffsets = new Float64Array(outSampleCount);
  const outStsc: StscEntry[] = [];
  const outStts: SttsEntry[] = [];

  let outIdx = 0;
  let prevDesc = -1;

  for (let g = 0; g < numOutputGrains; g++) {
    const srcGrain = Math.min(
      numInputGrains - 1,
      Math.floor((g * numInputGrains) / numOutputGrains)
    );
    const srcStart = srcGrain * GRAIN_SIZE;

    for (let k = 0; k < GRAIN_SIZE; k++) {
      const s = srcStart + k;
      outSizes[outIdx] = origSizes[s];
      outOffsets[outIdx] = origOffsets[s];

      const desc = origDescIdx[s] || 1;
      if (desc !== prevDesc) {
        outStsc.push({
          firstChunk: outIdx + 1,
          samplesPerChunk: 1,
          sampleDescriptionIndex: desc,
        });
        prevDesc = desc;
      }

      const d = origDeltas[s];
      if (outStts.length > 0 && outStts[outStts.length - 1].sampleDelta === d) {
        outStts[outStts.length - 1].sampleCount += 1;
      } else {
        outStts.push({ sampleCount: 1, sampleDelta: d });
      }

      outIdx++;
    }
  }

  return {
    sampleSizes: outSizes,
    chunkOffsets: outOffsets,
    stsc: outStsc,
    stts: outStts,
  };
}

export async function inspectVideoFile(file: File): Promise<VideoClipInfo> {
  const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`;

  // Fast ISO-BMFF header inspection (reads only a few KB/MB of header via File.slice, never loads 800MB/2GB into RAM)
  try {
    const parsed = await parseMp4HeaderOnly(file);
    if (parsed) {
      const vTrack = parsed.tracks.find((t) => t.handlerType === 'vide');
      const aTrack = parsed.tracks.find((t) => t.handlerType === 'soun');
      if (vTrack && vTrack.timescale > 0) {
        const totalDelta = vTrack.stts.reduce(
          (acc, e) => acc + e.sampleCount * e.sampleDelta,
          0
        );
        const dur =
          totalDelta > 0
            ? totalDelta / vTrack.timescale
            : vTrack.duration / vTrack.timescale;
        return {
          id,
          file,
          name: file.name,
          sizeBytes: file.size,
          durationSec: Math.max(0.1, dur),
          width: vTrack.width || 1920,
          height: vTrack.height || 1080,
          videoCodec: 'MP4',
          hasAudio: Boolean(aTrack),
        };
      }
    }
  } catch {
    // Fallback below
  }

  // Fast MPEG-TS (.ts / .m2ts / .mts) header+tail inspection
  try {
    if (await isMpegTsFile(file)) {
      const tsInfo = await inspectMpegTsFile(file);
      if (tsInfo) {
        return {
          id,
          file,
          name: file.name,
          sizeBytes: file.size,
          durationSec: tsInfo.durationSec,
          width: tsInfo.width || 1920,
          height: tsInfo.height || 1080,
          videoCodec: 'TS → MP4',
          hasAudio: tsInfo.hasAudio,
        };
      }
    }
  } catch {
    // Fallback below
  }

  // Lightweight temporary metadata probe for non-MP4 files
  return new Promise<VideoClipInfo>((resolve) => {
    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(tempUrl);
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        id,
        file,
        name: file.name,
        sizeBytes: file.size,
        durationSec: 0,
        width: 1920,
        height: 1080,
        videoCodec: file.type || 'video/mp4',
        hasAudio: true,
      });
    }, 2000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const dur = Number.isFinite(video.duration) ? video.duration : 0;
      const w = video.videoWidth || 1920;
      const h = video.videoHeight || 1080;
      cleanup();
      resolve({
        id,
        file,
        name: file.name,
        sizeBytes: file.size,
        durationSec: dur,
        width: w,
        height: h,
        videoCodec: file.type || 'video/mp4',
        hasAudio: true,
      });
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve({
        id,
        file,
        name: file.name,
        sizeBytes: file.size,
        durationSec: 0,
        width: 1920,
        height: 1080,
        videoCodec: file.type || 'video/mp4',
        hasAudio: true,
      });
    };

    video.src = tempUrl;
  });
}

export async function mergeVideosInstantly(
  files: File[],
  speedMultiplier: number = 1.0,
  onProgress?: (progress: MergeProgressInfo) => void
): Promise<InstantMergeResult> {
  const startTime = performance.now();
  const safeSpeed = Math.min(8.0, Math.max(0.25, Number(speedMultiplier) || 1.0));
  const isCustomSpeed = Math.abs(safeSpeed - 1.0) >= 0.01;

  if (files.length === 0) {
    throw new Error('Please select at least one video file.');
  }

  // Detect which input files are MPEG-TS (.ts / .m2ts / .mts)
  const tsFlags = await Promise.all(files.map((f) => isMpegTsFile(f)));
  const tsTotalCount = tsFlags.filter(Boolean).length;
  const totalBytesAll = files.reduce((acc, f) => acc + f.size, 0);
  const totalTsBytes = files.reduce((acc, f, idx) => acc + (tsFlags[idx] ? f.size : 0), 0);
  const effectiveTotalBytes = tsTotalCount > 0 ? Math.max(1, totalTsBytes) : Math.max(1, totalBytesAll);

  const clipProgressByIndex: Record<number, number> = {};
  for (let i = 0; i < files.length; i++) {
    clipProgressByIndex[i] = tsFlags[i] ? 0 : 100;
  }

  // Remux any MPEG-TS (.ts / .m2ts / .mts) input files into ISO-BMFF MP4 files (cached per File in WeakMap)
  const normalizedFiles: File[] = [];
  let sharedCodecHint: TsCodecHint | undefined;
  let completedTsBytes = 0;
  let tsConvertedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (tsFlags[i]) {
      try {
        const remuxed = await remuxTsFileToMp4(
          f,
          sharedCodecHint,
          (fileProcessedBytes, fileTotalBytes) => {
            const clipPct =
              fileTotalBytes > 0
                ? Math.min(100, Math.round((fileProcessedBytes / fileTotalBytes) * 100))
                : 100;
            clipProgressByIndex[i] = clipPct;
            const currentProcessed = Math.min(
              effectiveTotalBytes,
              completedTsBytes + fileProcessedBytes
            );
            const overallPct = Math.min(
              99,
              Math.round((currentProcessed / effectiveTotalBytes) * 100)
            );
            if (onProgress) {
              onProgress({
                phase: 'remuxing-ts',
                overallPercent: overallPct,
                processedBytes: currentProcessed,
                totalBytes: effectiveTotalBytes,
                currentClipIndex: i + 1,
                totalClips: files.length,
                currentClipName: f.name,
                currentClipPercent: clipPct,
                tsConvertedCount,
                tsTotalCount,
                clipProgressByIndex: { ...clipProgressByIndex },
              });
            }
          }
        );
        sharedCodecHint = remuxed.codecHint;
        normalizedFiles.push(remuxed.mp4File);
      } catch {
        normalizedFiles.push(f);
      }
      completedTsBytes += f.size;
      tsConvertedCount += 1;
      clipProgressByIndex[i] = 100;

      if (onProgress) {
        onProgress({
          phase: tsConvertedCount < tsTotalCount ? 'remuxing-ts' : 'merging-mp4',
          overallPercent: Math.min(
            99,
            Math.round((completedTsBytes / effectiveTotalBytes) * 100)
          ),
          processedBytes: completedTsBytes,
          totalBytes: effectiveTotalBytes,
          currentClipIndex: i + 1,
          totalClips: files.length,
          currentClipName: f.name,
          currentClipPercent: 100,
          tsConvertedCount,
          tsTotalCount,
          clipProgressByIndex: { ...clipProgressByIndex },
        });
      }
    } else {
      normalizedFiles.push(f);
    }
  }

  const emitCompletedProgress = () => {
    if (onProgress) {
      onProgress({
        phase: 'completed',
        overallPercent: 100,
        processedBytes: effectiveTotalBytes,
        totalBytes: effectiveTotalBytes,
        currentClipIndex: files.length,
        totalClips: files.length,
        currentClipName: files[files.length - 1].name,
        currentClipPercent: 100,
        tsConvertedCount: tsTotalCount,
        tsTotalCount,
        clipProgressByIndex: { ...clipProgressByIndex },
      });
    }
  };

  // Parse headers of all input files via zero-copy File.slice()
  const parsedFiles = await Promise.all(normalizedFiles.map((f) => parseMp4HeaderOnly(f)));
  const allAreValidMp4 = parsedFiles.every((p): p is ParsedMp4File => p !== null);

  if (allAreValidMp4) {
    const firstFile = parsedFiles[0];
    const ftypBytes =
      firstFile.ftypBytes ||
      makeBox(
        'ftyp',
        new Uint8Array([
          0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73,
          0x6f, 0x32, 0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
        ])
      );

    const mvhdTimescale = firstFile.mvhdTimescale || 1000;
    const totalRawFilesBytes = parsedFiles.reduce((acc, f) => acc + f.fileSize, 0);
    // Always use 16-byte 64-bit mdat header so 800MB + 2GB + 2GB (> 4GB) works seamlessly
    const mdatHeaderSize = 16;

    // Pre-compute per-file unscaled duration for A/V sync alignment at clip boundaries
    const fileTargetDurationsSec: number[] = parsedFiles.map((pf) => {
      const vTrack = pf.tracks.find((t) => t.handlerType === 'vide');
      const aTrack = pf.tracks.find((t) => t.handlerType === 'soun');
      const vDur = vTrack
        ? vTrack.stts.reduce((s, e) => s + e.sampleCount * e.sampleDelta, 0) / vTrack.timescale
        : 0;
      const aDur = aTrack
        ? aTrack.stts.reduce((s, e) => s + e.sampleCount * e.sampleDelta, 0) / aTrack.timescale
        : 0;
      return Math.max(vDur, aDur);
    });

    const originalTotalDurationSec = fileTargetDurationsSec.reduce((a, b) => a + b, 0);

    interface PreMergedTrackData {
      templateTrak: Uint8Array;
      trackId: number;
      effectiveTimescale: number;
      totalTrackDuration: number;
      durationInMvhd: number;
      mergedStsdEntries: Uint8Array[];
      mergedStts: SttsEntry[];
      mergedStss: Uint32Array | null;
      mergedCtts: CttsEntry[] | null;
      mergedStsc: StscEntry[];
      mergedStsz: Uint32Array;
      relativeChunkOffsets: Float64Array;
    }

    const preMergedTracks: PreMergedTrackData[] = [];
    let maxDurationInMvhd = 0;
    let totalDurationSec = 0;
    let nextTrackId = 1;

    for (const hType of ['vide', 'soun'] as const) {
      const firstTrackWithType = parsedFiles
        .map((pf) => pf.tracks.find((t) => t.handlerType === hType))
        .find((t): t is ParsedTrack => Boolean(t));

      if (!firstTrackWithType) continue;

      const targetTimescale = firstTrackWithType.timescale;
      const mergedStsdEntries: Uint8Array[] = [];
      const mergedStts: SttsEntry[] = [];
      const hasAnyStss = parsedFiles.some((pf) => {
        const tr = pf.tracks.find((t) => t.handlerType === hType);
        return Boolean(tr && tr.stss && tr.stss.length > 0);
      });
      const hasAnyCtts = parsedFiles.some((pf) => {
        const tr = pf.tracks.find((t) => t.handlerType === hType);
        return Boolean(tr && tr.ctts && tr.ctts.length > 0);
      });

      // If this is the audio track and a custom speed (e.g. 1.5x, 2x) is active,
      // use grain-based pointer resampling so audio duration & A/V sync match the faster video!
      if (hType === 'soun' && isCustomSpeed) {
        const perFileScaled: Array<{
          sampleSizes: Uint32Array;
          chunkOffsets: Float64Array;
          stsc: StscEntry[];
          stts: SttsEntry[];
        }> = [];

        let cumulativeFileByteOffset = 0;
        for (let fIdx = 0; fIdx < parsedFiles.length; fIdx++) {
          const pf = parsedFiles[fIdx];
          const tr = pf.tracks.find((t) => t.handlerType === 'soun');
          if (!tr) {
            cumulativeFileByteOffset += pf.fileSize;
            continue;
          }

          const timescaleRatio = targetTimescale / tr.timescale;
          const stsdIndexMap = new Map<number, number>();
          for (let sIdx = 0; sIdx < tr.stsdEntries.length; sIdx++) {
            const candidate = tr.stsdEntries[sIdx];
            let existingIdx = mergedStsdEntries.findIndex((e) =>
              areUint8ArraysEqual(e, candidate)
            );
            if (existingIdx === -1) {
              mergedStsdEntries.push(candidate);
              existingIdx = mergedStsdEntries.length - 1;
            }
            stsdIndexMap.set(sIdx + 1, existingIdx + 1);
          }

          const scaled = buildTimeScaledAudioSamples(
            tr,
            cumulativeFileByteOffset,
            stsdIndexMap,
            timescaleRatio,
            safeSpeed
          );
          if (scaled.stts.length > 0) {
            const actualTicks = scaled.stts.reduce(
              (acc, e) => acc + e.sampleCount * e.sampleDelta,
              0
            );
            const targetScaledTicks = Math.round(
              (fileTargetDurationsSec[fIdx] / safeSpeed) * targetTimescale
            );
            const diffTicks = targetScaledTicks - actualTicks;
            if (diffTicks > 0 && diffTicks < targetTimescale * 5) {
              const lastEntry = scaled.stts[scaled.stts.length - 1];
              if (lastEntry.sampleCount === 1) {
                lastEntry.sampleDelta += diffTicks;
              } else {
                lastEntry.sampleCount -= 1;
                scaled.stts.push({
                  sampleCount: 1,
                  sampleDelta: lastEntry.sampleDelta + diffTicks,
                });
              }
            }
          }
          perFileScaled.push(scaled);
          cumulativeFileByteOffset += pf.fileSize;
        }

        const totalSamples = perFileScaled.reduce(
          (acc, s) => acc + s.sampleSizes.length,
          0
        );
        const totalChunks = perFileScaled.reduce(
          (acc, s) => acc + s.chunkOffsets.length,
          0
        );

        const mergedStsz = new Uint32Array(totalSamples);
        const relativeChunkOffsets = new Float64Array(totalChunks);
        const mergedStsc: StscEntry[] = [];

        let sampleCursor = 0;
        let chunkCursor = 0;
        for (const s of perFileScaled) {
          mergedStsz.set(s.sampleSizes, sampleCursor);
          relativeChunkOffsets.set(s.chunkOffsets, chunkCursor);
          for (const sc of s.stsc) {
            mergedStsc.push({
              firstChunk: chunkCursor + sc.firstChunk,
              samplesPerChunk: sc.samplesPerChunk,
              sampleDescriptionIndex: sc.sampleDescriptionIndex,
            });
          }
          for (const st of s.stts) {
            mergedStts.push(st);
          }
          sampleCursor += s.sampleSizes.length;
          chunkCursor += s.chunkOffsets.length;
        }

        const totalTrackDuration = mergedStts.reduce(
          (acc, e) => acc + e.sampleCount * e.sampleDelta,
          0
        );
        const durationInMvhd = Math.round(
          (totalTrackDuration / targetTimescale) * mvhdTimescale
        );
        if (durationInMvhd > maxDurationInMvhd) {
          maxDurationInMvhd = durationInMvhd;
        }
        if (totalTrackDuration / targetTimescale > totalDurationSec) {
          totalDurationSec = totalTrackDuration / targetTimescale;
        }

        preMergedTracks.push({
          templateTrak: firstTrackWithType.rawTrakBytes,
          trackId: nextTrackId++,
          effectiveTimescale: targetTimescale,
          totalTrackDuration,
          durationInMvhd,
          mergedStsdEntries,
          mergedStts,
          mergedStss: null,
          mergedCtts: null,
          mergedStsc,
          mergedStsz,
          relativeChunkOffsets,
        });
        continue;
      }

      // Standard zero-copy track table merge (for video at any speed, and audio at 1.0x)
      let totalSampleCount = 0;
      let totalChunkCount = 0;
      let totalStssCount = 0;
      for (const pf of parsedFiles) {
        const tr = pf.tracks.find((t) => t.handlerType === hType);
        if (!tr) continue;
        totalSampleCount += tr.stszSampleCount;
        totalChunkCount += tr.chunkOffsets.length;
        if (hasAnyStss) {
          totalStssCount += tr.stss && tr.stss.length > 0 ? tr.stss.length : 1;
        }
      }

      const mergedStsz = new Uint32Array(totalSampleCount);
      const relativeChunkOffsets = new Float64Array(totalChunkCount);
      const mergedStss = hasAnyStss ? new Uint32Array(totalStssCount) : null;
      const mergedCtts: CttsEntry[] = [];
      const mergedStsc: StscEntry[] = [];

      let cumulativeSamples = 0;
      let cumulativeChunks = 0;
      let cumulativeStss = 0;
      let cumulativeFileByteOffset = 0;

      for (let fIdx = 0; fIdx < parsedFiles.length; fIdx++) {
        const pf = parsedFiles[fIdx];
        const tr = pf.tracks.find((t) => t.handlerType === hType);
        if (!tr) {
          cumulativeFileByteOffset += pf.fileSize;
          continue;
        }

        const timescaleRatio = targetTimescale / tr.timescale;

        const stsdIndexMap = new Map<number, number>();
        for (let sIdx = 0; sIdx < tr.stsdEntries.length; sIdx++) {
          const candidate = tr.stsdEntries[sIdx];
          let existingIdx = mergedStsdEntries.findIndex((e) =>
            areUint8ArraysEqual(e, candidate)
          );
          if (existingIdx === -1) {
            mergedStsdEntries.push(candidate);
            existingIdx = mergedStsdEntries.length - 1;
          }
          stsdIndexMap.set(sIdx + 1, existingIdx + 1);
        }

        let trackTicksInFile = 0;
        let fractionalTickRemainder = 0;
        for (const entry of tr.stts) {
          if (entry.sampleCount <= 0) continue;
          const exactEntryTotal =
            entry.sampleCount * entry.sampleDelta * timescaleRatio + fractionalTickRemainder;
          const targetEntryTicks = Math.max(entry.sampleCount, Math.round(exactEntryTotal));
          fractionalTickRemainder = exactEntryTotal - targetEntryTicks;

          const baseDelta = Math.max(1, Math.floor(targetEntryTicks / entry.sampleCount));
          const remainderTicks = targetEntryTicks - baseDelta * entry.sampleCount;

          if (remainderTicks === 0 || entry.sampleCount === 1) {
            const d = Math.max(1, baseDelta + remainderTicks);
            mergedStts.push({
              sampleCount: entry.sampleCount,
              sampleDelta: d,
            });
            trackTicksInFile += entry.sampleCount * d;
          } else {
            mergedStts.push({
              sampleCount: entry.sampleCount - 1,
              sampleDelta: baseDelta,
            });
            mergedStts.push({
              sampleCount: 1,
              sampleDelta: baseDelta + remainderTicks,
            });
            trackTicksInFile += (entry.sampleCount - 1) * baseDelta + (baseDelta + remainderTicks);
          }
        }

        if (mergedStts.length > 0) {
          const targetClipTicks = Math.round(fileTargetDurationsSec[fIdx] * targetTimescale);
          const diffTicks = targetClipTicks - trackTicksInFile;
          if (diffTicks > 0 && diffTicks < targetTimescale * 5) {
            const lastStts = mergedStts[mergedStts.length - 1];
            if (lastStts.sampleCount === 1) {
              lastStts.sampleDelta += diffTicks;
            } else {
              lastStts.sampleCount -= 1;
              mergedStts.push({
                sampleCount: 1,
                sampleDelta: lastStts.sampleDelta + diffTicks,
              });
            }
          }
        }

        if (mergedStss) {
          if (tr.stss && tr.stss.length > 0) {
            for (let i = 0; i < tr.stss.length; i++) {
              mergedStss[cumulativeStss++] = cumulativeSamples + tr.stss[i];
            }
          } else {
            mergedStss[cumulativeStss++] = cumulativeSamples + 1;
          }
        }

        if (hasAnyCtts) {
          if (tr.ctts && tr.ctts.length > 0) {
            for (const c of tr.ctts) {
              mergedCtts.push({
                sampleCount: c.sampleCount,
                sampleOffset: Math.round(c.sampleOffset * timescaleRatio),
              });
            }
          } else {
            mergedCtts.push({
              sampleCount: tr.stszSampleCount,
              sampleOffset: 0,
            });
          }
        }

        for (const sc of tr.stsc) {
          mergedStsc.push({
            firstChunk: cumulativeChunks + sc.firstChunk,
            samplesPerChunk: sc.samplesPerChunk,
            sampleDescriptionIndex: stsdIndexMap.get(sc.sampleDescriptionIndex) || 1,
          });
        }

        if (tr.stszUniformSize > 0) {
          mergedStsz.fill(
            tr.stszUniformSize,
            cumulativeSamples,
            cumulativeSamples + tr.stszSampleCount
          );
        } else {
          mergedStsz.set(tr.stszSampleSizes, cumulativeSamples);
        }

        for (let i = 0; i < tr.chunkOffsets.length; i++) {
          relativeChunkOffsets[cumulativeChunks + i] =
            cumulativeFileByteOffset + tr.chunkOffsets[i];
        }

        cumulativeSamples += tr.stszSampleCount;
        cumulativeChunks += tr.chunkOffsets.length;
        cumulativeFileByteOffset += pf.fileSize;
      }

      // For video track ('vide'), scale effectiveTimescale by safeSpeed so all frames play at exact safeSpeed!
      const effectiveTimescale =
        hType === 'vide' && isCustomSpeed
          ? Math.max(1, Math.round(targetTimescale * safeSpeed))
          : targetTimescale;

      const totalTrackDuration = mergedStts.reduce(
        (acc, e) => acc + e.sampleCount * e.sampleDelta,
        0
      );
      const durationInMvhd = Math.round(
        (totalTrackDuration / effectiveTimescale) * mvhdTimescale
      );
      if (durationInMvhd > maxDurationInMvhd) {
        maxDurationInMvhd = durationInMvhd;
      }
      if (totalTrackDuration / effectiveTimescale > totalDurationSec) {
        totalDurationSec = totalTrackDuration / effectiveTimescale;
      }

      preMergedTracks.push({
        templateTrak: firstTrackWithType.rawTrakBytes,
        trackId: nextTrackId++,
        effectiveTimescale,
        totalTrackDuration,
        durationInMvhd,
        mergedStsdEntries,
        mergedStts,
        mergedStss,
        mergedCtts: hasAnyCtts ? mergedCtts : null,
        mergedStsc,
        mergedStsz,
        relativeChunkOffsets,
      });
    }

    // Calculate exact moov byte length without allocating stbl buffers twice
    const emptyStblPlaceholder = makeBox('stbl', new Uint8Array(0));
    const expectedMoovSize = (() => {
      const placeholderTraks = preMergedTracks.map((pt) =>
        rebuildTrakWithMergedStbl(
          pt.templateTrak,
          pt.trackId,
          pt.durationInMvhd,
          pt.effectiveTimescale,
          pt.totalTrackDuration,
          emptyStblPlaceholder
        )
      );
      const placeholderMoov = buildMergedMoovBox(
        firstFile.rawMoovBytes,
        mvhdTimescale,
        maxDurationInMvhd,
        placeholderTraks
      );
      let extraStblPayloadBytes = 0;
      for (const pt of preMergedTracks) {
        const stsdLen = pt.mergedStsdEntries.reduce((acc, e) => acc + e.byteLength, 0);
        const stsdBoxLen = 16 + stsdLen;
        const sttsBoxLen = 16 + pt.mergedStts.length * 8;
        const stssBoxLen =
          pt.mergedStss && pt.mergedStss.length > 0 ? 16 + pt.mergedStss.length * 4 : 0;
        const cttsBoxLen =
          pt.mergedCtts && pt.mergedCtts.length > 0 ? 16 + pt.mergedCtts.length * 8 : 0;
        const stscBoxLen = 16 + pt.mergedStsc.length * 12;
        const stszBoxLen = 20 + pt.mergedStsz.length * 4;
        const co64BoxLen = 16 + pt.relativeChunkOffsets.length * 8;
        extraStblPayloadBytes +=
          stsdBoxLen +
          sttsBoxLen +
          stssBoxLen +
          cttsBoxLen +
          stscBoxLen +
          stszBoxLen +
          co64BoxLen;
      }
      return placeholderMoov.byteLength + extraStblPayloadBytes;
    })();

    const exactFirstFileOffset =
      ftypBytes.byteLength + expectedMoovSize + mdatHeaderSize;

    // Build final moov in a single pass with exactFirstFileOffset added to co64 chunk offsets
    const finalTraks = preMergedTracks.map((pt) => {
      const stbl = buildStblBox(
        pt.mergedStsdEntries,
        pt.mergedStts,
        pt.mergedStss,
        pt.mergedCtts,
        pt.mergedStsc,
        pt.mergedStsz,
        pt.relativeChunkOffsets,
        exactFirstFileOffset
      );
      return rebuildTrakWithMergedStbl(
        pt.templateTrak,
        pt.trackId,
        pt.durationInMvhd,
        pt.effectiveTimescale,
        pt.totalTrackDuration,
        stbl
      );
    });
    const finalMoov = buildMergedMoovBox(
      firstFile.rawMoovBytes,
      mvhdTimescale,
      maxDurationInMvhd,
      finalTraks
    );

    // Build 16-byte 64-bit mdat header
    const mdatHeader = new Uint8Array(16);
    const mdatView = new DataView(mdatHeader.buffer);
    mdatView.setUint32(0, 1);
    writeFourCC(mdatView, 4, 'mdat');
    const totalMdatSize = totalRawFilesBytes + 16;
    mdatView.setUint32(8, Math.floor(totalMdatSize / 4294967296));
    mdatView.setUint32(12, totalMdatSize >>> 0);

    // Zero-copy Blob construction referencing the 800MB / 2GB File objects directly on disk!
    const mergedBlob = new Blob(
      [ftypBytes, finalMoov, mdatHeader, ...normalizedFiles] as BlobPart[],
      {
        type: 'video/mp4',
      }
    );

    const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));
    emitCompletedProgress();
    return {
      blob: mergedBlob,
      url: URL.createObjectURL(mergedBlob),
      totalDurationSec,
      originalDurationSec: originalTotalDurationSec,
      clipDurationsSec: fileTargetDurationsSec,
      speedMultiplier: safeSpeed,
      totalSizeBytes: mergedBlob.size,
      elapsedMs,
      clipCount: normalizedFiles.length,
      tsRemuxedCount: tsTotalCount,
      method: 'iso-bmff-instant',
    };
  }

  // Zero-copy fallback for non-MP4 stream containers
  const clipsInfo = await Promise.all(normalizedFiles.map((f) => inspectVideoFile(f)));
  const originalDurationSec = clipsInfo.reduce((acc, c) => acc + c.durationSec, 0);
  const totalDurationSec = originalDurationSec / safeSpeed;
  const mergedBlob = new Blob(normalizedFiles, {
    type:
      normalizedFiles[0].type && normalizedFiles[0].type.startsWith('video/')
        ? normalizedFiles[0].type
        : 'video/mp4',
  });
  const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));
  emitCompletedProgress();

  return {
    blob: mergedBlob,
    url: URL.createObjectURL(mergedBlob),
    totalDurationSec,
    originalDurationSec,
    clipDurationsSec: clipsInfo.map((c) => c.durationSec),
    speedMultiplier: safeSpeed,
    totalSizeBytes: mergedBlob.size,
    elapsedMs,
    clipCount: normalizedFiles.length,
    tsRemuxedCount: tsTotalCount,
    method: 'blob-concat',
  };
}
