export type Ok<A> = { ok: true; value: A };
export type Err<E> = { ok: false; error: E };

/**
 * Result type representing either a success (Ok) or a failure (Err).
 *
 * @typeParam T - type of the Success-value
 * @typeParam E - type of the Failure-value
 */
export type Result<A, E> = Ok<A> | Err<E>;
