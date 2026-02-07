import { describe, expect, test } from "bun:test";
import * as Result from "~/Result";
import * as StreamResult from "~/StreamResult";

describe("StreamResult", () => {
  test("ok and err", async () => {
    const okStream = StreamResult.ok(42);
    const errStream = StreamResult.err("Error occurred");

    const okValues = [];
    for await (const value of okStream()) {
      okValues.push(value);
    }
    expect(okValues).toEqual([Result.ok(42)]);

    const errValues = [];
    for await (const value of errStream()) {
      errValues.push(value);
    }
    expect(errValues).toEqual([Result.err("Error occurred")]);
  });

  test("fromIterable", async () => {
    const syncIterable = [1, 2, 3];
    const syncStream = StreamResult.fromIterable(syncIterable);
    const syncValues = [];
    for await (const value of syncStream()) {
      syncValues.push(value);
    }
    expect(syncValues).toEqual([Result.ok(1), Result.ok(2), Result.ok(3)]);

    const errorIterable = {
      [Symbol.iterator]: () => {
        throw new Error("Iterable error");
      },
    };
    const errorStream = StreamResult.fromIterable(errorIterable);
    const errorValues = [];
    for await (const value of errorStream()) {
      errorValues.push(value);
    }
    expect(errorValues).toEqual([Result.err(new Error("Iterable error"))]);
  });

  test("trySync", async () => {
    const syncStream = StreamResult.trySync(
      () => 42,
      (error) => `Sync error: ${error}`,
    );
    const syncValues = [];
    for await (const value of syncStream()) {
      syncValues.push(value);
    }
    expect(syncValues).toEqual([Result.ok(42)]);

    const syncErrorStream = StreamResult.trySync(
      () => {
        throw new Error("Sync error");
      },
      (error) => `Sync error: ${error}`,
    );
    const syncErrorValues = [];
    for await (const value of syncErrorStream()) {
      syncErrorValues.push(value);
    }
    expect(syncErrorValues).toEqual([
      Result.err("Sync error: Error: Sync error"),
    ]);
  });

  test("tryPromise", async () => {
    const promiseStream = StreamResult.tryPromise(
      () => Promise.resolve(42),
      (error) => `Promise error: ${error}`,
    );
    const promiseValues = [];
    for await (const value of promiseStream()) {
      promiseValues.push(value);
    }
    expect(promiseValues).toEqual([Result.ok(42)]);

    const promiseErrorStream = StreamResult.tryPromise(
      () => Promise.reject(new Error("Promise error")),
      (error) => `Promise error: ${error}`,
    );
    const promiseErrorValues = [];
    for await (const value of promiseErrorStream()) {
      promiseErrorValues.push(value);
    }
    expect(promiseErrorValues).toEqual([
      Result.err("Promise error: Error: Promise error"),
    ]);
  });

  test("tryIterable", async () => {
    const iterableStream = StreamResult.tryIterable(
      () => [1, 2, 3],
      (error) => `Iterable error: ${error}`,
    );
    const iterableValues = [];
    for await (const value of iterableStream()) {
      iterableValues.push(value);
    }
    expect(iterableValues).toEqual([Result.ok(1), Result.ok(2), Result.ok(3)]);

    const asyncIterableStream = StreamResult.tryIterable(
      () =>
        (async function* () {
          yield 1;
          yield 2;
          yield 3;
        })(),
      (error) => `Async iterable error: ${error}`,
    );
    const asyncIterableValues = [];
    for await (const value of asyncIterableStream()) {
      asyncIterableValues.push(value);
    }
    expect(asyncIterableValues).toEqual([
      Result.ok(1),
      Result.ok(2),
      Result.ok(3),
    ]);

    const errorIterableStream = StreamResult.tryIterable(
      () => {
        throw new Error("Iterable error");
      },
      (error) => `Iterable error: ${error}`,
    );
    const errorIterableValues = [];
    for await (const value of errorIterableStream()) {
      errorIterableValues.push(value);
    }
    expect(errorIterableValues).toEqual([
      Result.err("Iterable error: Error: Iterable error"),
    ]);
  });

  test("map", async () => {
    const okStream = StreamResult.ok(42);
    const errStream = StreamResult.err("Error occurred");

    const mappedOk = StreamResult.map((x: number) => x * 2)(okStream);
    const mappedOkValues = [];
    for await (const value of mappedOk()) {
      mappedOkValues.push(value);
    }
    expect(mappedOkValues).toEqual([Result.ok(84)]);

    const mappedErr = StreamResult.map((x: number) => x * 2)(errStream);
    const mappedErrValues = [];
    for await (const value of mappedErr()) {
      mappedErrValues.push(value);
    }
    expect(mappedErrValues).toEqual([Result.err("Error occurred")]);
  });

  test("mapErr", async () => {
    const okStream = StreamResult.ok(42);
    const errStream = StreamResult.err("Error occurred");

    const mappedOk = StreamResult.mapErr((e: string) => e.toUpperCase())(
      okStream,
    );
    const mappedOkValues = [];
    for await (const value of mappedOk()) {
      mappedOkValues.push(value);
    }
    expect(mappedOkValues).toEqual([Result.ok(42)]);

    const mappedErr = StreamResult.mapErr((e: string) => e.toUpperCase())(
      errStream,
    );
    const mappedErrValues = [];
    for await (const value of mappedErr()) {
      mappedErrValues.push(value);
    }
    expect(mappedErrValues).toEqual([Result.err("ERROR OCCURRED")]);
  });

  test("flatMap", async () => {
    const okStream = StreamResult.ok(42);
    const errStream = StreamResult.err("Error occurred");

    const flatMappedOk = StreamResult.flatMap((x: number) =>
      StreamResult.ok(x * 2),
    )(okStream);
    const flatMappedOkValues = [];
    for await (const value of flatMappedOk()) {
      flatMappedOkValues.push(value);
    }
    expect(flatMappedOkValues).toEqual([Result.ok(84)]);

    const flatMappedErr = StreamResult.flatMap((x: number) =>
      StreamResult.ok(x * 2),
    )(errStream);
    const flatMappedErrValues = [];
    for await (const value of flatMappedErr()) {
      flatMappedErrValues.push(value);
    }
    expect(flatMappedErrValues).toEqual([Result.err("Error occurred")]);

    const flatMappedNestedErr = StreamResult.flatMap((_: number) =>
      StreamResult.err("Nested error"),
    )(okStream);
    const flatMappedNestedErrValues = [];
    for await (const value of flatMappedNestedErr()) {
      flatMappedNestedErrValues.push(value);
    }
    expect(flatMappedNestedErrValues).toEqual([Result.err("Nested error")]);
  });

  test("tap", async () => {
    const okStream = StreamResult.ok(42);
    const errStream = StreamResult.err("Error occurred");

    let tappedValue: number | undefined;
    const tappedOk = StreamResult.tap((x: number) => {
      tappedValue = x;
    })(okStream);
    const tappedOkValues = [];
    for await (const value of tappedOk()) {
      tappedOkValues.push(value);
    }
    expect(tappedOkValues).toEqual([Result.ok(42)]);
    expect(tappedValue).toBe(42);

    const tappedErr = StreamResult.tap((x: number) => {
      tappedValue = x;
    })(errStream);
    const tappedErrValues = [];
    for await (const value of tappedErr()) {
      tappedErrValues.push(value);
    }
    expect(tappedErrValues).toEqual([Result.err("Error occurred")]);
    expect(tappedValue).toBe(42); // Value shouldn't change
  });

  test("tapErr", async () => {
    const okStream = StreamResult.ok(42);
    const errStream = StreamResult.err("Error occurred");

    let tappedError: string | undefined;
    const tappedOk = StreamResult.tapErr((e: string) => {
      tappedError = e;
    })(okStream);
    const tappedOkValues = [];
    for await (const value of tappedOk()) {
      tappedOkValues.push(value);
    }
    expect(tappedOkValues).toEqual([Result.ok(42)]);
    expect(tappedError).toBeUndefined();

    const tappedErr = StreamResult.tapErr((e: string) => {
      tappedError = e;
    })(errStream);
    const tappedErrValues = [];
    for await (const value of tappedErr()) {
      tappedErrValues.push(value);
    }
    expect(tappedErrValues).toEqual([Result.err("Error occurred")]);
    expect(tappedError).toBe("Error occurred");
  });
});
