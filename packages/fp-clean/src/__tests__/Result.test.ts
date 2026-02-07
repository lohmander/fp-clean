import { describe, test, expect } from "bun:test";
import * as Result from "~/Result";

describe("Result", () => {
  test("isOk and isErr", () => {
    const okResult = Result.ok(42);
    const errResult = Result.err("Error occurred");

    expect(Result.isOk(okResult)).toBe(true);
    expect(Result.isErr(okResult)).toBe(false);
    expect(Result.isOk(errResult)).toBe(false);
    expect(Result.isErr(errResult)).toBe(true);
  });

  test("unwrapOrThrow", () => {
    const okResult = Result.ok(42);
    const errResult = Result.err("Error occurred");

    expect(Result.unwrapOrThrow((e) => new Error(e as any))(okResult)).toBe(42);
    expect(() =>
      Result.unwrapOrThrow((e) => new Error(e as any))(errResult),
    ).toThrowError("Error occurred");
  });

  test("map", () => {
    const okResult = Result.ok(42);
    const errResult = Result.err("Error occurred");

    const mappedOk = Result.map((x: number) => x * 2)(okResult);
    expect(Result.isOk(mappedOk)).toBe(true);
    if (mappedOk.ok) expect(mappedOk.value).toBe(84);

    const mappedErr = Result.map((x: number) => x * 2)(errResult);
    expect(Result.isErr(mappedErr)).toBe(true);
    if (!mappedErr.ok) expect(mappedErr.error).toBe("Error occurred");
  });

  test("mapErr", () => {
    const okResult = Result.ok(42);
    const errResult = Result.err("Error occurred");

    const mappedOk = Result.mapErr((e: string) => e.toUpperCase())(okResult);
    expect(Result.isOk(mappedOk)).toBe(true);
    if (mappedOk.ok) expect(mappedOk.value).toBe(42);

    const mappedErr = Result.mapErr((e: string) => e.toUpperCase())(errResult);
    expect(Result.isErr(mappedErr)).toBe(true);
    if (!mappedErr.ok) expect(mappedErr.error).toBe("ERROR OCCURRED");
  });

  test("flatMap", () => {
    const okResult = Result.ok(42);
    const errResult = Result.err("Error occurred");

    const flatMappedOk = Result.flatMap((x: number) => Result.ok(x * 2))(
      okResult,
    );
    expect(Result.isOk(flatMappedOk)).toBe(true);
    if (flatMappedOk.ok) expect(flatMappedOk.value).toBe(84);

    const flatMappedErr = Result.flatMap((x: number) => Result.ok(x * 2))(
      errResult,
    );
    expect(Result.isErr(flatMappedErr)).toBe(true);
    if (!flatMappedErr.ok) expect(flatMappedErr.error).toBe("Error occurred");

    const flatMappedNestedErr = Result.flatMap((_: number) =>
      Result.err("Nested error"),
    )(okResult);
    expect(Result.isErr(flatMappedNestedErr)).toBe(true);
    if (!flatMappedNestedErr.ok)
      expect(flatMappedNestedErr.error).toBe("Nested error");
  });

  test("tap", () => {
    const okResult = Result.ok(42);
    const errResult = Result.err("Error occurred");

    let tappedValue: number | undefined;
    const tappedOk = Result.tap((x: number) => {
      tappedValue = x;
    })(okResult);
    expect(Result.isOk(tappedOk)).toBe(true);
    if (tappedOk.ok) expect(tappedOk.value).toBe(42);
    expect(tappedValue).toBe(42);

    const tappedErr = Result.tap((x: number) => {
      tappedValue = x;
    })(errResult);
    expect(Result.isErr(tappedErr)).toBe(true);
    if (!tappedErr.ok) expect(tappedErr.error).toBe("Error occurred");
    expect(tappedValue).toBe(42); // Value shouldn't change
  });

  test("tapErr", () => {
    const okResult = Result.ok(42);
    const errResult = Result.err("Error occurred");

    let tappedError: string | undefined;
    const tappedOk = Result.tapErr((e: string) => {
      tappedError = e;
    })(okResult);
    expect(Result.isOk(tappedOk)).toBe(true);
    if (tappedOk.ok) expect(tappedOk.value).toBe(42);
    expect(tappedError).toBeUndefined();

    const tappedErr = Result.tapErr((e: string) => {
      tappedError = e;
    })(errResult);
    expect(Result.isErr(tappedErr)).toBe(true);
    if (!tappedErr.ok) expect(tappedErr.error).toBe("Error occurred");
    expect(tappedError).toBe("Error occurred");
  });
});
