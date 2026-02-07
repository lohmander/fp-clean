import { asOperation } from "./internal/asOperation";
import { err, ok } from "./constructors";
import {
  type AnyOperation,
  type AnyYieldWrap,
  type Operation,
  type YieldWrap,
} from "./types";

type ReturnOf<G> = G extends Generator<any, infer A, any> ? A : never;
type YieldOf<G> = G extends Generator<infer Y, any, any> ? Y : never;

type EnvOf<Y> = Y extends YieldWrap<any, any, infer R> ? R : never;
type ErrorOf<Y> = Y extends YieldWrap<any, infer E, any> ? E : never;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

type EnvOfGen<G> = UnionToIntersection<EnvOf<YieldOf<G>>>;
type ErrOfGen<G> = ErrorOf<YieldOf<G>>;
type ValOfGen<G> = ReturnOf<G>;

export class GenInvariantError extends Error {
  readonly _tag = "GenInvariantError";
}

export function gen<G extends Generator<AnyYieldWrap, any, any>>(
  body: () => G,
): Operation<ValOfGen<G>, ErrOfGen<G>, EnvOfGen<G>> {
  type R = EnvOfGen<G>;
  type A = ValOfGen<G>;
  type E = ErrOfGen<G>;

  const out: AnyOperation = (function gen0(): AnyOperation {
    let it: Generator<AnyYieldWrap, any, any>;

    try {
      it = body();
    } catch (e) {
      return err(e);
    }

    const run = (st: IteratorResult<AnyYieldWrap, any>): AnyOperation => {
      if (st.done) return ok(st.value);

      const yielded = st.value.operation;

      return asOperation(
        (r: any) =>
          async function* () {
            let seen = false;

            for await (const res of yielded(r)()) {
              if (!res.ok) {
                yield res;
                return;
              }

              if (seen) {
                throw new GenInvariantError(
                  "gen: yielded Operation with multiple values. Use `flatMap` instead.",
                );
              }

              seen = true;

              let next: AnyOperation;

              try {
                next = run(it.next(res.value));
              } catch (e) {
                yield* err(e)(r)();
                return;
              }

              for await (const out of next(r)()) {
                yield out;
                if (!out.ok) {
                  return;
                }
              }
            }
          },
      );
    };

    try {
      return run(it.next());
    } catch (e) {
      return err(e);
    }
  })();

  return out as Operation<A, E, R>;
}
