import type { TagConstructor, AnyTagShape, ValueOf, Requires } from "./Env/Tag";
import type { Operation } from "./Operation";
import { OperationBrand } from "./Operation";
import { askFor } from "./Operation/constructors";
import { gen } from "./Operation/gen";
import { ok } from "./Operation/constructors";

/**
 * Checks if a type consists solely of methods (functions).
 */
type AllMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? true : false;
}[keyof T] extends true
  ? true
  : false;

/**
 * Transforms a service interface type into a proxy interface where each method
 * returns an Operation with the appropriate requirements.
 *
 * @template T - The tag shape type (validated to have only methods)
 */
type ProxyFor<T extends AnyTagShape> = {
  [K in keyof ValueOf<T>]: ValueOf<T>[K] extends (
    ...args: infer Args
  ) => infer Ret
    ? Ret extends Operation<infer A, infer E, infer R>
      ? (...args: Args) => Operation<A, E, Requires<T> & R>
      : (...args: Args) => Operation<Ret, never, Requires<T>>
    : never;
};

/**
 * Runtime check to determine if a value is an Operation.
 * Checks for the OperationBrand symbol added by asOperation().
 * All Operations are created through asOperation() which adds the brand.
 */
const isOperation = (value: unknown): value is Operation<unknown> => {
  if (typeof value !== "function") {
    return false;
  }
  return (value as any)[OperationBrand] === true;
};

/**
 * Creates a service proxy for a given tag.
 *
 * This proxy allows you to call service methods as if they were direct,
 * while internally using askFor and gen to resolve the service and invoke the method.
 *
 * The service interface must consist solely of methods (functions). Each method
 * should return an Operation (though non‑Operation return values are wrapped in ok).
 * If the service interface contains non-function properties, the return type will be `never`,
 * causing compile-time errors when trying to use the proxy.
 *
 * @template T - The tag shape type (e.g., ClockTag)
 * @param tag - The tag constructor for the service
 * @returns A proxy object with methods corresponding to the service interface,
 *          or `never` if the service interface is invalid
 *
 * @example
 * interface Clock {
 *   now: () => Operation<Date>;
 *   sleep: (ms: number) => Operation<void>;
 * }
 *
 * const ClockTag = Tag("clock")<Clock>();
 * const ClockService = Service.proxy(ClockTag);
 *
 * // Equivalent to:
 * // flatMap(clock => clock.sleep(1000))(askFor(ClockTag))
 * const sleepOp = ClockService.sleep(1000);
 *
 * // Using with gen syntax:
 * const program = Operation.gen(function* () {
 *   const now = yield* ClockService.now();
 *   yield* ClockService.sleep(1000);
 *   return now;
 * });
 */
export function proxy<T extends AnyTagShape>(
  tag: TagConstructor<T>,
): AllMethods<ValueOf<T>> extends true ? ProxyFor<T> : never {
  return new Proxy({} as any, {
    get(_, methodKey: string) {
      return function (...args: any[]): Operation<any, any, any> {
        return gen(function* () {
          const service = yield* askFor(tag);
          const method = (service as Record<string, unknown>)[methodKey];

          if (typeof method !== "function") {
            throw new Error(
              `Service property '${String(methodKey)}' is not a function. ` +
                `Service proxies only support methods (functions).`,
            );
          }

          const result = method.apply(service, args);

          // If the result is an Operation, yield* it to execute and get the value.
          // Otherwise, wrap the plain value in ok.
          if (isOperation(result)) {
            return yield* result;
          }

          return yield* ok(result);
        });
      };
    },
  }) as AllMethods<ValueOf<T>> extends true ? ProxyFor<T> : never;
}

// Optionally export a namespace for convenience
export const Service = { proxy };
