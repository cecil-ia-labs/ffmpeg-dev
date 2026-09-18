import { encodingArgs, resolveEncodingProfile } from "./encoding.js";
import { executeVideoTransform, positiveFinite } from "./helpers.js";
import { deriveOutputPath, resolveReadableFile } from "./io.js";
import type { VideoFromImageRequest, VideoOperationReport } from "./types.js";

export async function createVideoFromImage(input: string, request: VideoFromImageRequest = {}): Promise<VideoOperationReport> {
  const source = await resolveReadableFile(input, request.cwd);
  const duration = positiveFinite(request.duration ?? 5, "duration");
  const width = Math.trunc(positiveFinite(request.width ?? 1920, "width"));
  const height = Math.trunc(positiveFinite(request.height ?? 1080, "height"));
  const fps = positiveFinite(request.fps ?? 30, "fps");
  const pixelFormat = request.pixelFormat ?? "yuv420p";
  const output = deriveOutputPath(source, "clip", request.output, { ...(request.cwd !== undefined ? { ...(request.cwd !== undefined ? { cwd: request.cwd } : {}) } : {}), defaultExtension: ".mp4" });
  const profile = resolveEncodingProfile(output);
  const filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=${pixelFormat}`;

  return await executeVideoTransform({
    operation: "from-image",
    source,
    output,
    argsBeforeOutput: [
      "-loop", "1",
      "-framerate", String(fps),
      "-i", source,
      "-t", String(duration),
      "-vf", filter,
      "-r", String(fps),
      ...encodingArgs(profile, false),
    ],
    runtime: request,
    details: { duration, width, height, fps, pixelFormat },
  });
}
