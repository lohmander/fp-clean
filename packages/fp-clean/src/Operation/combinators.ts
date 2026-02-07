import * as RSR from "../ReaderStreamResult";
import type { Awaitable } from "../types";
import { asOperation } from "./internal/asOperation";
import type { Operation } from "./types";

export function map<A, B>(
  f: (t: A) => B,
): <R, E>(fa: Operation<A, E, R>) => Operation<B, E, R>;
export function map<A, B>(
  f: (t: A) => Promise<B>,
): <R, E>(fa: Operation<A, E, R>) => Operation<B, E, R>;
export function map<A, B>(f: (t: A) => Awaitable<B>) {
  return <E, R>(fa: Operation<A, E, R>): Operation<B, E, R> =>
    asOperation(RSR.map(f)(fa));
}

export function mapErr<E, E2>(
  f: (error: E) => E2,
): <A, R>(fa: Operation<A, E, R>) => Operation<A, E2, R>;
export function mapErr<E, E2>(
  f: (error: E) => Promise<E2>,
): <A, R>(fa: Operation<A, E, R>) => Operation<A, E2, R>;
export function mapErr<E, E2>(f: (error: E) => Awaitable<E2>) {
  return <A, R>(fa: Operation<A, E, R>): Operation<A, E2, R> =>
    asOperation(RSR.mapErr(f)(fa));
}

export function flatMap<A, B, E2, R2>(f: (t: A) => Operation<B, E2, R2>) {
  return <E, R>(fa: Operation<A, E, R>): Operation<B, E | E2, R & R2> =>
    asOperation(RSR.flatMap((a: A) => f(a))(fa));
}

export function tap<A>(fn: (a: A) => Awaitable<void>) {
  return <E, R>(fa: Operation<A, E, R>) => asOperation(RSR.tap(fn)(fa));
}

export function tapErr<E>(fn: (error: E) => Awaitable<void>) {
  return <A, R>(fa: Operation<A, E, R>): Operation<A, E, R> =>
    asOperation(RSR.tapErr(fn)(fa));
}
