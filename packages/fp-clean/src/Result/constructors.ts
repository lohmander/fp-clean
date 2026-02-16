import type { Ok, Err } from "./types";

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
