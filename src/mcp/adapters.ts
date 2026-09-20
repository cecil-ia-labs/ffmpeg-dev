import { attachAudio, generateSilence, removeSilence } from "../audio/index.js";
import { concatMedia } from "../composition/index.js";
import { convertFile } from "../conversion/index.js";
import { diagnoseMedia } from "../diagnostics/index.js";
import { probeMedia } from "../media/index.js";
import { trimVideoRange, upscaleVideo } from "../video/index.js";
import { runtimeOptions } from "./runtime.js";
import type {
  MediaAttachAudioInput,
  MediaConcatInput,
  MediaConvertInput,
  MediaDiagnoseInput,
  MediaGenerateSilenceInput,
  MediaProbeInput,
  MediaRemoveSilenceInput,
  MediaRestoreInput,
  MediaTrimInput,
} from "./schemas.js";

export async function mediaProbeAdapter(input: MediaProbeInput, signal: AbortSignal) {
  return await probeMedia(input.input, {
    dryRun: input.dry_run,
    verbose: input.verbose,
    ...(input.ffprobe_path !== undefined ? { ffprobePath: input.ffprobe_path } : {}),
    ...(input.cwd !== undefined ? { cwd: input.cwd } : {}),
    signal,
  });
}

export async function mediaTrimAdapter(input: MediaTrimInput, signal: AbortSignal) {
  return await trimVideoRange(input.input, {
    ...runtimeOptions(input, signal),
    start: input.start,
    ...(input.end !== undefined ? { end: input.end } : {}),
    ...(input.duration !== undefined ? { duration: input.duration } : {}),
    mode: input.mode,
  });
}

export async function mediaConvertAdapter(input: MediaConvertInput, signal: AbortSignal) {
  return await convertFile(input.input, {
    ...runtimeOptions(input, signal),
    to: input.to,
    ...(input.from !== undefined ? { from: input.from } : {}),
    ...(input.fps !== undefined ? { fps: input.fps } : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.fit !== undefined ? { fit: input.fit } : {}),
    ...(input.background !== undefined ? { background: input.background } : {}),
    ...(input.quality !== undefined ? { quality: input.quality } : {}),
    ...(input.max_colors !== undefined ? { maxColors: input.max_colors } : {}),
    ...(input.loop !== undefined ? { loop: input.loop } : {}),
    ...(input.audio_bitrate !== undefined ? { audioBitrate: input.audio_bitrate } : {}),
    ...(input.sample_rate !== undefined ? { sampleRate: input.sample_rate } : {}),
    ...(input.channels !== undefined ? { channels: input.channels } : {}),
    hardware: input.hardware,
    ...(input.hardware_device !== undefined ? { hardwareDevice: input.hardware_device } : {}),
    hardwareStrict: input.hardware_strict,
  });
}

export async function mediaConcatAdapter(input: MediaConcatInput, signal: AbortSignal) {
  return await concatMedia(input.inputs, {
    ...runtimeOptions(input, signal),
    transition: input.transition,
    transitionDuration: input.transition_duration,
    audio: input.audio,
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.fps !== undefined ? { fps: input.fps } : {}),
    ...(input.fit !== undefined ? { fit: input.fit } : {}),
    ...(input.background !== undefined ? { background: input.background } : {}),
    to: input.to,
  });
}

export async function mediaAttachAudioAdapter(input: MediaAttachAudioInput, signal: AbortSignal) {
  return await attachAudio(input.video, input.audio, {
    ...runtimeOptions(input, signal),
    mode: input.mode,
    videoMode: input.video_mode,
    pad: input.pad,
  });
}

export async function mediaRemoveSilenceAdapter(input: MediaRemoveSilenceInput, signal: AbortSignal) {
  return await removeSilence(input.input, {
    ...runtimeOptions(input, signal),
    noiseDb: input.noise_db,
    minDuration: input.min_duration,
    keepSilence: input.keep_silence,
  });
}

export async function mediaGenerateSilenceAdapter(input: MediaGenerateSilenceInput, signal: AbortSignal) {
  return await generateSilence({
    ...runtimeOptions(input, signal),
    duration: input.duration,
    sampleRate: input.sample_rate,
    channels: input.channels,
    ...(input.channel_layout !== undefined ? { channelLayout: input.channel_layout } : {}),
  });
}

export async function mediaRestoreAdapter(input: MediaRestoreInput, signal: AbortSignal) {
  return await upscaleVideo(input.input, {
    ...runtimeOptions(input, signal),
    width: input.width,
    height: input.height,
    profile: input.profile,
    ...(input.fps !== undefined ? { fps: input.fps } : {}),
    ...(input.crf !== undefined ? { crf: input.crf } : {}),
    ...(input.preset !== undefined ? { preset: input.preset } : {}),
    ...(input.fit !== undefined ? { fit: input.fit } : {}),
    ...(input.background !== undefined ? { background: input.background } : {}),
    to: input.to,
    hardware: input.hardware,
    ...(input.hardware_device !== undefined ? { hardwareDevice: input.hardware_device } : {}),
    hardwareStrict: input.hardware_strict,
  });
}

export async function mediaDiagnoseAdapter(input: MediaDiagnoseInput, signal: AbortSignal) {
  return await diagnoseMedia(input.input, {
    ...(input.ffmpeg_path !== undefined ? { ffmpegPath: input.ffmpeg_path } : {}),
    ...(input.ffprobe_path !== undefined ? { ffprobePath: input.ffprobe_path } : {}),
    dryRun: input.dry_run,
    verbose: input.verbose,
    signal,
    deep: input.deep,
    freezeNoiseDb: input.freeze_noise_db,
    freezeDuration: input.freeze_duration,
    ...(input.log_text !== undefined ? { logText: input.log_text } : {}),
  });
}
