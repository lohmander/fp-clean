import type { ReaderStreamResult } from "../../ReaderStreamResult";
import type { Operation, YieldWrap } from "../types";

export const asOperation = <A, E, R>(
  rsr: ReaderStreamResult<A, E, R>,
): Operation<A, E, R> => {
  const fa = rsr as Operation<A, E, R>;

  fa[Symbol.iterator] = function* (): Generator<YieldWrap<A, E, R>, A, any> {
    const y: YieldWrap<A, E, R> = { operation: fa } as YieldWrap<A, E, R>;
    return (yield y) as A;
  };

  return fa;
};
