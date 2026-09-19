import type { Command } from "commander";

import { runDoctorAction, runEnvironmentCapabilitiesAction, runEnvironmentInstallAction, runEnvironmentVersionAction, runProbeAction } from "./actions/milestone-3.js";
import { runTrimEndAction, runTrimRangeAction, runTrimStartAction, runVideoFromImageAction, runVideoRestoreAction, runVideoSpeedAction, runVideoUpscaleAction } from "./actions/milestone-4.js";
import { runAudioAddSilenceAction, runAudioAttachAction, runAudioDetectSilenceAction, runAudioRemoveSilenceAction, runAudioSilenceAction, runAudioTelephonyAction } from "./actions/milestone-5.js";
import { runConvertBatchAction, runConvertFileAction } from "./actions/milestone-6.js";
import { runComposeConcatAction, runComposeSlideshowAction, runComposeTransitionAction } from "./actions/milestone-7.js";
import { runDiagnoseAction, runRepairNormalizeAction, runRepairTimestampsAction } from "./actions/milestone-8.js";
import { runStreamCameraAction, runStreamFileAction } from "./actions/milestone-9.js";
import { runImageConvertAction, runImageExtractAction } from "./actions/milestone-13-5.js";

export type CommandAction = (command: Command, positional: readonly unknown[]) => Promise<void> | void;

const ACTIONS: Readonly<Record<string, CommandAction>> = {
  "cecilia-ffmpeg doctor": runDoctorAction,
  "cecilia-ffmpeg probe": runProbeAction,
  "cecilia-ffmpeg environment capabilities": runEnvironmentCapabilitiesAction,
  "cecilia-ffmpeg environment version": runEnvironmentVersionAction,
  "cecilia-ffmpeg environment install": runEnvironmentInstallAction,
  "cecilia-ffmpeg video trim-start": runTrimStartAction,
  "cecilia-ffmpeg video trim-end": runTrimEndAction,
  "cecilia-ffmpeg video trim": runTrimRangeAction,
  "cecilia-ffmpeg video speed": runVideoSpeedAction,
  "cecilia-ffmpeg video from-image": runVideoFromImageAction,
  "cecilia-ffmpeg video upscale": runVideoUpscaleAction,
  "cecilia-ffmpeg video restore": runVideoRestoreAction,
  "cecilia-ffmpeg video attach-audio": runAudioAttachAction,
  "cecilia-ffmpeg video add-silence": runAudioAddSilenceAction,
  "cecilia-ffmpeg image convert": runImageConvertAction,
  "cecilia-ffmpeg image extract": runImageExtractAction,
  "cecilia-ffmpeg audio attach": runAudioAttachAction,
  "cecilia-ffmpeg audio silence": runAudioSilenceAction,
  "cecilia-ffmpeg audio add-silence": runAudioAddSilenceAction,
  "cecilia-ffmpeg audio detect-silence": runAudioDetectSilenceAction,
  "cecilia-ffmpeg audio remove-silence": runAudioRemoveSilenceAction,
  "cecilia-ffmpeg audio telephony": runAudioTelephonyAction,
  "cecilia-ffmpeg convert file": runConvertFileAction,
  "cecilia-ffmpeg convert batch": runConvertBatchAction,
  "cecilia-ffmpeg compose concat": runComposeConcatAction,
  "cecilia-ffmpeg compose transition": runComposeTransitionAction,
  "cecilia-ffmpeg compose slideshow": runComposeSlideshowAction,
  "cecilia-ffmpeg diagnose": runDiagnoseAction,
  "cecilia-ffmpeg repair timestamps": runRepairTimestampsAction,
  "cecilia-ffmpeg repair normalize": runRepairNormalizeAction,
  "cecilia-ffmpeg stream camera": runStreamCameraAction,
  "cecilia-ffmpeg stream file": runStreamFileAction,
};

export function resolveCommandAction(path: string): CommandAction | undefined {
  return ACTIONS[path];
}
