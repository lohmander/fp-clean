import { type Result } from "~/Result";
import { err, ok } from "./constructors";
import { asOperation } from "./internal/asOperation";
import type { Operation } from "./types";

export function flatMap<Ok, Ok2, Err2, Needs2>(
  f: (a: Ok) => Operation<Ok2, Err2, Needs2>,
) {
  return <Err, Needs>(
    fa: Operation<Ok, Err, Needs>,
  ): Operation<Ok2, Err | Err2, Needs & Needs2> =>
    asOperation(
      (r) =>
        async function* () {
          for await (const res of fa(r)()) {
            if (!res.ok) {
              yield res as Result<never, Err | Err2>;
              return;
            }

            yield* f(res.value)(r)();
          }
        },
    );
}

export function orElse<E, E2, A, R2>(f: (error: E) => Operation<A, E2, R2>) {
  return <R>(fa: Operation<A, E, R>): Operation<A, E | E2, R & R2> =>
    asOperation(
      (r) =>
        async function* () {
          for await (const res of fa(r)()) {
            if (res.ok) {
              yield res as Result<A, never>;
              continue;
            }

            yield* f(res.error)(r)();
          }
        },
    );
}

export function map<A, B>(f: (a: A) => B) {
  return <E, R>(o: Operation<A, E, R>) =>
    flatMap((a: A) => ok(f(a)) as Operation<B, E, R>)(o);
}

export function mapErr<E, E2>(f: (error: E) => E2) {
  return <A, R>(o: Operation<A, E, R>) =>
    orElse((error: E) => err(f(error)) as Operation<A, E2, R>)(o);
}

export function tap<A>(f: (a: A) => void) {
  return <E, R>(o: Operation<A, E, R>) =>
    flatMap((a: A) => {
      f(a);
      return ok(a) as Operation<A, E, R>;
    })(o);
}

export function tapErr<E>(f: (error: E) => void) {
  return <A, R>(o: Operation<A, E, R>) =>
    orElse((error: E) => {
      f(error);
      return err(error) as Operation<A, E, R>;
    })(o);
}
