import * as StreamResult from "./StreamResult";
import type { Awaitable } from "./types";

export type ReaderStreamResult<A, E, R> = (
  r: R,
) => StreamResult.StreamResult<A, E>;

export const ok =
  <A>(value: A): ReaderStreamResult<A, never, {}> =>
  () =>
    StreamResult.ok(value);

export const err =
  <E>(error: E): ReaderStreamResult<never, E, {}> =>
  () =>
    StreamResult.err(error);

export const fromStreamResult =
  <A, E, R>(sr: StreamResult.StreamResult<A, E>): ReaderStreamResult<A, E, R> =>
  () =>
    sr;

export const fromIterable =
  <A>(it: Iterable<A>): ReaderStreamResult<A, unknown, {}> =>
  () =>
    StreamResult.fromIterable(it);

export const trySync =
  <A, E>(
    thunk: () => A,
    onError: (error: unknown) => E,
  ): ReaderStreamResult<A, E, {}> =>
  () =>
    StreamResult.trySync(thunk, onError);

export const tryPromise =
  <A, E>(
    thunk: () => Promise<A>,
    onError: (error: unknown) => E,
  ): ReaderStreamResult<A, E, {}> =>
  () =>
    StreamResult.tryPromise(thunk, onError);

export const tryIterable =
  <A, E>(
    thunk: () => Iterable<A> | AsyncIterable<A>,
    onError: (error: unknown) => E,
  ): ReaderStreamResult<A, E, {}> =>
  () =>
    StreamResult.tryIterable(thunk, onError);

export const ask =
  <R>(): ReaderStreamResult<R, never, R> =>
  (r) =>
    StreamResult.ok(r);

export const asks =
  <R, A>(f: (r: R) => A): ReaderStreamResult<A, never, R> =>
  (r) =>
    StreamResult.ok(f(r));

export const map =
  <A, B>(f: (value: A) => Awaitable<B>) =>
  <E, R>(rs: ReaderStreamResult<A, E, R>): ReaderStreamResult<B, E, R> =>
  (r) =>
    StreamResult.map(f)(rs(r));

export const mapErr =
  <E, E2>(f: (error: E) => Awaitable<E2>) =>
  <A, R>(rs: ReaderStreamResult<A, E, R>): ReaderStreamResult<A, E2, R> =>
  (r) =>
    StreamResult.mapErr(f)(rs(r));

export const flatMap =
  <A, B, E2, R2>(f: (value: A) => ReaderStreamResult<B, E2, R2>) =>
  <E, R>(
    rs: ReaderStreamResult<A, E, R>,
  ): ReaderStreamResult<B, E | E2, R & R2> =>
  (r) =>
    StreamResult.flatMap((a: A) => f(a)(r))(rs(r));

export const tap =
  <A>(fn: (value: A) => Awaitable<void>) =>
  <E, R>(rs: ReaderStreamResult<A, E, R>): ReaderStreamResult<A, E, R> =>
  (r) =>
    StreamResult.tap(fn)(rs(r));

export const tapErr =
  <E>(fn: (error: E) => Awaitable<void>) =>
  <A, R>(rs: ReaderStreamResult<A, E, R>): ReaderStreamResult<A, E, R> =>
  (r) =>
    StreamResult.tapErr(fn)(rs(r));
