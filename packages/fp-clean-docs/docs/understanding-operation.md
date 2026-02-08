---
sidebar_position: 2
---

# Understanding the Operation Monad

## What is Operation?

The `Operation` monad is the core abstraction in fp-clean. It represents a **description** of an effectful computation that:

- Requires a runtime environment `R`
- May succeed with a value `A`
- May fail with an error `E`
- Produces a **stream** of results

```typescript
type Operation<A, E, R> = (r: R) => StreamResult<A, E>;
```

This type signature tells the complete story: an Operation is a function that, given an environment, returns a stream of results (each either a success or failure).

## Why Operation?

### The Problem with Traditional Approaches

Traditional effectful code mixes three concerns:

1. **What to do** (business logic)
2. **How to do it** (implementation details)
3. **Error handling** (failure recovery)

```typescript
// Traditional approach - everything mixed together
async function fetchUserData(userId: string): Promise<User> {
  const db = await getDatabase(); // dependency
  try {
    const user = await db.query(userId); // business logic + error handling
    return user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error}`);
  }
}
```

This approach has several problems:

- Hard to test (tight coupling to `getDatabase`)
- Hard to compose (exceptions break control flow)
- Hard to observe (no incremental progress)
- Hard to mock (implementation details exposed)

### The Operation Solution

```typescript
import * as F from "fp-clean";

// Describe what you want, not how to get it
const fetchUserData = (
  userId: string,
): F.Operation<User, DbError, Requires<Database>> =>
  F.gen(function* () {
    const db = yield* Database; // declare dependency
    const user = yield* db.query(userId); // business logic
    return user;
  });
```

With Operation:

- **Dependencies are explicit**: The type system knows what you need
- **Errors are values**: No exceptions, failures are just another result
- **Composable**: Operations combine without side effects
- **Testable**: Pass mock implementations via Context
- **Observable**: Stream results for monitoring and debugging

## The Five Pillars in Practice

### 1. Safe

Operations never throw exceptions. All failures are captured as values:

```typescript
const result = await F.get(operation, context);

if (result.ok) {
  console.log("Success:", result.value);
} else {
  console.log("Error:", result.error); // errors are values, not exceptions
}
```

### 2. Composable

Combine operations using familiar functional patterns:

```typescript
import { pipe } from "fp-clean";

const composed = pipe(
  fetchUserData(userId),
  F.flatMap((user) => fetchUserOrders(user.id)),
  F.map((orders) => orders.filter((o) => o.active)),
  F.tap((orders) => console.log(`Found ${orders.length} active orders`)),
);
```

### 3. Explicit

The type signature tells you everything:

```typescript
Operation<
  Order[],
  DbError | NetworkError,
  Requires<Database> & Requires<HttpClient>
>;
//         ^       ^                                  ^
//     success   errors                          dependencies
```

No hidden state. No surprise dependencies. What you see is what you get.

### 4. Clean Up

Operations respect cancellation and cleanup:

```typescript
const controller = new AbortController();

// Pass signal to operation
const result = await F.get(operation, context, controller.signal);

// Cancel anytime - operation will clean up
controller.abort("User cancelled");
```

Resources are always released, even on failure.

### 5. Observable

Operations produce streams, not single values:

```typescript
// Observe progress incrementally
for await (const result of F.stream(operation, context)) {
  if (result.ok) {
    console.log("Progress:", result.value);
  } else {
    console.log("Partial failure:", result.error);
  }
}
```

Perfect for long-running operations, real-time updates, and monitoring.

## Architecture Comparison

| Feature         | Promises   | Tasks      | Operation |
| --------------- | ---------- | ---------- | --------- |
| Errors          | Exceptions | Exceptions | Values    |
| Dependencies    | Implicit   | Implicit   | Explicit  |
| Composability   | Limited    | Good       | Excellent |
| Testability     | Hard       | Medium     | Easy      |
| Observability   | None       | Limited    | Built-in  |
| Resource Safety | Manual     | Manual     | Automatic |

## Common Patterns

### Declaring Dependencies

```typescript
class Database extends Context.Tag("Database")<
  Database,
  {
    query: (sql: string) => Operation<unknown[], DbError, {}>;
  }
>() {}

const operation = F.gen(function* () {
  const db = yield* Database; // declare dependency
  // ... use db
});
```

### Error Handling

```typescript
const result = await F.get(operation, context);

// Pattern matching on result
if (result.ok) {
  handleSuccess(result.value);
} else {
  handleError(result.error);
}

// Or use combinators
const recovered = pipe(
  operation,
  F.mapErr((error) => new AppError(error)),
);
```

### Testing

```typescript
// Create a test context with mocks
const testContext = pipe(
  Context.empty(),
  Context.provide(Database, F.ok(mockDb)),
);

// Run operation with mocks
const result = await F.get(operation, testContext);
expect(result.value).toEqual(expected);
```

## When to Use Operation

Use Operation when you need:

- **Type-safe dependency injection** (testing, modularity)
- **Explicit error handling** (no surprise exceptions)
- **Composability** (building complex workflows from simple pieces)
- **Observability** (streaming results, monitoring)
- **Resource safety** (automatic cleanup, cancellation)

Operation is ideal for:

- Business logic that coordinates multiple services
- Long-running or streaming computations
- Systems requiring high reliability and observability
- Codebases where testability is important

## Next Steps

- Learn about [Context and Dependency Injection](./context)
- Explore [Result and Error Handling](./result)
- See [Streaming and Observability](./streaming)
- Check out [Common Patterns](./patterns)
