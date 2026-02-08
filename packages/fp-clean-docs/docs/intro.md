---
sidebar_position: 1
---

# Tutorial Intro

Let's discover **fp-clean in less than 5 minutes**.

## Getting Started

fp-clean is a TypeScript library for building effectful, streaming computations with type-safe dependency injection.

## Philosophy

fp-clean is built around five core pillars:

### Safe

- Always use `Result` types (`Ok`/`Err`), never throw exceptions
- Handle all error cases explicitly
- Type-safe dependency injection prevents runtime errors

### Composable

- Functional composition patterns (`map`, `flatMap`, `pipe`)
- Operations combine freely without side effects
- Preserve operation structure across combinators

### Explicit

- Dependencies explicit via `Operation<A, E, R>` type parameters
- No hidden state or side effects
- Clear separation between effect description and execution

### Clean Up

- Resources released via `AbortController`
- Finalization where needed
- Respect cancellation signals in streaming operations

### Observable

- Streaming results for incremental observation
- Tracing/logging hooks for debugging
- Designed for monitoring and introspection

## Quick Start

```bash
npm install fp-clean
```

```typescript
import * as F from "fp-clean";
import * as Result from "fp-clean/Result";
import { stream } from "fp-clean/Runner";
import { empty } from "fp-clean/Context";

const op = F.fromIterable([1, 2, 3]);
const ctx = empty();

for await (const result of stream(op, ctx)) {
  if (result.ok) {
    console.log("Success:", result.value);
  } else {
    console.log("Error:", result.error);
  }
}
```
