import { type Result } from "../Result";
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

            for await (const innerRes of f(res.value)(r)()) {
              yield innerRes as Result<Ok2, Err | Err2>;
              if (!innerRes.ok) return;
            }
          }
        },
    );
}

export function orElse<Err, Err2, Ok, Ok2, Req2>(
  f: (e: Err) => Operation<Ok2, Err2, Req2>,
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

            for await (const innerRes of f(res.error)(r)()) {
              yield innerRes as Result<Ok | Ok2, Err | Err2>;
              if (!innerRes.ok) return;
            }
          }
        },
    );
}

export function map<Ok, Ok2>(f: (a: Ok) => Ok2) {
  return <Err, Req>(fa: Operation<Ok, Err, Req>) =>
    flatMap((a: Ok) => ok(f(a)))(fa);
}

export function mapErr<Err, Err2>(f: (error: Err) => Err2) {
  return <Ok, Req>(o: Operation<Ok, Err, Req>) =>
    orElse((error: Err) => err(f(error)))(o);
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
    orElse((e: Err) => {
      f(e);
      return err(e) as Operation<Ok, Err, Req>;
    })(fa);
}
