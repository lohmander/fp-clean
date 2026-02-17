import { none } from "./constructors";
import type { Observer } from "./types";

/**
 * Combines two observers into a single observer that delegates to both.
 *
 * This function creates a higher-order function that takes an initial observer
 * and returns a new observer that combines the behavior of both observers.
 * If either observer is `none`, the other observer is returned directly.
 * Otherwise, the new observer will call both `onSpanStart` and `onSpanEnd`
 * callbacks of both observers when they are invoked.
 *
 * @param o2 - The second observer to combine
 * @returns A function that takes an initial observer and returns the combined observer
 *
 * @example
 * ```ts
 * const combinedObserver = pipe(observer1, combine(observer2));
 * // The combined observer will call both observer1 and observer2 callbacks
 * ```
 */
export function combine(o2: Observer): (o1: Observer) => Observer {
  return (o1) => {
    if (o1 === none) return o2;
    if (o2 === none) return o1;

    return {
      onSpanStart:
        o1 || o2
          ? (span) => {
              o1.onSpanStart?.(span);
              o2.onSpanStart?.(span);
            }
          : undefined,
      onSpanEnd:
        o1 || o2
          ? (span) => {
              o1.onSpanEnd?.(span);
              o2.onSpanEnd?.(span);
            }
          : undefined,
    };
  };
}
