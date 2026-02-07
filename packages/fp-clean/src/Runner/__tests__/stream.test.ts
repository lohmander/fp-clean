import { describe, expect, test } from "bun:test";

import * as Operation from "~/Operation";
import * as Result from "~/Result";
import * as Context from "~/Context";
import { stream } from "../stream";
import { pipe } from "~/pipe";

describe("stream", () => {
  test("should yield results from the operation", async () => {
    const mockOperation = Operation.fromIterable([1, 2, 3]);

    const mockContext = Context.empty();

    const results: Result.Result<number, never>[] = [];
    for await (const result of stream(mockOperation, mockContext)) {
      if (result.ok) results.push(result);
    }

    expect(results).toEqual([Result.ok(1), Result.ok(2), Result.ok(3)]);
  });

  test("should handle operations with dependencies", async () => {
    class MyTag extends Context.Tag("myTag")<string>() {}

    const mockOperation = Operation.gen(function* () {
      const a = yield* Operation.askFor(MyTag);
      return a;
    });

    const mockContext = pipe(
      Context.empty(),
      Context.provide(MyTag, Operation.ok("test-value")),
    );

    const results: Result.Result<string, never>[] = [];
    for await (const result of stream(mockOperation, mockContext)) {
      if (result.ok) results.push(result);
    }

    expect(results).toEqual([Result.ok("test-value")]);
  });

  test("should handle errors in operations", async () => {
    const mockOperation = Operation.err(new Error("test-error"));

    const mockContext = Context.empty();

    const results: Result.Result<never, Error>[] = [];
    for await (const result of stream(mockOperation, mockContext)) {
      if (!result.ok) results.push(result);
    }

    expect(results).toEqual([Result.err(new Error("test-error"))]);
  });

  test("should handle async operations", async () => {
    const mockOperation = Operation.tryPromise(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async-value";
      },
      (e) => new Error(String(e)),
    );

    const mockContext = Context.empty();

    const results: Result.Result<string, Error>[] = [];
    for await (const result of stream(mockOperation, mockContext)) {
      if (result.ok) results.push(result);
    }

    expect(results).toEqual([Result.ok("async-value")]);
  });

  test("resolves dependencies", async () => {
    class MultiplierTag extends Context.Tag("multi")<number>() {}
    class FibbonacciTag extends Context.Tag("fibonacci")<{
      next: () => number;
    }>() {}

    const ctx = pipe(
      Context.empty(),
      Context.provide(
        FibbonacciTag,
        Operation.gen(function* () {
          const multi = yield* Operation.askFor(MultiplierTag);
          let [a, b] = [0, 1];

          return {
            next: () => {
              const next = a + b;
              a = b;
              b = next;
              return next * multi;
            },
          };
        }),
      ),
      Context.provide(MultiplierTag, Operation.ok(-1)),
    );

    const op = pipe(
      Operation.fromIterable(Array.from({ length: 5 }, () => 0)),
      Operation.flatMap(() =>
        Operation.gen(function* () {
          const fib = yield* Operation.askFor(FibbonacciTag);
          return fib.next();
        }),
      ),
    );

    let sum = 0;

    for await (const result of stream(op, ctx)) {
      if (result.ok) {
        sum += result.value;
      }
    }

    expect(sum).toBe((1 + 2 + 3 + 5 + 8) * -1);
  });
});
