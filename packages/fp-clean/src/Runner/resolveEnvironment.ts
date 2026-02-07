import { asOperation } from "../Operation/internal/asOperation";
import { CircularDependencyError, type Context } from "../Context";
import * as Operation from "../Operation";
import { OperationRuntimeSymbol } from "../Operation/runtime";
import * as Result from "../Result";
import { DependencyResolutionError } from "./error";

export function resolve<R, S, E>(
  ctx: Context<R, S, E>,
): Operation.Operation<S, E, {}> {
  const blueprint = ctx.services as Record<
    string,
    Operation.Operation<any, any, any>
  >;

  return asOperation(
    (ambient) =>
      async function* () {
        const runtime = (ambient as any)[OperationRuntimeSymbol];
        const cache = new Map<string, any>();
        const stack = new Set<string>(); // For circular dependency detection

        /**
         * The "Suspense Proxy"
         * If a factory asks for something not in cache, we THROW the key.
         */
        const lazyEnv = new Proxy({} as any, {
          get: (_, key: string) => {
            if (key === (OperationRuntimeSymbol as any)) return runtime;
            if (cache.has(key)) return cache.get(key);

            // If it's in the blueprint but not cache, we signal a "Need"
            if (blueprint[key]) throw key;

            return undefined;
          },
        });

        async function runFactory(key: string) {
          if (cache.has(key)) return;
          if (stack.has(key))
            throw new CircularDependencyError([...stack, key].join(" -> "));

          stack.add(key);
          const factory = blueprint[key];

          if (!factory)
            throw new DependencyResolutionError(
              `Factory for key '${key}' not found in blueprint`,
            );

          /**
           * The Restart Loop:
           * We try to run the factory. If it throws a string (a key),
           * we resolve that dependency first and then RESTART this factory.
           */
          while (true) {
            try {
              let result: any;
              for await (const res of factory(lazyEnv)()) {
                if (!res.ok) throw res.error;
                result = res.value;
              }
              cache.set(key, result);
              stack.delete(key);
              return;
            } catch (e) {
              if (typeof e === "string" && blueprint[e]) {
                // It hit a missing dependency. Resolve IT first.
                await runFactory(e);
                // Now that 'e' is in cache, the 'while(true)' loop restarts
                // the current factory, and this time the Proxy will find 'e'.
                continue;
              }
              throw e; // Real error
            }
          }
        }

        try {
          for (const key of Object.keys(blueprint)) {
            await runFactory(key);
          }
          yield Result.ok(Object.fromEntries(cache) as S);
        } catch (err) {
          yield Result.err(err as E);
        }
      },
  );
}
