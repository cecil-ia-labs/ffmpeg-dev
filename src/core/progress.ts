export interface FFmpegProgressSnapshot {
  frame?: number;
  fps?: number;
  stream0_0Q?: number;
  bitrate?: string;
  totalSize?: number;
  outTimeUs?: number;
  outTimeMs?: number;
  outTime?: string;
  dupFrames?: number;
  dropFrames?: number;
  speed?: string;
  progress: string;
  raw: Readonly<Record<string, string>>;
}

function optionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "N/A") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toSnapshot(values: Record<string, string>): FFmpegProgressSnapshot {
  const frame = optionalNumber(values["frame"]);
  const fps = optionalNumber(values["fps"]);
  const stream0_0Q = optionalNumber(values["stream_0_0_q"]);
  const totalSize = optionalNumber(values["total_size"]);
  const outTimeUs = optionalNumber(values["out_time_us"]);
  const outTimeMs = optionalNumber(values["out_time_ms"]);
  const dupFrames = optionalNumber(values["dup_frames"]);
  const dropFrames = optionalNumber(values["drop_frames"]);
  const bitrate = values["bitrate"];
  const outTime = values["out_time"];
  const speed = values["speed"];

  return {
    ...(frame !== undefined ? { frame } : {}),
    ...(fps !== undefined ? { fps } : {}),
    ...(stream0_0Q !== undefined ? { stream0_0Q } : {}),
    ...(bitrate !== undefined ? { bitrate } : {}),
    ...(totalSize !== undefined ? { totalSize } : {}),
    ...(outTimeUs !== undefined ? { outTimeUs } : {}),
    ...(outTimeMs !== undefined ? { outTimeMs } : {}),
    ...(outTime !== undefined ? { outTime } : {}),
    ...(dupFrames !== undefined ? { dupFrames } : {}),
    ...(dropFrames !== undefined ? { dropFrames } : {}),
    ...(speed !== undefined ? { speed } : {}),
    progress: values["progress"] ?? "continue",
    raw: { ...values },
  };
}

/** Incremental parser for FFmpeg `-progress pipe:N` key/value output. */
export class FFmpegProgressParser {
  private buffer = "";
  private values: Record<string, string> = {};

  push(chunk: string): FFmpegProgressSnapshot[] {
    this.buffer += chunk;
    const snapshots: FFmpegProgressSnapshot[] = [];

    while (true) {
      const newline = this.buffer.indexOf("\n");
      if (newline < 0) break;
      const line = this.buffer.slice(0, newline).replace(/\r$/, "");
      this.buffer = this.buffer.slice(newline + 1);
      const snapshot = this.consumeLine(line);
      if (snapshot) snapshots.push(snapshot);
    }

    return snapshots;
  }

  flush(): FFmpegProgressSnapshot[] {
    const snapshots: FFmpegProgressSnapshot[] = [];
    if (this.buffer.length > 0) {
      const snapshot = this.consumeLine(this.buffer.replace(/\r$/, ""));
      if (snapshot) snapshots.push(snapshot);
      this.buffer = "";
    }
    return snapshots;
  }

  private consumeLine(line: string): FFmpegProgressSnapshot | undefined {
    if (!line) return undefined;
    const separator = line.indexOf("=");
    if (separator <= 0) return undefined;
    const key = line.slice(0, separator);
    const value = line.slice(separator + 1);
    this.values[key] = value;

    if (key !== "progress") return undefined;
    const snapshot = toSnapshot(this.values);
    this.values = {};
    return snapshot;
  }
}
