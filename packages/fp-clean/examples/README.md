# fp-clean Examples

This directory contains example programs demonstrating how to use fp-clean, with a focus on the Service proxy feature.

## Running Examples

Each example is a standalone TypeScript file that can be executed with [Bun](https://bun.sh):

```bash
cd packages/fp-clean
bun examples/basic-service-proxy.ts
```

## Examples

### 1. Basic Service Proxy (`basic-service-proxy.ts`)

Demonstrates the core Service proxy pattern:

- Defining service interfaces (`Logger`, `Database`)
- Creating Tags for each service
- Using `Service.proxy()` to create convenient proxies
- Writing programs with clean syntax using `yield* Service.method()`
- Providing mock implementations and running the program

**Key takeaway:** Service proxies dramatically reduce boilerplate when working with dependency injection.

### 2. Equivalence Comparison (`equivalence-comparison.ts`)

Shows that Service proxy calls are equivalent to manual `flatMap` patterns:

```typescript
// These two are equivalent:
Service.proxy(Tag).method(args)
flatMap(service => service.method(args))(askFor(Tag))
```

The example runs both styles with the same inputs and confirms they produce identical results.

**Key takeaway:** Service proxies are syntactic sugar that don't change the semantics of your program.

## Additional Examples to Consider Adding

- **Error Handling**: Demonstrating how errors propagate through service calls
- **Multiple Dependencies**: Combining multiple services in a single program
- **Real‑world Scenario**: Simulating a typical web application with database, logging, and configuration services
- **Performance Tips**: Showing how to store method references for performance-critical loops
- **Testing**: How to test programs that use service proxies

## Contributing Examples

Have a useful example? Contributions welcome! Please ensure:

1. Examples are self-contained and runnable with `bun examples/your-example.ts`
2. Include clear comments explaining the concepts
3. Follow the existing code style
