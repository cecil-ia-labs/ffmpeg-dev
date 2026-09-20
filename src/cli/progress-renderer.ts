import path from "node:path";

import type { FFmpegProgressEvent } from "../core/progress.js";
import type { ProgressRunSummary, ProgressSummary } from "../types/contracts.js";
import { colorizeProgressLine } from "./colors.js";
import { CLI_ICONS, progressSourceIcon } from "./icons.js";

export type ProgressWriter = (text: string) => void;

export interface CliProgressReporterOptions {
  enabled: boolean;
  isTTY?: boolean;
  friendly?: boolean;
  write?: ProgressWriter;
  now?: () => number;
}

function finite(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

export function formatProgressDuration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return "--:--:--";
  const rounded = Math.max(0, Math.round(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

function labelFor(event: FFmpegProgressEvent): string {
  if (!event.source) return event.runId;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(event.source)) return event.source;
  return path.basename(event.source);
}

export function formatHumanProgress(event: FFmpegProgressEvent, friendly = false): string {
  const source = labelFor(event);
  const parts = [friendly ? `${progressSourceIcon(event.source)} ${source}` : source];

  if (event.percentage !== undefined) {
    const status = event.state === "end" ? CLI_ICONS.completed : CLI_ICONS.progress;
    parts.push(friendly ? `${status}\t\b\b\b${Math.round(event.percentage)}%` : `${Math.round(event.percentage)}%`);
  }

  if (event.frame !== undefined) {
    parts.push(friendly ? `${CLI_ICONS.frame}\t\b\b\b${event.frame}frames` : `frame ${event.frame}`);
  }
  if (event.fps !== undefined) {
    parts.push(
      friendly
        ? `${CLI_ICONS.fps} ${event.fps}fps`
        : `${event.fps.toFixed(1)} fps`,
    );
  }
  if (event.speedMultiplier !== undefined) {
    parts.push(
      friendly
        ? `${CLI_ICONS.speed} ${event.speedMultiplier.toFixed(1)}x`
        : `${event.speedMultiplier.toFixed(2)}x`,
    );
  }
  if (event.etaSeconds !== undefined) {
    parts.push(
      friendly
        ? `${CLI_ICONS.eta} ETA ${formatProgressDuration(event.etaSeconds)}`
        : `ETA ${formatProgressDuration(event.etaSeconds)}`,
    );
  }
  return parts.join(friendly ? "\t| " : " | ");
}

export class CliProgressReporter {
  private readonly enabled: boolean;
  private readonly isTTY: boolean;
  private readonly friendly: boolean;
  private readonly write: ProgressWriter;
  private readonly now: () => number;
  private readonly runs = new Map<string, ProgressRunSummary>();
  private readonly lastRenderedAt = new Map<string, number>();
  private readonly lastBucket = new Map<string, number>();
  private ttyLineOpen = false;

  constructor(options: CliProgressReporterOptions) {
    this.enabled = options.enabled;
    this.isTTY = options.isTTY ?? Boolean(process.stderr.isTTY);
    this.friendly = options.friendly ?? this.isTTY;
    this.write = options.write ?? ((text) => process.stderr.write(text));
    this.now = options.now ?? (() => Date.now());
  }

  readonly onEvent = (event: FFmpegProgressEvent): void => {
    const totalSeconds = finite(event.totalSeconds);
    const processedSeconds = finite(event.processedSeconds);
    const percentage = finite(event.percentage);
    const fps = finite(event.fps);
    const speedMultiplier = finite(event.speedMultiplier);
    const etaSeconds = finite(event.etaSeconds);
    const summary: ProgressRunSummary = {
      runId: event.runId,
      state: event.state,
      estimated: event.estimated,
      ...(event.source !== undefined ? { source: event.source } : {}),
      ...(totalSeconds !== undefined ? { totalSeconds } : {}),
      ...(processedSeconds !== undefined ? { processedSeconds } : {}),
      ...(percentage !== undefined ? { percentage } : {}),
      ...(event.frame !== undefined ? { frame: event.frame } : {}),
      ...(fps !== undefined ? { fps } : {}),
      ...(speedMultiplier !== undefined ? { speedMultiplier } : {}),
      ...(etaSeconds !== undefined ? { etaSeconds } : {}),
    };
    this.runs.set(event.runId, summary);

    if (!this.enabled) return;
    if (this.isTTY) {
      const now = this.now();
      const last = this.lastRenderedAt.get(event.runId) ?? 0;
      if (event.state !== "end" && now - last < 125) return;
      this.lastRenderedAt.set(event.runId, now);
      const line = formatHumanProgress(event, this.friendly);
      this.write(`\r\u001b[2K${colorizeProgressLine(line, this.friendly)}`);
      this.ttyLineOpen = true;
      if (event.state === "end") {
        this.write("\n");
        // this.write("\n");
        this.ttyLineOpen = false;
      }
      return;
    }

    const renderPercentage = event.percentage;
    const bucket = renderPercentage === undefined
      ? undefined
      : Math.floor(Math.min(100, renderPercentage) / 25) * 25;
    const lastBucket = this.lastBucket.get(event.runId);
    if (event.state === "end" || (bucket !== undefined && bucket !== lastBucket)) {
      if (bucket !== undefined) this.lastBucket.set(event.runId, bucket);
      this.write(`${formatHumanProgress(event, false)}\n`);
    }
  };

  finish(): void {
    if (this.enabled && this.ttyLineOpen) {
      this.write("\n");
      this.ttyLineOpen = false;
    }
  }

  summary(): ProgressSummary | undefined {
    if (this.runs.size === 0) return undefined;
    const runs = [...this.runs.values()];
    return {
      runs,
      completedRuns: runs.filter((run) => run.state === "end").length,
    };
  }
}
