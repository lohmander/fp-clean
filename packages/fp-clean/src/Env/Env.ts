import type { Operation } from "../Operation";
import type { AnyTagShape, Requires, TagConstructor, ValueOf } from "./Tag";

declare const EnvR: unique symbol;
declare const EnvS: unique symbol;
declare const EnvE: unique symbol; // New Error Ledger

export interface Env<R, S, E> {
  readonly services: S;

  readonly [EnvR]?: () => R;
  readonly [EnvS]?: () => S;
  readonly [EnvE]?: () => E;
}

type AcyclicOperation<A, E, R, T extends AnyTagShape> = T["key"] extends keyof R
  ? `Error: ${T["key"]} depends on itself`
  : Operation<A, E, R>;

/**
 * Creates an empty Env with no services, no request, and no error ledger.
 *
 * @returns An Env with `unknown` request type, `unknown` services, and `never` error type.
 */
export function empty(): Env<unknown, {}, never> {
  return {
    services: {},
  } as any;
}

/**
 * Provides a service to the Env by associating a tag with an operation.
 *
 * This function takes a tag and an operation, then returns a function that can be used to
 * extend an Env with the provided service. The operation must not create a circular
 * dependency with the Env's request type.
 *
 * @typeParam T - The tag shape type.
 * @typeParam E2 - The error type of the operation.
 * @typeParam R2 - The request type of the operation.
 * @param tag - The tag constructor to associate with the operation.
 * @param operation - The operation to provide as a service.
 * @returns A function that takes an Env and returns a new Env with the provided service.
 */
export function provide<T extends AnyTagShape, E2, R2>(
  tag: TagConstructor<T>,
  operation: AcyclicOperation<ValueOf<T>, E2, R2, T>,
) {
  return <R, S, E>(self: Env<R, S, E>): Env<R & R2, S & Requires<T>, E | E2> =>
    ({
      services: {
        ...self.services,
        [tag.key]: operation,
      },
    }) as any;
}
