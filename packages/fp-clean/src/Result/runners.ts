import type { Result } from "./types";

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
