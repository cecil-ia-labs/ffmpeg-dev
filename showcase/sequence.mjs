// Browser-only timeline math. This module does not touch media, network, or the DOM.
export function sequenceDuration(videos) {
  return videos.reduce((total, clip) => total + Math.max(0, clip.end - clip.start), 0);
}

export function locateSequenceTime(videos, seconds) {
  if (!videos.length) return null;
  const total = sequenceDuration(videos);
  if (!(total > 0) || !Number.isFinite(seconds)) return null;
  const position = Math.min(total, Math.max(0, seconds));
  let start = 0;
  for (let index = 0; index < videos.length; index++) {
    const clip = videos[index];
    const length = Math.max(0, clip.end - clip.start);
    const finish = start + length;
    if (position < finish || index === videos.length - 1) {
      return {
        clip, index,
        position,
        sequenceStart: start,
        sourceTime: clip.start + Math.min(length, Math.max(0, position - start)),
        total,
        atEnd: position >= total,
      };
    }
    start = finish;
  }
  return null;
}

export function soundtrackTimeAt(audio, sequenceSeconds) {
  if (!audio || !Number.isFinite(sequenceSeconds)) return null;
  const relative = sequenceSeconds - audio.offset;
  if (relative < 0 || relative >= audio.end - audio.start) return null;
  return audio.start + relative;
}
