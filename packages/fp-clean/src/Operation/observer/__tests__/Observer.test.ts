import { describe, expect, mock, test } from "bun:test";
import * as Observer from "~/Operation/observer";

describe("Observer", () => {
  describe("none", () => {
    test("is empty observer", () => {
      expect(Observer.none).toEqual({});
    });
  });

  describe("combine", () => {
    test("returns second observer when first is none", () => {
      const observer = { onSpanStart: mock(() => {}) };
      const result = Observer.combine(Observer.none)(observer);
      expect(result).toBe(observer);
    });

    test("returns first observer when second is none", () => {
      const observer = { onSpanStart: mock(() => {}) };
      const result = Observer.combine(observer)(Observer.none);
      expect(result).toBe(observer);
    });

    test("returns first observer when both are none", () => {
      const result = Observer.combine(Observer.none)(Observer.none);
      expect(result).toBe(Observer.none);
    });

    test("combine calls both onSpanStart callbacks", () => {
      const start1 = mock(() => {});
      const start2 = mock(() => {});
      const combined = Observer.combine({ onSpanStart: start2 })({
        onSpanStart: start1,
      });

      const span = {
        traceId: "t1",
        spanId: "s1",
        name: "test",
        timestamp: 0,
      };

      combined.onSpanStart?.(span);

      expect(start1).toHaveBeenCalledTimes(1);
      expect(start1).toHaveBeenCalledWith(span);
      expect(start2).toHaveBeenCalledTimes(1);
      expect(start2).toHaveBeenCalledWith(span);
    });

    test("combine calls both onSpanEnd callbacks", () => {
      const end1 = mock(() => {});
      const end2 = mock(() => {});
      const combined = Observer.combine({ onSpanEnd: end2 })({
        onSpanEnd: end1,
      });

      const span = {
        traceId: "t1",
        spanId: "s1",
        timestamp: 100,
      };

      combined.onSpanEnd?.(span);

      expect(end1).toHaveBeenCalledTimes(1);
      expect(end1).toHaveBeenCalledWith(span);
      expect(end2).toHaveBeenCalledTimes(1);
      expect(end2).toHaveBeenCalledWith(span);
    });

    test("combined observer handles missing callbacks", () => {
      const start1 = mock(() => {});
      const start2 = mock(() => {});
      const combined = Observer.combine({ onSpanStart: start2 })({
        onSpanStart: start1,
      });

      // onSpanEnd should be safe to call even though neither has it
      combined.onSpanEnd?.({ traceId: "t1", spanId: "s1", timestamp: 0 });
      expect(start1).not.toHaveBeenCalled();
      expect(start2).not.toHaveBeenCalled();
    });

    test("works with both callbacks on same observer", () => {
      const start = mock(() => {});
      const end = mock(() => {});
      const observer = { onSpanStart: start, onSpanEnd: end };

      const combined = Observer.combine(observer)(observer);

      combined.onSpanStart?.({
        traceId: "t1",
        spanId: "s1",
        name: "test",
        timestamp: 0,
      });
      combined.onSpanEnd?.({
        traceId: "t1",
        spanId: "s1",
        timestamp: 100,
      });

      expect(start).toHaveBeenCalledTimes(2);
      expect(end).toHaveBeenCalledTimes(2);
    });
  });
});
