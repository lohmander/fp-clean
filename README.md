# fp-clean

A functional programming library for TypeScript with type-safe dependency injection, inspired by ZIO and Effect TS.

## Features

- **Type-safe dependency injection** using Tags and Context
- **Functional effect system** with `Operation<A, E, R>` representing computations that may succeed with value `A`, fail with error `E`, and require dependencies `R`
- **Service Proxy** for improved developer experience when working with service dependencies
- **Composable operations** via `map`, `flatMap`, and `gen` syntax
- **Runtime execution** through `Runner` with context propagation

## Installation

```bash
npm install fp-clean
# or
bun add fp-clean
```

Requires TypeScript 5+.

## Quick Start

### 1. Define a Service Interface

```typescript
import * as Context from 'fp-clean/Context';
import * as F from 'fp-clean/Operation';

interface Clock {
  now: () => F.Operation<Date>;
  sleep: (ms: number) => F.Operation<void>;
}

const ClockTag = Context.Tag("clock")<Clock>();
```

### 2. Create a Service Proxy

```typescript
import { Service } from 'fp-clean';

const ClockService = Service.proxy(ClockTag);
// ClockService.now() and ClockService.sleep(ms) are now available
```

### 3. Use the Service in Your Program

```typescript
import { pipe } from 'fp-clean';

const program = F.gen(function* () {
  const now = yield* ClockService.now();
  console.log(`Current time: ${now.toISOString()}`);
  yield* ClockService.sleep(1000);
  console.log('Slept for 1 second');
  return now;
});
```

### 4. Provide Implementation and Run

```typescript
import * as Runner from 'fp-clean/Runner';

const mockClock: Clock = {
  now: () => F.ok(new Date()),
  sleep: (ms) => F.delay(ms).pipe(F.map(() => undefined)),
};

const context = Context.provide(ClockTag, F.ok(mockClock))(Context.empty());

const result = await Runner.get(program, context);
if (result.ok) {
  console.log('Program succeeded:', result.value);
} else {
  console.error('Program failed:', result.error);
}
```

## Core Concepts

### Tag

A `Tag` identifies a dependency in the system. It's a type-safe key that associates a name with a service interface.

```typescript
const LoggerTag = Context.Tag("logger")<{
  log: (message: string) => F.Operation<void>;
}>();
```

### Operation

An `Operation<A, E, R>` represents a computation that:
- Succeeds with a value of type `A`
- May fail with an error of type `E`
- Requires dependencies described by `R`

Operations are lazy and describe what to do, not how to do it. They can be composed using `map`, `flatMap`, `zip`, etc.

### Context

A `Context` is a map from `Tag`s to their implementations (Operations that provide the service). You can build contexts by providing implementations for tags.

```typescript
const context = pipe(
  Context.empty(),
  Context.provide(ClockTag, F.ok(mockClock)),
  Context.provide(LoggerTag, F.ok(mockLogger))
);
```

### Runner

The `Runner` executes Operations given a Context, handling dependency resolution and error propagation.

```typescript
const result = await Runner.get(program, context);
```

## Service Proxy

The Service Proxy pattern dramatically improves developer experience when working with service dependencies.

### Before Service Proxy

```typescript
const sleepOp = pipe(
  askFor(ClockTag),
  F.flatMap(clock => clock.sleep(1000))
);
```

### After Service Proxy

```typescript
const sleepOp = ClockService.sleep(1000);
```

### How It Works

`Service.proxy(Tag)` returns a proxy object where each method:
1. Automatically uses `askFor` to obtain the service instance
2. Calls the corresponding method on the service
3. Properly handles both Operation and non-Operation return values
4. Preserves type safety and dependency requirements

### Type Safety

The proxy is compile-time validated:
- Service interfaces must consist **only of methods** (functions)
- Non-method properties result in `never` types
- Return types are correctly inferred as Operations with appropriate requirements

### Performance

Service proxy calls add minimal overhead (~400ns per call) compared to manual `flatMap` patterns. For performance-critical loops, consider storing method references:

```typescript
const { sleep } = ClockService; // Store reference
const sleepOp = sleep(1000);    // Repeated calls avoid proxy get trap
```

See [benchmarks](#benchmarks) for detailed performance characteristics.

## Benchmarks

The library includes a comprehensive benchmark suite measuring:

- **Service proxy overhead** vs manual flatMap patterns
- **Framework overhead** vs plain JavaScript
- **Micro‑operation costs** (brand checks, proxy traps)

Run benchmarks with:

```bash
cd packages/fp-clean
bun benchmark      # Full benchmark suite
bun benchmark:fast # Quick run
```

### Key Findings

- `F.ok` is only ~8% slower than plain JavaScript return
- `F.gen` (generator composition) is ~14x slower than manual composition
- Service proxy adds ~400ns overhead per call vs manual flatMap
- Proxy get trap invocation is ~10x slower than direct function call

## API Reference

### Operation

Core operations constructors and combinators:
- `ok`, `fail`, `delay`, `tryCatch`
- `map`, `flatMap`, `zip`, `ap`
- `gen` – generator syntax for sequential composition

### Context

- `Tag(name)` – create a tag for a service interface
- `empty()` – create an empty context
- `provide(Tag, Operation)` – add a service implementation to a context
- `merge` – combine two contexts

### Runner

- `get(Operation, Context)` – execute an operation with given context
- `run` – lower-level execution with more control

### Service

- `proxy(Tag)` – create a service proxy for improved DX

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`bun test`)
2. TypeScript compiles without errors (`tsc --noEmit`)
3. Benchmarks remain stable (no significant regressions)
4. Code follows existing style (Prettier formatting)

## License

MIT
