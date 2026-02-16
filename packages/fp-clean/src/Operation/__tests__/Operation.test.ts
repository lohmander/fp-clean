import { describe, expect, mock, test } from "bun:test";
import * as F from "~/Operation";
import * as Result from "~/Result";
import * as StreamResult from "~/StreamResult";
import * as Context from "~/Context";
import { createRuntime } from "../runtime";

describe("Operation", () => {
  test("ok and err", async () => {
    const okFlow = F.ok(42);
    const errFlow = F.err("Error occurred");

    const okValues = [];
    for await (const value of okFlow({})()) {
      okValues.push(value);
    }
    expect(okValues).toEqual([Result.ok(42)]);

    const errValues = [];
    for await (const value of errFlow({})()) {
      errValues.push(value);
    }
    expect(errValues).toEqual([Result.err("Error occurred")]);
  });

  test("fromIterable", async () => {
    const iterableFlow = F.fromIterable([1, 2, 3]);
    const iterableValues = [];
    const [_, runtime] = createRuntime();
    for await (const value of iterableFlow(runtime)()) {
      iterableValues.push(value);
    }
    expect(iterableValues).toEqual([Result.ok(1), Result.ok(2), Result.ok(3)]);

    const asyncIterableFlow = F.fromIterable(
      (function* () {
        yield 1;
        yield 2;
        yield 3;
      })(),
    );
    const asyncIterableValues = [];
    for await (const value of asyncIterableFlow(runtime)()) {
      asyncIterableValues.push(value);
    }
    expect(asyncIterableValues).toEqual([
      Result.ok(1),
      Result.ok(2),
      Result.ok(3),
    ]);
  });

  describe("trySync", () => {
    test("resolves", async () => {
      const flow = F.trySync(
        () => 9,
        (u) => String(u),
      );
      const values: any[] = [];
      for await (const value of flow({})()) {
        values.push(value);
      }
      expect(values).toEqual([Result.ok(9)]);
    });

    test("throws", async () => {
      const flow = F.trySync(
        () => {
          throw "Boom";
        },
        (u) => u as string,
      );
      const values: any[] = [];
      for await (const value of flow({})()) {
        values.push(value);
      }
      expect(values).toEqual([Result.err("Boom")]);
    });

    test("is lazy", async () => {
      const thunkMock = mock(() => 10);
      const flow = F.trySync(thunkMock, (u) => String(u));
      expect(thunkMock).not.toHaveBeenCalled();
      const values: any[] = [];
      for await (const value of flow({})()) {
        values.push(value);
      }
      expect(thunkMock).toHaveBeenCalledTimes(1);
      expect(values).toEqual([Result.ok(10)]);
    });
  });

  describe("tryPromise", () => {
    test("resolves", async () => {
      const flow = F.tryPromise(
        () => Promise.resolve(8),
        (u) => String(u),
      );
      const values: any[] = [];
      for await (const value of flow({})()) {
        values.push(value);
      }
      expect(values).toEqual([Result.ok(8)]);
    });

    test("rejects", async () => {
      const flow = F.tryPromise(
        () => Promise.reject("Boom"),
        (u) => u as string,
      );
      const values: any[] = [];
      for await (const value of flow({})()) {
        values.push(value);
      }
      expect(values).toEqual([Result.err("Boom")]);
    });

    test("is lazy", async () => {
      const thunkMock = mock(() => Promise.resolve(11));
      const flow = F.tryPromise(thunkMock, (u) => String(u));
      expect(thunkMock).not.toHaveBeenCalled();
      const values: any[] = [];
      for await (const value of flow({})()) {
        values.push(value);
      }
      expect(thunkMock).toHaveBeenCalledTimes(1);
      expect(values).toEqual([Result.ok(11)]);
    });
  });

  test("ask and asks", async () => {
    const env = { value: 5 };
    const asked = F.ask<typeof env>();
    const askedValues: Array<any> = [];
    for await (const value of asked(env)()) {
      askedValues.push(value);
    }
    expect(askedValues).toEqual([Result.ok(env)]);

    const askedMapped = F.asks((r: { value: number }) => r.value * 3);
    const askedMappedValues: Array<any> = [];
    for await (const value of askedMapped(env)()) {
      askedMappedValues.push(value);
    }
    expect(askedMappedValues).toEqual([Result.ok(15)]);
  });

  test("askFor", async () => {
    class NumberTag extends Context.Tag("number")<number>() {}
    const env = {
      [NumberTag.key]: 5,
    };

    const askedFor = F.askFor(NumberTag);
    const askedForValues: Array<any> = [];
    for await (const value of askedFor(env)()) {
      askedForValues.push(value);
    }
    expect(askedForValues).toEqual([Result.ok(5)]);
  });

  test("map", async () => {
    const okFlow = F.ok(21);
    const errFlow = F.err("Error occurred");

    const mappedOk = F.map((x: number) => x * 2)(okFlow);
    const mappedOkValues = [];
    for await (const value of mappedOk({})()) {
      mappedOkValues.push(value);
    }
    expect(mappedOkValues).toEqual([Result.ok(42)]);

    const mappedErr = F.map((x: number) => x * 2)(errFlow);
    const mappedErrValues = [];
    for await (const value of mappedErr({})()) {
      mappedErrValues.push(value);
    }
    expect(mappedErrValues).toEqual([Result.err("Error occurred")]);
  });

  test("mapErr", async () => {
    const okFlow = F.ok(42);
    const errFlow = F.err("Error occurred");

    const mappedOk = F.mapErr((e: string) => e.toUpperCase())(okFlow);
    const mappedOkValues = [];
    for await (const value of mappedOk({})()) {
      mappedOkValues.push(value);
    }
    expect(mappedOkValues).toEqual([Result.ok(42)]);

    const mappedErr = F.mapErr((e: string) => e.toUpperCase())(errFlow);
    const mappedErrValues = [];
    for await (const value of mappedErr({})()) {
      mappedErrValues.push(value);
    }
    expect(mappedErrValues).toEqual([Result.err("ERROR OCCURRED")]);
  });

  test("flatMap", async () => {
    const okFlow = F.ok(42);
    const errFlow = F.err("Error occurred");

    const flatMappedOk = F.flatMap((x: number) => F.ok(x * 2))(okFlow);
    const flatMappedOkValues = [];
    for await (const value of flatMappedOk({})()) {
      flatMappedOkValues.push(value);
    }
    expect(flatMappedOkValues).toEqual([Result.ok(84)]);

    const flatMappedErr = F.flatMap((x: number) => F.ok(x * 2))(errFlow);
    const flatMappedErrValues = [];
    for await (const value of flatMappedErr({})()) {
      flatMappedErrValues.push(value);
    }
    expect(flatMappedErrValues).toEqual([Result.err("Error occurred")]);

    const flatMappedNestedErr = F.flatMap((_: number) => F.err("Nested error"))(
      okFlow,
    );
    const flatMappedNestedErrValues = [];
    for await (const value of flatMappedNestedErr({})()) {
      flatMappedNestedErrValues.push(value);
    }
    expect(flatMappedNestedErrValues).toEqual([Result.err("Nested error")]);

    // Test environment merging: first flow reads `n`, second reads `m` and combines
    const first = F.asks((r: { n: number }) => r.n);
    const secondFactory = (n: number) => F.asks((r: { m: number }) => n + r.m);
    const combined = F.flatMap(secondFactory)(first);
    const combinedValues = [];
    for await (const value of combined({ n: 2, m: 3 })()) {
      combinedValues.push(value);
    }
    expect(combinedValues).toEqual([Result.ok(5)]);
  });

  test("tap", async () => {
    const okFlow = F.ok(42);
    const errFlow = F.err("Error occurred");

    let tappedValue: number | undefined;
    const tappedOk = F.tap((x: number) => {
      tappedValue = x;
    })(okFlow);
    const tappedOkValues = [];
    for await (const value of tappedOk({})()) {
      tappedOkValues.push(value);
    }
    expect(tappedOkValues).toEqual([Result.ok(42)]);
    expect(tappedValue).toBe(42);

    const tappedErr = F.tap((x: number) => {
      tappedValue = x;
    })(errFlow);
    const tappedErrValues = [];
    for await (const value of tappedErr({})()) {
      tappedErrValues.push(value);
    }
    expect(tappedErrValues).toEqual([Result.err("Error occurred")]);
    expect(tappedValue).toBe(42); // Value shouldn't change
  });

  test("tapErr", async () => {
    const okFlow = F.ok(42);
    const errFlow = F.err("Error occurred");

    let tappedError: string | undefined;
    const tappedOk = F.tapErr((e: string) => {
      tappedError = e;
    })(okFlow);
    const tappedOkValues = [];
    for await (const value of tappedOk({})()) {
      tappedOkValues.push(value);
    }
    expect(tappedOkValues).toEqual([Result.ok(42)]);
    expect(tappedError).toBeUndefined();

    const tappedErr = F.tapErr((e: string) => {
      tappedError = e;
    })(errFlow);
    const tappedErrValues = [];
    for await (const value of tappedErr({})()) {
      tappedErrValues.push(value);
    }
    expect(tappedErrValues).toEqual([Result.err("Error occurred")]);
    expect(tappedError).toBe("Error occurred");
  });
});
