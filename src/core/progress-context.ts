import { AsyncLocalStorage } from "node:async_hooks";

import type { MediaInfo } from "../types/contracts.js";
import type { FFmpegProgressEvent } from "./progress.js";

export type ProgressObserver = (event: FFmpegProgressEvent) => void;

interface ProgressContextState {
  observer: ProgressObserver;
  mediaDurations: Map<string, number>;
  nextRunNumber: number;
}

const storage = new AsyncLocalStorage<ProgressContextState>();

function durationOf(media: MediaInfo): number | undefined {
  return media.format.durationSeconds
    ?? media.video[0]?.durationSeconds
    ?? media.audio[0]?.durationSeconds;
}

export async function withProgressObserver<T>(
  observer: ProgressObserver,
  operation: () => Promise<T>,
): Promise<T> {
  return await storage.run(
    {
      observer,
      mediaDurations: new Map<string, number>(),
      nextRunNumber: 1,
    },
    operation,
  );
}

export function currentProgressObserver(): ProgressObserver | undefined {
  return storage.getStore()?.observer;
}

export function registerProgressMedia(media: MediaInfo): void {
  const state = storage.getStore();
  if (!state) return;
  const duration = durationOf(media);
  if (duration !== undefined && Number.isFinite(duration) && duration > 0) {
    state.mediaDurations.set(media.source, duration);
  }
}

export function progressMediaDuration(source: string): number | undefined {
  return storage.getStore()?.mediaDurations.get(source);
}

export function nextProgressRunId(): string {
  const state = storage.getStore();
  if (!state) return "ffmpeg";
  const value = state.nextRunNumber;
  state.nextRunNumber += 1;
  return `ffmpeg-${value}`;
}
