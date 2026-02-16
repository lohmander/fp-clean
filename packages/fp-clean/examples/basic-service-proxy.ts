#!/usr/bin/env bun
/**
 * Basic example demonstrating the Service proxy pattern in fp-clean.
 *
 * This example shows how to:
 * 1. Define a service interface
 * 2. Create a Tag for the service
 * 3. Use Service.proxy to create a convenient proxy
 * 4. Compose operations using the proxy
 * 5. Provide implementations and run the program
 */

import * as Context from "../src/Context";
import * as F from "../src/Operation";
import * as Runner from "../src/Runner";
import { Service } from "../src/Service";

// ============================================================================
// 1. Define Service Interfaces
// ============================================================================

interface Logger {
  log: (message: string) => F.Operation<void>;
  error: (message: string) => F.Operation<void>;
}

interface Database {
  getUser: (id: string) => F.Operation<{ id: string; name: string }, Error>;
  saveUser: (user: {
    name: string;
  }) => F.Operation<{ id: string; name: string }, Error>;
}

// ============================================================================
// 2. Create Tags
// ============================================================================

const LoggerTag = Context.Tag("logger")<Logger>();
const DatabaseTag = Context.Tag("database")<Database>();

// ============================================================================
// 3. Create Service Proxies
// ============================================================================

const LoggerService = Service.proxy(LoggerTag);
const DatabaseService = Service.proxy(DatabaseTag);

// ============================================================================
// 4. Write Your Program Using Service Proxies
// ============================================================================

/**
 * A program that logs, fetches a user, and saves a new user.
 * Notice how clean the syntax is compared to manual flatMap chains.
 */
const program = F.gen(function* () {
  yield* LoggerService.log("Starting user management program...");

  // Fetch existing user
  const user = yield* DatabaseService.getUser("user-123");
  yield* LoggerService.log(`Found user: ${user.name}`);

  // Create and save a new user
  const newUser = yield* DatabaseService.saveUser({ name: "Alice" });
  yield* LoggerService.log(`Created new user: ${newUser.name}`);

  // Return both users
  return { existing: user, created: newUser };
});

// ============================================================================
// 5. Provide Implementations
// ============================================================================

// Mock implementations
const mockLogger: Logger = {
  log: (message) => {
    console.log(`[LOG] ${message}`);
    return F.ok(undefined);
  },
  error: (message) => {
    console.error(`[ERROR] ${message}`);
    return F.ok(undefined);
  },
};

const mockDatabase: Database = {
  getUser: (id) => {
    console.log(`[DB] Fetching user ${id}`);
    return F.ok({ id, name: "John Doe" });
  },
  saveUser: (user) => {
    console.log(`[DB] Saving user ${user.name}`);
    const saved = { id: `user-${Date.now()}`, name: user.name };
    return F.ok(saved);
  },
};

// Build context with implementations
const context = pipe(
  Context.empty(),
  Context.provide(LoggerTag, F.ok(mockLogger)),
  Context.provide(DatabaseTag, F.ok(mockDatabase)),
);

// ============================================================================
// 6. Run the Program
// ============================================================================

import { pipe } from "../src/pipe";

async function main() {
  console.log("=== Running fp-clean Service Proxy Example ===\n");

  const result = await Runner.get(program, context);

  if (result.ok) {
    console.log("\n✅ Program succeeded!");
    console.log("Result:", result.value);
  } else {
    console.error("\n❌ Program failed:", result.error);
  }
}

main().catch(console.error);
