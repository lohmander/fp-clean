import { asOperation } from "../Operation/internal/asOperation";
import { CircularDependencyError, type Env } from "../Env";
import { flatMap, type Operation } from "../Operation";
import { createRuntime } from "../Operation/runtime";
import { pipe } from "../pipe";
import * as Result from "../Result";
import { resolve } from "./resolve";

export async function* stream<Ok, Err, R_Op, R_Ctx, S_Ctx extends R_Op, CE>(
  op: Operation<Ok, Err, R_Op>,
  ctx: Env<R_Ctx, S_Ctx, CE>,
): AsyncGenerator<Result.Result<Ok, Err | CE>, void, unknown> {
  const [controller, runtime] = createRuntime();

  try {
    yield* pipe(
      resolve(ctx),
      flatMap((env) => asOperation(() => op({ ...env, ...runtime }))),
    )(runtime as any)();
  } catch (err) {
    if (err instanceof CircularDependencyError) throw err; // Rethrow circular dependency errors to avoid masking them
    yield Result.err(err as Err | CE);
  } finally {
    controller.abort("Stream terminated");
  }
}
