import { describe, expect, test } from "bun:test";
import * as ReaderStreamResult from "~/ReaderStreamResult";
import * as StreamResult from "~/StreamResult";
import * as Result from "~/Result";

describe("ReaderStreamResult", () => {
  test("ok and err", async () => {
    const okReader = ReaderStreamResult.ok(42);
    const errReader = ReaderStreamResult.err("Error occurred");

    const okValues = [];
    for await (const value of okReader({})()) {
      okValues.push(value);
    }
    expect(okValues).toEqual([Result.ok(42)]);

    const errValues = [];
    for await (const value of errReader({})()) {
      errValues.push(value);
    }
    expect(errValues).toEqual([Result.err("Error occurred")]);
  });

  test("fromStreamResult", async () => {
    const sr = StreamResult.ok(7);
    const reader = ReaderStreamResult.fromStreamResult(sr);

    const values = [];
    for await (const value of reader({})()) {
      values.push(value);
    }
    expect(values).toEqual([Result.ok(7)]);
  });

  test("fromIterable", async () => {
    const iterableReader = ReaderStreamResult.fromIterable([1, 2, 3]);
    const iterableValues = [];
    for await (const value of iterableReader({})()) {
      iterableValues.push(value);
    }
    expect(iterableValues).toEqual([Result.ok(1), Result.ok(2), Result.ok(3)]);

    const asyncIterableReader = ReaderStreamResult.fromIterable(
      (function* () {
        yield 1;
        yield 2;
        yield 3;
      })(),
    );
    const asyncIterableValues = [];
    for await (const value of asyncIterableReader({})()) {
      asyncIterableValues.push(value);
    }
    expect(asyncIterableValues).toEqual([
      Result.ok(1),
      Result.ok(2),
      Result.ok(3),
    ]);
  });

  test("trySync", async () => {
    const syncReader = ReaderStreamResult.trySync(
      () => 42,
      (error) => `Sync error: ${error}`,
    );
    const syncValues = [];
    for await (const value of syncReader({})()) {
      syncValues.push(value);
    }
    expect(syncValues).toEqual([Result.ok(42)]);

    const syncErrorReader = ReaderStreamResult.trySync(
      () => {
        throw new Error("Sync failure");
      },
      (error) => `Sync error: ${error}`,
    );
    const syncErrorValues = [];
    for await (const value of syncErrorReader({})()) {
      syncErrorValues.push(value);
    }
    expect(syncErrorValues).toEqual([
      Result.err("Sync error: Error: Sync failure"),
    ]);
  });

  test("tryPromise", async () => {
    const promiseReader = ReaderStreamResult.tryPromise(
      () => Promise.resolve(42),
      (error) => `Promise error: ${error}`,
    );
    const promiseValues = [];
    for await (const value of promiseReader({})()) {
      promiseValues.push(value);
    }
    expect(promiseValues).toEqual([Result.ok(42)]);

    const promiseErrorReader = ReaderStreamResult.tryPromise(
      () => Promise.reject(new Error("Promise failure")),
      (error) => `Promise error: ${error}`,
    );
    const promiseErrorValues = [];
    for await (const value of promiseErrorReader({})()) {
      promiseErrorValues.push(value);
    }
    expect(promiseErrorValues).toEqual([
      Result.err("Promise error: Error: Promise failure"),
    ]);
  });

  test("tryIterable", async () => {
    const iterableReader = ReaderStreamResult.tryIterable(
      () => [1, 2, 3],
      (error) => `Iterable error: ${error}`,
    );
    const iterableValues = [];
    for await (const value of iterableReader({})()) {
      iterableValues.push(value);
    }
    expect(iterableValues).toEqual([Result.ok(1), Result.ok(2), Result.ok(3)]);

    const iterableErrorReader = ReaderStreamResult.tryIterable(
      () => {
        throw new Error("Iterable failure");
      },
      (error) => `Iterable error: ${error}`,
    );
    const iterableErrorValues = [];
    for await (const value of iterableErrorReader({})()) {
      iterableErrorValues.push(value);
    }
    expect(iterableErrorValues).toEqual([
      Result.err("Iterable error: Error: Iterable failure"),
    ]);
  });

  test("ask and asks", async () => {
    const env = { value: 5 };
    const asked = ReaderStreamResult.ask<typeof env>();
    const askedValues: Array<any> = [];
    for await (const value of asked(env)()) {
      askedValues.push(value);
    }
    expect(askedValues).toEqual([Result.ok(env)]);

    const askedMapped = ReaderStreamResult.asks(
      (r: { value: number }) => r.value * 3,
    );
    const askedMappedValues: Array<any> = [];
    for await (const value of askedMapped(env)()) {
      askedMappedValues.push(value);
    }
    expect(askedMappedValues).toEqual([Result.ok(15)]);
  });

  test("map", async () => {
    const okReader = ReaderStreamResult.ok(21);
    const errReader = ReaderStreamResult.err("Error occurred");

    const mappedOk = ReaderStreamResult.map((x: number) => x * 2)(okReader);
    const mappedOkValues = [];
    for await (const value of mappedOk({})()) {
      mappedOkValues.push(value);
    }
    expect(mappedOkValues).toEqual([Result.ok(42)]);

    const mappedErr = ReaderStreamResult.map((x: number) => x * 2)(errReader);
    const mappedErrValues = [];
    for await (const value of mappedErr({})()) {
      mappedErrValues.push(value);
    }
    expect(mappedErrValues).toEqual([Result.err("Error occurred")]);
  });

  test("mapErr", async () => {
    const okReader = ReaderStreamResult.ok(42);
    const errReader = ReaderStreamResult.err("Error occurred");

    const mappedOk = ReaderStreamResult.mapErr((e: string) => e.toUpperCase())(
      okReader,
    );
    const mappedOkValues = [];
    for await (const value of mappedOk({})()) {
      mappedOkValues.push(value);
    }
    expect(mappedOkValues).toEqual([Result.ok(42)]);

    const mappedErr = ReaderStreamResult.mapErr((e: string) => e.toUpperCase())(
      errReader,
    );
    const mappedErrValues = [];
    for await (const value of mappedErr({})()) {
      mappedErrValues.push(value);
    }
    expect(mappedErrValues).toEqual([Result.err("ERROR OCCURRED")]);
  });

  test("flatMap", async () => {
    const okReader = ReaderStreamResult.ok(42);
    const errReader = ReaderStreamResult.err("Error occurred");

    const flatMappedOk = ReaderStreamResult.flatMap((x: number) =>
      ReaderStreamResult.ok(x * 2),
    )(okReader);
    const flatMappedOkValues = [];
    for await (const value of flatMappedOk({})()) {
      flatMappedOkValues.push(value);
    }
    expect(flatMappedOkValues).toEqual([Result.ok(84)]);

    const flatMappedErr = ReaderStreamResult.flatMap((x: number) =>
      ReaderStreamResult.ok(x * 2),
    )(errReader);
    const flatMappedErrValues = [];
    for await (const value of flatMappedErr({})()) {
      flatMappedErrValues.push(value);
    }
    expect(flatMappedErrValues).toEqual([Result.err("Error occurred")]);

    const flatMappedNestedErr = ReaderStreamResult.flatMap((_: number) =>
      ReaderStreamResult.err("Nested error"),
    )(okReader);
    const flatMappedNestedErrValues = [];
    for await (const value of flatMappedNestedErr({})()) {
      flatMappedNestedErrValues.push(value);
    }
    expect(flatMappedNestedErrValues).toEqual([Result.err("Nested error")]);

    // Test environment merging: first reader reads `n`, second reads `m` and combines
    const first = ReaderStreamResult.asks((r: { n: number }) => r.n);
    const secondFactory = (n: number) =>
      ReaderStreamResult.asks((r: { m: number }) => n + r.m);
    const combined = ReaderStreamResult.flatMap(secondFactory)(first);
    const combinedValues = [];
    for await (const value of combined({ n: 2, m: 3 })()) {
      combinedValues.push(value);
    }
    expect(combinedValues).toEqual([Result.ok(5)]);
  });

  test("tap", async () => {
    const okReader = ReaderStreamResult.ok(42);
    const errReader = ReaderStreamResult.err("Error occurred");

    let tappedValue: number | undefined;
    const tappedOk = ReaderStreamResult.tap((x: number) => {
      tappedValue = x;
    })(okReader);
    const tappedOkValues = [];
    for await (const value of tappedOk({})()) {
      tappedOkValues.push(value);
    }
    expect(tappedOkValues).toEqual([Result.ok(42)]);
    expect(tappedValue).toBe(42);

    const tappedErr = ReaderStreamResult.tap((x: number) => {
      tappedValue = x;
    })(errReader);
    const tappedErrValues = [];
    for await (const value of tappedErr({})()) {
      tappedErrValues.push(value);
    }
    expect(tappedErrValues).toEqual([Result.err("Error occurred")]);
    expect(tappedValue).toBe(42); // Value shouldn't change
  });

  test("tapErr", async () => {
    const okReader = ReaderStreamResult.ok(42);
    const errReader = ReaderStreamResult.err("Error occurred");

    let tappedError: string | undefined;
    const tappedOk = ReaderStreamResult.tapErr((e: string) => {
      tappedError = e;
    })(okReader);
    const tappedOkValues = [];
    for await (const value of tappedOk({})()) {
      tappedOkValues.push(value);
    }
    expect(tappedOkValues).toEqual([Result.ok(42)]);
    expect(tappedError).toBeUndefined();

    const tappedErr = ReaderStreamResult.tapErr((e: string) => {
      tappedError = e;
    })(errReader);
    const tappedErrValues = [];
    for await (const value of tappedErr({})()) {
      tappedErrValues.push(value);
    }
    expect(tappedErrValues).toEqual([Result.err("Error occurred")]);
    expect(tappedError).toBe("Error occurred");
  });
});
