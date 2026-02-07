import type { Operation } from "../Operation";
import type { AnyTagShape, Requires, TagConstructor, ValueOf } from "./Tag";

declare const ContextR: unique symbol;
declare const ContextS: unique symbol;
declare const ContextE: unique symbol; // New Error Ledger

export interface Context<R, S, E> {
  readonly services: S;

  readonly [ContextR]?: () => R;
  readonly [ContextS]?: () => S;
  readonly [ContextE]?: () => E;
}

type AcyclicOperation<A, E, R, T extends AnyTagShape> = T["key"] extends keyof R
  ? `Error: ${T["key"]} depends on itself`
  : Operation<A, E, R>;

/**
 * Creates an empty Context with no services, no request, and no error ledger.
 *
 * @returns A Context with `unknown` request type, `unknown` services, and `never` error type.
 */
export function empty(): Context<unknown, {}, never> {
  return {
    services: {},
  } as any;
}

/**
 * Provides a service to the context by associating a tag with an operation.
 *
 * This function takes a tag and an operation, then returns a function that can be used to
 * extend a context with the provided service. The operation must not create a circular
 * dependency with the context's request type.
 *
 * @typeParam T - The tag shape type.
 * @typeParam E2 - The error type of the operation.
 * @typeParam R2 - The request type of the operation.
 * @param tag - The tag constructor to associate with the operation.
 * @param operation - The operation to provide as a service.
 * @returns A function that takes a context and returns a new context with the provided service.
 */
export function provide<T extends AnyTagShape, E2, R2>(
  tag: TagConstructor<T>,
  operation: AcyclicOperation<ValueOf<T>, E2, R2, T>,
) {
  return <R, S, E>(
    self: Context<R, S, E>,
  ): Context<R & R2, S & Requires<T>, E | E2> =>
    ({
      services: {
        ...self.services,
        [tag.key]: operation,
      },
    }) as any;
}
