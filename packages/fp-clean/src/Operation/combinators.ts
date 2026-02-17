import { type Result } from "~/Result";
import { err, ok } from "./constructors";
import { asOperation } from "./internal/asOperation";
import type { Operation } from "./types";

export function flatMap<Ok, Ok2, Err2, Req2>(
  f: (a: Ok) => Operation<Ok2, Err2, Req2>,
) {
  return <Err, Req>(
    fa: Operation<Ok, Err, Req>,
  ): Operation<Ok2, Err | Err2, Req & Req2> =>
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

export function orElse<Err, Err2, Ok, Ok2, Req2>(
  f: (error: Err) => Operation<Ok2, Err2, Req2>,
) {
  return <Req>(
    fa: Operation<Ok, Err, Req>,
  ): Operation<Ok | Ok2, Err | Err2, Req & Req2> =>
    asOperation(
      (r) =>
        async function* () {
          for await (const res of fa(r)()) {
            if (res.ok) {
              yield res as Result<Ok, never>;
              continue;
            }

            yield* f(res.error)(r)() as AsyncGenerator<
              Result<Ok | Ok2, Err2>,
              void,
              unknown
            >;
          }
        },
    );
}

export function map<Ok, Ok2>(f: (a: Ok) => Ok2) {
  return <Err, Req>(fa: Operation<Ok, Err, Req>) =>
    flatMap((a: Ok) => ok(f(a)) as Operation<Ok2, Err, Req>)(fa);
}

export function mapErr<Err, Err2>(f: (error: Err) => Err2) {
  return <Ok, Req>(o: Operation<Ok, Err, Req>) =>
    orElse((error: Err) => err(f(error)) as Operation<Ok, Err2, Req>)(o);
}

export function tap<Ok>(f: (a: Ok) => void) {
  return <Err, Req>(fa: Operation<Ok, Err, Req>) =>
    flatMap((a: Ok) => {
      f(a);
      return ok(a) as Operation<Ok, Err, Req>;
    })(fa);
}

export function tapErr<Err>(f: (error: Err) => void) {
  return <Ok, Req>(fa: Operation<Ok, Err, Req>) =>
    orElse((error: Err) => {
      f(error);
      return err(error) as Operation<Ok, Err, Req>;
    })(fa);
}
