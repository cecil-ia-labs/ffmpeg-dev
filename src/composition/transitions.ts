import type { XfadeTransition } from "./types.js";

const NATIVE = new Set<XfadeTransition>([
  "fade", "fadeblack", "fadewhite", "wipeleft", "wiperight", "slideup", "slidedown",
  "circleopen", "circleclose", "dissolve", "pixelize", "distance", "zoomin",
]);

export const COMPOSITION_TRANSITIONS: ReadonlySet<XfadeTransition> = new Set([
  ...NATIVE,
  "zoomout",
]);

function zoomoutExpression(): string {
  // Shrink the outgoing frame around the center while revealing the incoming frame.
  return "if(between(X,W*P*0.15,W*(1-P*0.15))*between(Y,H*P*0.15,H*(1-P*0.15)),a0((X-W*P*0.15)/(1-0.3*P),(Y-H*P*0.15)/(1-0.3*P)),b0(X,Y))";
}

export function xfadeFilter(
  transition: XfadeTransition,
  duration: number,
  offset: number,
): string {
  if (transition === "zoomout") {
    return `xfade=transition=custom:duration=${duration}:offset=${Number(offset.toFixed(6))}:expr='${zoomoutExpression()}'`;
  }
  return `xfade=transition=${transition}:duration=${duration}:offset=${Number(offset.toFixed(6))}`;
}
