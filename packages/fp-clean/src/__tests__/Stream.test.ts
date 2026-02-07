import { describe, test, expect } from "bun:test";
import * as Stream from "~/Stream";

describe("Stream", () => {
  test("fromValue", async () => {
    const stream = Stream.fromValue(42);
    const values = [];
    for await (const value of stream()) {
      values.push(value);
    }
    expect(values).toEqual([42]);
  });

  test("empty", async () => {
    const stream = Stream.empty<number>();
    const values = [];
    for await (const value of stream()) {
      values.push(value);
    }
    expect(values).toEqual([]);
  });

  test("fromIterable", async () => {
    const array = [1, 2, 3];
    const stream = Stream.fromIterable(array);
    const values = [];
    for await (const value of stream()) {
      values.push(value);
    }
    expect(values).toEqual(array);
  });

  test("concat", async () => {
    const stream1 = Stream.fromIterable([1, 2]);
    const stream2 = Stream.fromIterable([3, 4]);
    const concatenated = Stream.concat(stream2)(stream1);
    const values = [];
    for await (const value of concatenated()) {
      values.push(value);
    }
    expect(values).toEqual([1, 2, 3, 4]);
  });

  test("map", async () => {
    const stream = Stream.fromIterable([1, 2, 3]);
    const mapped = Stream.map((x: number) => x * 2)(stream);
    const values = [];
    for await (const value of mapped()) {
      values.push(value);
    }
    expect(values).toEqual([2, 4, 6]);
  });

  test("flatMap", async () => {
    const stream = Stream.fromIterable([1, 2, 3]);
    const flatMapped = Stream.flatMap((x: number) =>
      Stream.fromIterable([x, x * 2]),
    )(stream);
    const values = [];
    for await (const value of flatMapped()) {
      values.push(value);
    }
    expect(values).toEqual([1, 2, 2, 4, 3, 6]);
  });

  test("take", async () => {
    const stream = Stream.fromIterable([1, 2, 3, 4, 5]);
    const limited = Stream.take(3)(stream);
    const values = [];
    for await (const value of limited()) {
      values.push(value);
    }
    expect(values).toEqual([1, 2, 3]);
  });
});
