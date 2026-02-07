import type {
  AnyTagShape,
  Requires,
  TagConstructor,
  ValueOf,
} from "../Context/Tag";
import * as RSR from "../ReaderStreamResult";
import type { StreamResult } from "../StreamResult";
import { asOperation } from "./internal/asOperation";
import { getRuntimeFromEnv } from "./runtime";
import type { Operation, OperationEnv } from "./types";

export const ok = <A>(value: A): Operation<A> => asOperation(RSR.ok(value));

export const err = <E>(error: E): Operation<never, E> =>
  asOperation(RSR.err(error));

export const fromStreamResult = <A, E>(
  sr: StreamResult<A, E>,
): Operation<A, E> => asOperation(RSR.fromStreamResult(sr));

export const fromIterable = <A>(it: Iterable<A>): Operation<A, unknown> =>
  asOperation(RSR.fromIterable(it));

export const trySync = <A, E>(
  fn: () => A,
  onThrow: (u: unknown) => E,
): Operation<A, E> => asOperation(RSR.trySync(fn, onThrow));

export const tryPromise = <A, E>(
  fn: () => Promise<A>,
  onReject: (u: unknown) => E,
): Operation<A, E> => asOperation(RSR.tryPromise(fn, onReject));

export const tryIterable = <A, E>(
  fn: () => Iterable<A> | AsyncIterable<A>,
  onError: (error: unknown) => E,
) => asOperation(RSR.tryIterable(fn, onError));

export const ask = <R>(): Operation<R, never, R> => asOperation(RSR.ask());

export const asks = <A, R>(f: (r: R) => A): Operation<A, never, R> =>
  asOperation(RSR.asks(f));

export const askFor = <T extends AnyTagShape>(
  tag: TagConstructor<T>,
): Operation<ValueOf<T>, never, Requires<T>> =>
  asOperation(asks((r) => r[tag.key as T["key"]]));

export const signal = <R extends OperationEnv>(): Operation<
  AbortSignal,
  never,
  R
> => asOperation(RSR.asks((r) => getRuntimeFromEnv(r).abortSignal));
