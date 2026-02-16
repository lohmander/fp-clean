import { err, ok } from "./constructors";
import type { Result } from "./types";

/**
 * Applies a function to the success value of a Result, which may itself return a Result.
 * Flattens the nested Result into a single Result.
 *
 * @param fn Mapping function that returns a Result
 * @returns Result of the mapped value or original error
 */
export function flatMap<A, B, E2>(fn: (ok: A) => Result<B, E2>) {
  return <E>(result: Result<A, E>): Result<B, E | E2> =>
    result.ok ? fn(result.value) : result;
}

/**
 * Applies a function to the error value of a Result, which may itself return a Result.
 * Flattens the nested Result into a single Result.
 *
 * @param fn Mapping function that returns a Result
 * @returns Result of original value or mapped error
 */
export function orElse<E, E2, A>(fn: (err: E) => Result<A, E2>) {
  return <A2>(result: Result<A2, E>): Result<A | A2, E | E2> =>
    result.ok ? result : fn(result.error);
}

/**
 * Maps the success value of a Result using the provided function.
 *
 * @param fn Mapping function
 * @returns Result of mapped value or original error
 */
export function map<A, B>(fn: (ok: A) => B) {
  return flatMap((value: A) => ok(fn(value)));
}

/**
 * Maps the error value of a Result using the provided function.
 *
 * @param fn Mapping function
 * @returns Result of original value or mapped error
 */
export function mapErr<E, E2>(fn: (err: E) => E2) {
  return orElse((error: E) => err(fn(error)));
}

/**
 * Applies a function to the success value of a Result without modifying it.
 * Useful for side effects or logging.
 *
 * @param fn Function to apply to the success value
 * @returns The original Result
 */
export function tap<A>(fn: (ok: A) => void) {
  return map((ok: A) => (fn(ok), ok));
}

/**
 * Applies a function to the error value of a Result without modifying it.
 * Useful for side effects or logging.
 *
 * @param fn Function to apply to the error value
 * @returns The original Result
 */
export function tapErr<E>(fn: (err: E) => void) {
  return mapErr((err: E) => (fn(err), err));
}
