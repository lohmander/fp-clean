# fp-clean OpenCode Agent Guide

This document describes the specialized agent for working with the fp-clean project, which follows a strict philosophy of **safe, composable, explicit, clean up, observable** – making the safe way the easy way.

## Project Structure

- **`packages/fp-clean`**: Ultra-lean core library containing only essential types and combinators
  - `Operation`: `(R) => StreamResult<A, E>` – the core effect type
  - `StreamResult`: `Stream<Result<A, E>>` – streaming with error handling
  - `Context` & `Tag`: Type-safe dependency injection
  - `Runner`: Execution with resource cleanup (`stream`, `get`)
  - Basic constructors (`ok`, `err`, `fromIterable`, `trySync`, etc.)
  - Basic combinators (`map`, `flatMap`, `tap`, `mapErr`, `tapErr`)
  - `gen`: Generator-based syntax for sequential operations

- **`packages/fp-clean-recipes`** (to be created): Higher-level patterns and utilities
  - Filter/guard operations
  - Retry policies
  - Timeout handling
  - Scheduling
  - Resource management patterns
  - Common integrations

## Philosophy Implementation

### Safe

- Always use `Result` types (`Ok`/`Err`), never throw exceptions
- Handle all error cases explicitly
- Use type-safe dependency injection to prevent runtime errors
- Validate inputs at type level when possible

### Composable

- Follow functional composition patterns (`map`, `flatMap`, `pipe`)
- Ensure operations can be combined freely without side effects
- Design combinators that preserve the operation's structure

### Explicit

- Make dependencies explicit via type parameters `Operation<A, E, R>`
- No hidden state or side effects
- Clear separation between effect description and execution

### Clean Up

- Ensure resources are released via `AbortController`
- Implement finalization where needed
- Respect cancellation signals in streaming operations

### Observable

- Support streaming results for incremental observation
- Consider adding tracing/logging hooks for debugging
- Design for monitoring and introspection

## Agent Constraints

### Minimal & Focused

- **Never do more than what's asked**: Complete only the specific task requested, no extra work
- **No assumptions**: Don't assume requirements beyond what's explicitly stated
- **Direct implementation**: Implement exactly what's needed, no "nice-to-have" additions
- **Ask for clarification**: If a request is ambiguous or incomplete, ask for clarification rather than guessing
- **No proactive changes**: Only make changes when explicitly requested; don't "improve" unrelated code

## Architecture Understanding

### Core Concepts

1. **Operation**: `(R) => StreamResult<A, E>` – describes a computation requiring environment `R`, producing a stream of `Result<A, E>`
2. **StreamResult**: Async generator of `Result<A, E>` values – enables incremental processing with error handling
3. **Context**: Dependency injection container with `Tag`-based services
4. **Runner**: Executes operations with proper resource management (`stream` for streaming, `get` for single value)

### Type Safety

- Use TypeScript's advanced type system fully
- Leverage conditional types, mapped types, and inference
- Maintain full type safety across all operations
- Never use `any` or runtime type assertions

### Patterns from Similar Libraries

- **Effect-TS**: Context.Tag for dependency injection, Layer for composition
- **ZIO**: Module pattern, resource safety, streaming
- **fp-ts**: Algebraic structures, functional composition

## Development Guidelines

### Code Style

- No comments unless explicitly requested
- `camelCase` for functions, `PascalCase` for types and classes
- Import patterns: `* as F` for Operation, `* as Result` for Result, `* as StreamResult` for StreamResult
- Use `pipe` for function composition
- Follow existing naming conventions in the codebase

### Testing

- Use `bun test` with existing patterns
- Mock functions where appropriate using `bun:test` `mock`
- Test streaming behavior with async iteration
- Test all error cases thoroughly
- Test type safety where possible

### Package Boundaries

- **Core package** (`fp-clean`) must remain ultra-lean
  - Only essential abstractions needed for the foundation
  - No high-level patterns or utilities
  - Focus on stability and minimal API surface
- **Recipes package** (`fp-clean-recipes`) contains patterns
  - Builds on top of core package
  - Can have more dependencies if needed
  - Experimental patterns can live here first

### Adding New Features

1. **Core Package**: Only if absolutely essential for the foundation
   - New primitive operations
   - Essential combinators needed by many recipes
   - Bug fixes or performance improvements
2. **Recipes Package**: For patterns and utilities
   - Filter/guard operations
   - Retry policies with different strategies
   - Timeout handling
   - Resource management (bracket/acquireRelease)
   - Common integrations (HTTP, database, etc.)

## Commands to Run

### Before Finalizing Changes

```bash
# Check formatting
bunx prettier --check .

# Type check root config
bunx tsc --noEmit -p tsconfig.json

# Type check core package
cd packages/fp-clean && bunx tsc --noEmit -p tsconfig.json

# Build core package
cd packages/fp-clean && bun run build

# Run tests
cd packages/fp-clean && bun test
```

### For Recipes Package (when created)

```bash
# Type check recipes package
cd packages/fp-clean-recipes && bunx tsc --noEmit -p tsconfig.json

# Build recipes package
cd packages/fp-clean-recipes && bun run build

# Run tests for recipes
cd packages/fp-clean-recipes && bun test
```

## Agent Workflow

1. **Understand**: Analyze existing patterns before implementing
2. **Research**: Use Context7 for relevant patterns in similar libraries (Effect-TS, ZIO, fp-ts)
3. **Plan**: Consider how new code aligns with the five pillars
4. **Implement**: Follow existing code style and patterns
5. **Test**: Ensure all edge cases are covered
6. **Verify**: Run type checks and tests before considering work complete

## Common Implementation Patterns

### Creating a New Combinator (in Recipes)

```typescript
import { pipe } from "../pipe";
import * as F from "../Operation";
import * as Result from "../Result";

export const retry =
  <A, E, R>(policy: RetryPolicy) =>
  (op: F.Operation<A, E, R>): F.Operation<A, E, R> => {
    // Implementation following fp-clean patterns
  };
```

### Adding Resource Safety

- Always use `AbortController` for cancellation
- Clean up resources in finally blocks
- Consider adding `bracket` pattern to recipes

### Streaming Operations

- Respect backpressure in streaming operations
- Handle errors gracefully in streams
- Ensure streams can be cancelled

## References

- Effect-TS: Context.Tag, Layer composition, resource management
- ZIO: Module system, streaming, error handling
- fp-ts: Algebraic structures, functional patterns
- Existing fp-clean tests for patterns and conventions
