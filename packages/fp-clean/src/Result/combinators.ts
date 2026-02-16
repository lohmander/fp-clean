import { err, ok } from "./constructors";
import type { Result } from "./types";

/**
 * Maps the success value of a Result using the provided function.
 *
 * @param fn Mapping function
 * @returns Result of mapped value or original error
 */
export const map =
  <A, B>(fn: (value: A) => B) =>
  <E>(result: Result<A, E>): Result<B, E> =>
    result.ok ? ok(fn(result.value)) : result;

/**
 * Maps the error value of a Result using the provided function.
 *
 * @param fn Mapping function
 * @returns Result of original value or mapped error
 */
export const mapErr =
  <E, E2>(fn: (error: E) => E2) =>
  <A>(result: Result<A, E>): Result<A, E2> =>
    result.ok ? result : err(fn(result.error));

/**
 * Applies a function to the success value of a Result, which may itself return a Result.
 * Flattens the nested Result into a single Result.
 *
 * @param fn Mapping function that returns a Result
 * @returns Result of the mapped value or original error
 */
export const flatMap =
  <A, B, E2>(fn: (value: A) => Result<B, E2>) =>
  <E>(result: Result<A, E>): Result<B, E | E2> =>
    result.ok ? fn(result.value) : result;

/**
 * Applies a function to the success value of a Result without modifying it.
 * Useful for side effects or logging.
 *
 * @param fn Function to apply to the success value
 * @returns The original Result
 */
export const tap =
  <A>(fn: (value: A) => void) =>
  <E>(result: Result<A, E>): Result<A, E> => {
    if (result.ok) {
      fn(result.value);
    }
    return result;
  };

/**
 * Applies a function to the error value of a Result without modifying it.
 * Useful for side effects or logging.
 *
 * @param fn Function to apply to the error value
 * @returns The original Result
 */
export const tapErr =
  <E>(fn: (error: E) => void) =>
  <A>(result: Result<A, E>): Result<A, E> => {
    if (!result.ok) {
      fn(result.error);
    }
    return result;
  };
