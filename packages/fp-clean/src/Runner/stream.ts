import { CircularDependencyError, type Context } from "../Context";
import { flatMap, fromStreamResult, type Operation } from "../Operation";
import { type OperationRuntime } from "../Operation/runtime";
import { pipe } from "../pipe";
import * as Result from "../Result";
import { resolve } from "./resolve";

export async function* stream<A, E, R_Op, R_Ctx, S_Ctx extends R_Op, CE>(
  op: Operation<A, E, R_Op>,
  ctx: Context<R_Ctx, S_Ctx, CE>,
): AsyncGenerator<Result.Result<A, E | CE>, void, unknown> {
  const controller = new AbortController();

  const runtime: OperationRuntime = {
    abortSignal: controller.signal,
    abort: (reason?: string) => controller.abort(reason),
  };

  try {
    yield* pipe(
      resolve(ctx),
      flatMap((env) => fromStreamResult(op(env))),
    )(runtime as any)();
  } catch (err) {
    if (err instanceof CircularDependencyError) throw err; // Rethrow circular dependency errors to avoid masking them
    yield Result.err(err as E | CE);
  } finally {
    controller.abort("Stream terminated");
  }
}
