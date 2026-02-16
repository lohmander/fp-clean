import type {
  AnyTagShape,
  Requires,
  TagConstructor,
  ValueOf,
} from "../Env/Tag";
import * as RSR from "../ReaderStreamResult";
import type { StreamResult } from "../StreamResult";
import { asOperation } from "./internal/asOperation";
import { getRuntimeFromEnv, InvalidRuntime } from "./runtime";
import type { Operation, OperationEnv } from "./types";
import * as Result from "../Result";

function asyncGen<T>(values: T[]) {
  return async function* () {
    for (const value of values) {
      yield value;
    }
  };
}

export function ok<Ok>(value: Ok): Operation<Ok> {
  return asOperation(() => asyncGen([Result.ok(value)]));
}

export function err<Err>(error: Err): Operation<never, Err> {
  return asOperation(() => asyncGen([Result.err(error)]));
}

export function ask<Needs>(): Operation<Needs, never, Needs> {
  return asOperation((r) => ok(r)(r));
}

export function asks<A, R>(f: (r: R) => A): Operation<A, never, R> {
  return asOperation((r) => ok(f(r))(r));
}

export function askFor<T extends AnyTagShape>(
  tag: TagConstructor<T>,
): Operation<ValueOf<T>, never, Requires<T>> {
  return asOperation(asks((r) => r[tag.key as T["key"]]));
}

export function signal(): Operation<AbortSignal, never> {
  return asOperation(
    asks((r) => getRuntimeFromEnv(r as OperationEnv).abortSignal),
  );
}

// Bridge constructors from StreamResult

export function fromIterable<Ok>(it: Iterable<Ok>): Operation<Ok, unknown> {
  return asOperation(
    (r: unknown) =>
      async function* () {
        try {
          const signal = getRuntimeFromEnv(r as OperationEnv).abortSignal;

          if (!signal) {
            throw new InvalidRuntime("Runtime must have an abortSignal");
          }

          for (const x of it) {
            if (signal.aborted) {
              break;
            }

            yield Result.ok(x);
          }
        } catch (error: unknown) {
          yield Result.err(error);
        }
      },
  );
}

export function fromAsyncIterable<Ok>(
  it: AsyncIterable<Ok>,
): Operation<Ok, unknown> {
  return asOperation(
    (r: unknown) =>
      async function* () {
        try {
          const signal = getRuntimeFromEnv(r as OperationEnv).abortSignal;

          if (!signal) {
            throw new InvalidRuntime("Runtime must have an abortSignal");
          }

          for await (const x of it) {
            if (signal.aborted) {
              break;
            }

            yield Result.ok(x);
          }
        } catch (error: unknown) {
          yield Result.err(error);
        }
      },
  );
}

export function trySync<Ok, Err>(
  fn: () => Ok,
  onThrow: (u: unknown) => Err,
): Operation<Ok, Err> {
  return asOperation(
    () =>
      async function* () {
        try {
          const value = fn();
          yield Result.ok(value);
        } catch (error) {
          yield Result.err(onThrow(error));
        }
      },
  );
}

export function trySyncWith<Err>(onThrow: (e: unknown) => Err) {
  return <Ok>(fn: () => Ok): Operation<Ok, Err> => trySync(fn, onThrow);
}

export function tryPromise<Ok, Err>(
  fn: () => Promise<Ok>,
  onReject: (u: unknown) => Err,
): Operation<Ok, Err> {
  return asOperation(
    () =>
      async function* () {
        try {
          const value = await fn();
          yield Result.ok(value);
        } catch (error) {
          yield Result.err(onReject(error));
        }
      },
  );
}

export function tryPromiseWith<Err>(onReject: (e: unknown) => Err) {
  return <Ok>(fn: () => Promise<Ok>): Operation<Ok, Err> =>
    tryPromise(fn, onReject);
}
