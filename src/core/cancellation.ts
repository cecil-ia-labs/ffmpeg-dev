export interface ProcessSignalController {
  signal: AbortSignal;
  dispose(): void;
}

export interface ProcessSignalControllerOptions {
  signals?: readonly NodeJS.Signals[];
}

/**
 * Bridge process signals to AbortSignal for CLI entrypoints. Library callers
 * can instead pass their own AbortSignal directly to the runners.
 */
export function createProcessSignalController(
  options: ProcessSignalControllerOptions = {},
): ProcessSignalController {
  const controller = new AbortController();
  const signals = options.signals ?? (["SIGINT", "SIGTERM"] as const);
  const listeners = new Map<NodeJS.Signals, () => void>();

  for (const signal of signals) {
    const listener = (): void => {
      if (!controller.signal.aborted) {
        controller.abort(new Error(`Received ${signal}`));
      }
    };
    listeners.set(signal, listener);
    process.once(signal, listener);
  }

  return {
    signal: controller.signal,
    dispose(): void {
      for (const [signal, listener] of listeners) {
        process.removeListener(signal, listener);
      }
      listeners.clear();
    },
  };
}
