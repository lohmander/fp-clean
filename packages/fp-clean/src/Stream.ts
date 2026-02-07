import type { Awaitable } from "./types";

export interface Stream<A> {
  (): AsyncGenerator<A, void, unknown>;
}

export const fromValue = <A>(value: Awaitable<A>): Stream<A> => {
  return async function* (): AsyncGenerator<A, void, unknown> {
    yield await value;
  };
};

export const empty = <A>(): Stream<A> => {
  return async function* (): AsyncGenerator<A, void, unknown> {
    // No values to yield
  };
};

export const fromIterable = <A>(
  iterable: Iterable<A> | AsyncIterable<A>,
): Stream<A> => {
  return async function* (): AsyncGenerator<A, void, unknown> {
    for await (const item of iterable) {
      yield item;
    }
  };
};

/**
 * Concatenates multiple streams into a single stream.
 *
 * @template T - The type of elements in the streams.
 *
 * @example
 * const stream1 = fromIterable([1, 2]);
 * const stream2 = fromIterable([3, 4]);
 * const concatenated = concat(stream2)(stream1);
 * // concatenated will yield 1, 2, 3, 4
 */
export const concat =
  <A>(...streams: Stream<A>[]) =>
  (stream: Stream<A>): Stream<A> =>
    async function* (): AsyncGenerator<A, void, unknown> {
      for (const s of [stream, ...streams]) {
        yield* s();
      }
    };

/**
 * Transforms each element of the stream using the provided function.
 *
 * @template T - The type of elements in the input stream.
 * @template U - The type of elements in the output stream.
 *
 * @example
 * const stream = fromIterable([1, 2, 3]);
 * const doubled = map((x) => x * 2)(stream);
 * // doubled will yield 2, 4, 6
 */
export const map =
  <A, B>(fn: (item: A) => Awaitable<B>) =>
  (stream: Stream<A>): Stream<B> =>
    async function* (): AsyncGenerator<B, void, unknown> {
      for await (const item of stream()) {
        yield await fn(item);
      }
    };

/**
 * Transforms each element of the stream into a new stream, then flattens the resulting streams into a single stream.
 *
 * @template T - The type of elements in the input stream.
 * @template U - The type of elements in the output stream.
 *
 * @example
 * const stream = fromIterable([1, 2, 3]);
 * const nestedStreams = flatMap((x) => fromIterable([x, x * 2]))(stream);
 * // nestedStreams will yield 1, 2, 2, 4, 3, 6
 */
export const flatMap =
  <A, B>(fn: (item: A) => Awaitable<Stream<B>>) =>
  (stream: Stream<A>): Stream<B> =>
    async function* (): AsyncGenerator<B, void, unknown> {
      for await (const item of stream()) {
        const innerStream = await fn(item);
        for await (const innerItem of innerStream()) {
          yield innerItem;
        }
      }
    };

/**
 * Takes the first `count` elements from the stream and discards the rest.
 *
 * @template T - The type of elements in the stream.
 *
 * @example
 * const stream = fromIterable([1, 2, 3, 4, 5]);
 * const limited = take(3)(stream);
 * // limited will yield 1, 2, 3
 */
export const take =
  (count: number) =>
  <A>(stream: Stream<A>): Stream<A> =>
    async function* () {
      if (count <= 0) return;
      let i = 0;
      for await (const item of stream()) {
        yield item;
        i++;
        if (i >= count) break;
      }
    };
