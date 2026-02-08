import type { Operation } from "./Operation";
import type {
  TagConstructor,
  ValueOf,
  AnyTagShape,
  Requires,
} from "./Context/Tag";
import { askFor } from "./Operation/constructors";
import { gen } from "./Operation/gen";

/**
 * Extracts the return type of a function, or the type itself if not a function.
 */
type UnwrapOperation<T> = T extends (...args: any[]) => infer R ? R : T;

/**
 * Checks if a value is an Operation by checking if it has a [Symbol.iterator] method.
 * All fp-clean Operations have this method (set by asOperation).
 */
function isOperation(value: any): value is Operation<any, any, any> {
  return (
    typeof value === "function" && typeof value[Symbol.iterator] === "function"
  );
}

/**
 * Creates a service proxy for a given tag.
 *
 * This proxy allows you to access service methods/properties as if they were direct,
 * while internally using askFor and gen to resolve the service and access them.
 *
 * Supports both:
 * - Direct Operation properties: { now: Operation<Date> } → service.now()
 * - Methods returning Operations: { findUserById: (id) => Operation<User, Error> } → service.findUserById(467)
 *
 * @template T - The tag shape type (e.g., ClockTag)
 * @param tag - The tag constructor for the service
 * @returns A proxy object with methods/properties corresponding to the service interface
 *
 * @example
 * interface Clock {
 *   now: Operation<Date>;
 *   timezone: Operation<string>;
 * }
 *
 * const ClockTag = Tag("clock")<Clock>();
 * const clockService = Service.proxy(ClockTag);
 * const nowOp = clockService.now(); // Note: parentheses needed
 *
 * interface UserService {
 *   findById: (id: string) => Operation<User, NotFoundError>;
 * }
 *
 * const UserServiceTag = Tag("userService")<UserService>();
 * const userService = Service.proxy(UserServiceTag);
 * const userOp = userService.findById("123"); // Method call with arguments
 */
export function proxy<T extends AnyTagShape>(
  tag: TagConstructor<T>,
): {
  [K in keyof ValueOf<T>]: ValueOf<T>[K] extends (
    ...args: infer Args
  ) => infer Ret
    ? (
        ...args: Args
      ) => UnwrapOperation<Ret> extends Operation<infer A, infer E, any>
        ? Operation<A, E, Requires<T>>
        : never
    : UnwrapOperation<ValueOf<T>[K]> extends Operation<infer A, infer E, any>
      ? () => Operation<A, E, Requires<T>>
      : never;
} {
  return new Proxy({} as any, {
    get(_, methodKey: string) {
      return function (...args: any[]): Operation<any, any, Requires<T>> {
        return gen(function* () {
          const service = yield* askFor(tag);
          const property = service[methodKey];

          // Check if the property is an Operation
          if (isOperation(property)) {
            // It's an Operation property, yield* it directly
            // Note: args are ignored for direct Operation properties
            return yield* property;
          } else if (typeof property === "function") {
            // It's a method that returns an Operation, call it with args
            const operation = property(...args);
            return yield* operation;
          } else {
            // It's not a function, yield* it directly
            return yield* property;
          }
        }) as Operation<any, any, Requires<T>>;
      };
    },
  });
}
