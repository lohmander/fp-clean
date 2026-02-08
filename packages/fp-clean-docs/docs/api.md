# API Documentation

API documentation is automatically generated from TypeScript source code using TypeDoc.

## Core Types

- **Operation**: The core effect type `(R) => StreamResult<A, E>`
- **StreamResult**: Streaming with error handling `Stream<Result<A, E>>`
- **Result**: Discriminated union `Ok<A> | Err<E>`
- **Context**: Dependency injection container
- **Tag**: Type-safe service tags

## Generate API Docs

To generate the API documentation:

```bash
cd packages/fp-clean-docs
bun run generate-api
```

This will scan the TypeScript source code and generate Markdown files in `docs/api/`.
