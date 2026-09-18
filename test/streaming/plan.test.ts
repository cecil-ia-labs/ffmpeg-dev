import { describe, expect, it } from "vitest";

import {
  buildCameraStreamPlan,
  buildFileStreamPlan,
  inferTransport,
  resolveCameraInputFormat,
  resolveDestination,
} from "../../src/streaming/index.js";

describe("Milestone 9 stream planning", () => {
  it("infers supported network transports from URL schemes", () => {
    expect(inferTransport("https://localhost:8083/live")).toBe("http");
    expect(inferTransport("rtmp://localhost/live/key")).toBe("rtmp");
    expect(inferTransport("rtsp://localhost/live")).toBe("rtsp");
    expect(inferTransport("srt://localhost:9000?mode=caller")).toBe("srt");
    expect(inferTransport("udp://127.0.0.1:9000")).toBe("udp");
    expect(inferTransport("tcp://127.0.0.1:9000")).toBe("tcp");
  });

  it("assigns protocol-appropriate containers", () => {
    expect(resolveDestination({ url: "rtmp://localhost/live" })).toMatchObject({
      transport: "rtmp",
      container: "flv",
    });
    expect(resolveDestination({ url: "udp://127.0.0.1:9000" })).toMatchObject({
      transport: "udp",
      container: "mpegts",
    });
    expect(resolveDestination({ url: "rtsp://localhost/live" })).toMatchObject({
      transport: "rtsp",
      container: "rtsp",
      rtspTransport: "tcp",
    });
  });

  it("rejects direct WebSocket output rather than mislabeling HTTP", () => {
    expect(() => inferTransport("ws://localhost:8083/live")).toThrow(/WebSocket relay/);
    expect(() =>
      resolveDestination({ url: "http://localhost:8083/live", transport: "websocket" }),
    ).toThrow(/Direct WebSocket streaming/);
  });

  it("builds the legacy V4L2/JSMpeg-shaped camera plan without shell strings", () => {
    const plan = buildCameraStreamPlan({
      device: "/dev/video0",
      inputFormat: "v4l2",
      framerate: 15,
      videoSize: "320x240",
      url: "http://localhost:8083/juninhotest-uuid",
      transport: "http",
      container: "mpegts",
      videoCodec: "mpeg1video",
      videoBitrate: "500k",
      audioCodec: "none",
    });
    expect(plan.args).toEqual(
      expect.arrayContaining([
        "-f",
        "v4l2",
        "-framerate",
        "15",
        "-video_size",
        "320x240",
        "-c:v",
        "mpeg1video",
        "-bf",
        "0",
        "-b:v",
        "500k",
        "-f",
        "mpegts",
        "http://localhost:8083/juninhotest-uuid",
      ]),
    );
  });

  it("uses platform camera defaults deterministically", () => {
    expect(resolveCameraInputFormat(undefined, "linux")).toBe("v4l2");
    expect(resolveCameraInputFormat(undefined, "darwin")).toBe("avfoundation");
    expect(resolveCameraInputFormat(undefined, "win32")).toBe("dshow");
  });

  it("builds file plans with realtime input pacing", () => {
    const plan = buildFileStreamPlan("/tmp/clip.mp4", undefined, {
      url: "udp://127.0.0.1:9000",
      audioCodec: "none",
    });
    expect(plan.args.slice(0, 4)).toEqual(["-hide_banner", "-re", "-i", "/tmp/clip.mp4"]);
  });
});
