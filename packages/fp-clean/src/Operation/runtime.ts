export const OperationRuntimeSymbol = Symbol.for("OperationRuntime");

export interface OperationRuntime {
  readonly abortSignal: AbortSignal;

  abort(reason?: string): void;
}

export class InvalidRuntime extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRuntime";
  }
}

export function getRuntimeFromEnv<
  R extends { [OperationRuntimeSymbol]?: OperationRuntime },
>(r: R) {
  const runtime = r[OperationRuntimeSymbol];

  if (!runtime) {
    throw new InvalidRuntime(
      "Operation runtime is not available in the current environment. Did you forget to wire the operation?",
    );
  }

  return runtime;
}
