import * as Stream from "~/Stream";
import * as Result from "~/Result";
import type { Awaitable } from "~/types";

export type StreamResult<A, E> = Stream.Stream<Result.Result<A, E>>;

export const ok = <A>(value: A): StreamResult<A, never> =>
  Stream.fromValue(Result.ok(value));

export const err = <E>(error: E): StreamResult<never, E> =>
  Stream.fromValue(Result.err(error));

export const fromIterable = <A>(it: Iterable<A>): StreamResult<A, unknown> =>
  async function* () {
    try {
      for (const x of it) {
        yield Result.ok(x);
      }
    } catch (error: unknown) {
      yield Result.err(error);
    }
  };

export const trySync = <A, E>(
  thunk: () => A,
  onError: (error: unknown) => E,
): StreamResult<A, E> =>
  async function* () {
    try {
      const value = thunk();
      yield Result.ok(value);
    } catch (error) {
      yield Result.err(onError(error));
    }
  };

export const tryPromise = <A, E>(
  thunk: () => Promise<A>,
  onError: (error: unknown) => E,
): StreamResult<A, E> =>
  async function* () {
    try {
      const value = await thunk();
      yield Result.ok(value);
    } catch (error) {
      yield Result.err(onError(error));
    }
  };

export const tryIterable = <A, E>(
  thunk: () => Iterable<A> | AsyncIterable<A>,
  onError: (error: unknown) => E,
): StreamResult<A, E> =>
  async function* () {
    try {
      for await (const value of thunk()) {
        yield Result.ok(value);
      }
    } catch (error) {
      yield Result.err(onError(error));
    }
  };

/**
 * Transforms the successful values in the StreamResult by applying the given function.
 *
 * @param fn - A function that transforms a value of type T to a value of type U.
 * @returns A function that takes a StreamResult<T, E> and returns a StreamResult<U, E>.
 *
 * @example
 * ```typescript
 * const stream = ok(1);
 * const mapped = map((x: number) => x * 2)(stream);
 * // Result will be a stream containing Result.ok(2)
 * ```
 */
export const map =
  <A, B>(fn: (value: A) => Awaitable<B>) =>
  <E>(sr: StreamResult<A, E>): StreamResult<B, E> =>
    Stream.map(async (r: Result.Result<A, E>) =>
      r.ok ? Result.ok(await fn(r.value)) : Result.err(r.error),
    )(sr);

/**
 * Transforms the error values in the StreamResult by applying the given function.
 *
 * @param fn - A function that transforms an error of type E to an error of type F.
 * @returns A function that takes a StreamResult<T, E> and returns a StreamResult<T, F>.
 *
 * @example
 * ```typescript
 * const stream = err("error");
 * const mappedErr = mapErr((e: string) => new Error(e))(stream);
 * // Result will be a stream containing Result.err(new Error("error"))
 * ```
 */
export const mapErr =
  <E, E2>(fn: (error: E) => Awaitable<E2>) =>
  <A>(sr: StreamResult<A, E>): StreamResult<A, E2> =>
    Stream.map(async (r: Result.Result<A, E>) =>
      r.ok ? Result.ok(r.value) : Result.err(await fn(r.error)),
    )(sr);

/**
 * Transforms the successful values in the StreamResult by applying the given function that returns another StreamResult.
 * This operation is sequential and fail-fast: if an error occurs, the stream will yield the error and terminate.
 *
 * @param fn - A function that transforms a value of type T to a StreamResult<U, F>.
 * @returns A function that takes a StreamResult<T, E> and returns a StreamResult<U, E | F>.
 *
 * @example
 * ```typescript
 * const stream = ok(1);
 * const flatMapped = flatMap((x: number) => ok(x * 2))(stream);
 * // Result will be a stream containing Result.ok(2)
 * ```
 */
export const flatMap =
  <A, B, E2>(fn: (value: A) => Awaitable<StreamResult<B, E2>>) =>
  <E>(sr: StreamResult<A, E>): StreamResult<B, E | E2> =>
    async function* () {
      for await (const r of sr()) {
        if (!r.ok) {
          yield r;
          return; // early return on error
        }

        const inner = await fn(r.value);
        for await (const innerR of inner()) {
          yield innerR;
          if (!innerR.ok) return;
        }
      }
    };

/**
 * Applies the given function to the successful values in the StreamResult without modifying the stream.
 * This is useful for side effects like logging or debugging.
 *
 * @param fn - A function that takes a value of type T and performs a side effect.
 * @returns A function that takes a StreamResult<T, E> and returns a StreamResult<T, E>.
 *
 * @example
 * ```typescript
 * const stream = ok(1);
 * const tapped = tap((x: number) => console.log(x))(stream);
 * // Logs 1 and returns the original stream
 * ```
 */
export const tap =
  <A>(fn: (value: A) => Awaitable<void>) =>
  <E>(sr: StreamResult<A, E>): StreamResult<A, E> =>
    Stream.map(async (r: Result.Result<A, E>) => {
      if (r.ok) await fn(r.value);
      return r;
    })(sr);

/**
 * Applies the given function to the error values in the StreamResult without modifying the stream.
 * This is useful for side effects like logging or debugging errors.
 *
 * @param fn - A function that takes an error of type E and performs a side effect.
 * @returns A function that takes a StreamResult<T, E> and returns a StreamResult<T, E>.
 *
 * @example
 * ```typescript
 * const stream = err("error");
 * const tappedErr = tapErr((e: string) => console.error(e))(stream);
 * // Logs "error" and returns the original stream
 * ```
 */
export const tapErr =
  <E>(fn: (error: E) => Awaitable<void>) =>
  <A>(sr: StreamResult<A, E>): StreamResult<A, E> =>
    Stream.map(async (r: Result.Result<A, E>) => {
      if (!r.ok) await fn(r.error);
      return r;
    })(sr);
