import type { Result } from "../../Result";
import type { Operation, YieldWrap } from "../types";
import { OperationBrand } from "../types";

export const asOperation = <Ok, Err, Req>(
  rsr: (r: Req) => () => AsyncGenerator<Result<Ok, Err>, void, any>,
): Operation<Ok, Err, Req> => {
  const fa = rsr as Operation<Ok, Err, Req>;

  fa[Symbol.iterator] = function* (): Generator<
    YieldWrap<Ok, Err, Req>,
    Ok,
    any
  > {
    const y: YieldWrap<Ok, Err, Req> = { operation: fa } as YieldWrap<
      Ok,
      Err,
      Req
    >;
    return (yield y) as Ok;
  };

  (fa as any)[OperationBrand] = true;

  return fa;
};
