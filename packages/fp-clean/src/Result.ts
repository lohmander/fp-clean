type Ok<A> = { ok: true; value: A };
type Err<E> = { ok: false; error: E };

/**
 * Result type representing either a success (Ok) or a failure (Err).
 *
 * @typeParam T - type of the Success-value
 * @typeParam E - type of the Failure-value
 */
export type Result<A, E> = Ok<A> | Err<E>;

/**
 * @typeParam T - type of the Success-value
 * @param value - Sucess value
 * @returns Ok Result
 */
export const ok = <A>(value: A): Ok<A> => ({
  ok: true,
  value,
});

export const err = <E>(error: E): Err<E> => ({
  ok: false,
  error,
});

export const isOk = <A, E>(result: Result<A, E>): result is Ok<A> => result.ok;

export const isErr = <A, E>(result: Result<A, E>): result is Err<E> =>
  !result.ok;

/**
 * Unwraps the Result, returning the success value or throwing an error
 * created from the failure value.
 *
 * @template E type of the Failure-value
 * @param toError function mapping the Failure-value to an error
 * @returns The unwrapped success value
 */
export const unwrapOrThrow =
  <E>(toError: (e: E) => unknown) =>
  <A>(result: Result<A, E>): A => {
    if (result.ok) {
      return result.value;
    } else {
      throw toError(result.error);
    }
  };

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
