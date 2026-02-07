import { describe, expect, test } from "bun:test";

import * as Operation from "~/Operation";
import * as Result from "~/Result";
import * as Context from "~/Context";
import { get } from "../get";
import { pipe } from "~/pipe";

describe("get", () => {
  test("should return the first result from the operation", async () => {
    const mockOperation = Operation.fromIterable([1, 2, 3]);
    const mockContext = Context.empty();

    const result = await get(mockOperation, mockContext);

    expect(result).toEqual(Result.ok(1));
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

    const result = await get(mockOperation, mockContext);

    expect(result).toEqual(Result.ok("test-value"));
  });

  test("should handle errors in operations", async () => {
    const mockOperation = Operation.err(new Error("test-error"));
    const mockContext = Context.empty();

    const result = await get(mockOperation, mockContext);

    expect(result).toEqual(Result.err(new Error("test-error")));
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

    const result = await get(mockOperation, mockContext);

    expect(result).toEqual(Result.ok("async-value"));
  });

  test("should handle operations that complete without yielding a result", async () => {
    const mockOperation = Operation.fromIterable([]);
    const mockContext = Context.empty();

    expect(get(mockOperation, mockContext)).rejects.toThrow(
      "Operation completed without yielding a result.",
    );
  });
});
