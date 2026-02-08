# fp-clean

**Safe, composable, explicit, clean up, observable** – making the safe way the easy way.

A TypeScript library for building effectful, streaming computations with type-safe dependency injection.

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

## Architecture

### Core Concepts

- **Operation**: `(R) => StreamResult<A, E>` – effect type describing computations requiring environment `R`
- **StreamResult**: `Stream<Result<A, E>>` – streaming with error handling baked in
- **Context & Tag**: Type-safe dependency injection with circular dependency prevention
- **Runner**: Executes operations with proper resource cleanup (`stream`, `get`)
- **gen**: Generator-based syntax for sequential operations

### Package Structure

- **`fp-clean`**: Ultra-lean core library with only essential types and combinators
  - `Operation`, `StreamResult`, `Context`, `Tag`, `Runner`
  - Basic constructors (`ok`, `err`, `fromIterable`, `trySync`)
  - Basic combinators (`map`, `flatMap`, `tap`, `mapErr`, `tapErr`)
  - `gen` for sequential operations

- **`fp-clean-recipes`**: Higher-level patterns and utilities (separate package)
  - Filter/guard operations
  - Retry policies with different strategies
  - Timeout handling
  - Scheduling
  - Resource management patterns
  - Common integrations (HTTP, database, etc.)

## Quick Start

```bash
# Install core package
npm install fp-clean

# Install recipes (when available)
npm install fp-clean-recipes
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

## Development

### Commands

```bash
# Check formatting
bunx prettier --check .

# Type check
bunx tsc --noEmit -p tsconfig.json

# Build core package
cd packages/fp-clean && bun run build

# Run tests
cd packages/fp-clean && bun test
```

### Agent Support

This project includes a specialized OpenCode agent for fp-clean development. See [AGENTS.md](AGENTS.md) for details.

## License

MIT
