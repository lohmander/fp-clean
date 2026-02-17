import { none } from "./constructors";
import type { Observer } from "./types";

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
