import type { Result, Ok, Err } from "./types";

export const isOk = <A, E>(result: Result<A, E>): result is Ok<A> => result.ok;

export const isErr = <A, E>(result: Result<A, E>): result is Err<E> =>
  !result.ok;
