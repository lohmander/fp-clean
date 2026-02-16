declare const TagTypeId: unique symbol;

export type TagShape<K extends string, A> = {
  readonly key: K;
  readonly [TagTypeId]?: { _A: A };
};

export type AnyTagShape = TagShape<string, any>;

export interface TagConstructor<T extends AnyTagShape> {
  new (): T;
  readonly key: T["key"];
}

export type ValueOf<T extends AnyTagShape> =
  T extends TagShape<string, infer A> ? A : never;

/**
 * Represents a type that requires certain tags to be present.
 *
 * @typeParam T - The tag shape type that defines the required tags
 * @returns An object type where each property corresponds to a tag key,
 *          and the value type is the associated value type of the tag.
 */
export type Requires<T extends AnyTagShape> = {
  readonly [P in T["key"]]: ValueOf<T>;
};

/**
 * Creates a new tag type with the given key.
 *
 * @typeParam K - The type of the tag key (must be a string literal type)
 * @param id - The unique identifier for the tag
 * @returns A function that takes a type parameter and returns a constructor for the tag
 *
 * @example
 * class MyTag extends Context.Tag("myTag")<string>() {}
 * // Creates a tag with key "myTag" and value type string
 */
export function Tag<K extends string>(id: K) {
  return <A>() =>
    class {
      declare readonly [TagTypeId]?: { _A: A };
      declare readonly key: K;

      static readonly key = id;
    };
}
