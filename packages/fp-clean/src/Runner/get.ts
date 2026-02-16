import type { Env } from "../Env";
import type { Operation } from "../Operation";
import * as Result from "../Result";
import { stream } from "./stream";

export async function get<A, E, R_Op, R_Ctx, S_Ctx extends R_Op, CE>(
  op: Operation<A, E, R_Op>,
  ctx: Env<R_Ctx, S_Ctx, CE>,
): Promise<Result.Result<A, E | CE>> {
  // Leverage the stream function to get the first value yielded by the operation
  const it = stream(op, ctx);

  try {
    const { value, done } = await it.next();

    if (done || !value) {
      throw new Error("Operation completed without yielding a result.");
    }

    return value;
  } finally {
    // Ensure we clean up the generator to free resources
    await it.return(undefined);
  }
}
