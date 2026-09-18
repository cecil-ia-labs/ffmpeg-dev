import { ToolkitRuntimeError } from "../core/errors.js";
import { encodingArgs, resolveEncodingProfile } from "./encoding.js";
import { executeVideoTransform, inspectInput, positiveFinite, requireVideo } from "./helpers.js";
import { deriveOutputPath, resolveReadableFile } from "./io.js";
import type { RestoreProfile, RestoreVideoRequest, VideoOperationReport } from "./types.js";

function validateProfile(value: RestoreProfile | undefined): RestoreProfile {
  const profile = value ?? "balanced";
  if (profile !== "balanced" && profile !== "aggressive") {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", "profile must be balanced or aggressive.", {
      details: { profile },
    });
  }
  return profile;
}

export function buildRestoreFilter(width: number, height: number, profile: RestoreProfile): string {
  const geometry = `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
  if (profile === "balanced") return geometry;
  return [
    "bwdif=mode=send_frame:parity=auto:deint=interlaced",
    "deblock=filter=strong:block=8:alpha=0.12:beta=0.07:gamma=0.06:delta=0.05",
    "hqdn3d=2.4:1.8:4.0:3.0",
    "nlmeans=s=2.4:p=7:r=15",
    geometry,
    "unsharp=3:3:0.18:3:3:0.0",
  ].join(",");
}

export async function restoreVideo(input: string, request: RestoreVideoRequest): Promise<VideoOperationReport> {
  const source = await resolveReadableFile(input, request.cwd);
  const width = Math.trunc(positiveFinite(request.width, "width"));
  const height = Math.trunc(positiveFinite(request.height, "height"));
  const profileName = validateProfile(request.profile);
  const fps = request.fps === undefined ? undefined : positiveFinite(request.fps, "fps");
  const crf = request.crf ?? (profileName === "aggressive" ? 14 : 18);
  if (!Number.isFinite(crf) || crf < 0 || crf > 63) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", "crf must be between 0 and 63.", { details: { crf } });
  }
  const preset = request.preset ?? (profileName === "aggressive" ? "slow" : "medium");
  const media = await inspectInput(source, request);
  requireVideo(media, source);

  const output = deriveOutputPath(source, `restore-${width}x${height}`, request.output, { ...(request.cwd !== undefined ? { ...(request.cwd !== undefined ? { cwd: request.cwd } : {}) } : {}), defaultExtension: ".mp4" });
  const encoding = resolveEncodingProfile(output, { crf, preset });
  const filter = buildRestoreFilter(width, height, profileName);
  const hasAudio = media.audio.length > 0;

  return await executeVideoTransform({
    operation: "restore",
    source,
    output,
    argsBeforeOutput: [
      "-i", source,
      "-map", "0:v:0",
      ...(hasAudio ? ["-map", "0:a?"] : []),
      "-vf", filter,
      ...(fps !== undefined ? ["-r", String(fps)] : []),
      ...encodingArgs(encoding, hasAudio),
      "-map_metadata", "0",
    ],
    runtime: request,
    inputMedia: media,
    details: { width, height, profile: profileName, ...(fps !== undefined ? { fps } : {}), crf, preset },
  });
}
