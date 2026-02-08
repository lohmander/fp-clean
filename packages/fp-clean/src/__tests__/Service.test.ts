import { describe, expect, test } from "bun:test";
import * as F from "~/Operation";
import * as Context from "~/Context";
import * as Service from "~/Service";
import { get } from "~/Runner";

// Define test service interface with direct Operation properties
interface Clock {
  now: F.Operation<Date>;
  timezone: F.Operation<string>;
}

// Define tag for clock service
class ClockTag extends Context.Tag("clock")<Clock>() {}

// Create a service proxy
const clockService = Service.proxy(ClockTag);

// Define test service interface with methods that return Operations
interface UserService {
  findById: (id: string) => F.Operation<{ id: string; name: string }, Error>;
  create: (name: string) => F.Operation<{ id: string; name: string }>;
}

// Define tag for user service
class UserServiceTag extends Context.Tag("userService")<UserService>() {}

// Create a service proxy
const userService = Service.proxy(UserServiceTag);

describe("Service.proxy", () => {
  describe("direct Operation properties", () => {
    test("creates proxy with correct method signatures", () => {
      // Verify proxy returns functions for all properties
      expect(typeof clockService.now).toBe("function");
      expect(typeof clockService.timezone).toBe("function");
    });

    test("now property (when called) returns operation that resolves to date", async () => {
      // Create a mock clock service
      const mockClock: Clock = {
        now: F.ok(new Date("2026-02-08T10:00:00Z")),
        timezone: F.ok("UTC"),
      };

      // Create context with mock service
      const context = Context.provide(
        ClockTag,
        F.ok(mockClock),
      )(Context.empty());

      // Call the proxy property to get the Operation
      const nowOp = clockService.now();

      // Execute the operation
      const result = await get(nowOp, context);

      // Debug: log error if failed
      if (!result.ok) {
        console.error("Error:", result.error);
      }

      // Verify result
      expect(result.ok).toBe(true);
      expect(result.value instanceof Date).toBe(true);
      expect(result.value.toISOString()).toBe("2026-02-08T10:00:00.000Z");
    });

    test("timezone property (when called) returns operation that resolves to string", async () => {
      // Create a mock clock service
      const mockClock: Clock = {
        now: F.ok(new Date("2026-02-08T10:00:00Z")),
        timezone: F.ok("UTC"),
      };

      // Create context with mock service
      const context = Context.provide(
        ClockTag,
        F.ok(mockClock),
      )(Context.empty());

      // Call the proxy property to get the Operation
      const tzOp = clockService.timezone();

      // Execute the operation
      const result = await get(tzOp, context);

      // Verify result
      expect(result.ok).toBe(true);
      expect(result.value).toBe("UTC");
    });

    test("proxy works with gen syntax", async () => {
      // Create a mock clock service
      const mockClock: Clock = {
        now: F.ok(new Date("2026-02-08T10:00:00Z")),
        timezone: F.ok("UTC"),
      };

      // Create context with mock service
      const context = Context.provide(
        ClockTag,
        F.ok(mockClock),
      )(Context.empty());

      // Create a composed operation using the proxy (call with parentheses)
      const composed = F.gen(function* () {
        const now = yield* clockService.now();
        const tz = yield* clockService.timezone();
        return { now, tz };
      });

      // Execute the composed operation
      const result = await get(composed, context);

      // Verify result
      expect(result.ok).toBe(true);
      expect(result.value.now instanceof Date).toBe(true);
      expect(result.value.tz).toBe("UTC");
    });
  });

  describe("methods that return Operations", () => {
    test("findById method with arguments returns operation", async () => {
      // Create a mock user service
      const mockUserService: UserService = {
        findById: (id: string) => F.ok({ id, name: `User ${id}` }),
        create: (name: string) => F.ok({ id: "new-id", name }),
      };

      // Create context with mock service
      const context = Context.provide(
        UserServiceTag,
        F.ok(mockUserService),
      )(Context.empty());

      // Call the proxy method with arguments
      const userOp = userService.findById("123");

      // Execute the operation
      const result = await get(userOp, context);

      // Verify result
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: "123", name: "User 123" });
    });

    test("create method with arguments returns operation", async () => {
      // Create a mock user service
      const mockUserService: UserService = {
        findById: (id: string) => F.ok({ id, name: `User ${id}` }),
        create: (name: string) => F.ok({ id: "new-id", name }),
      };

      // Create context with mock service
      const context = Context.provide(
        UserServiceTag,
        F.ok(mockUserService),
      )(Context.empty());

      // Call the proxy method with arguments
      const userOp = userService.create("John Doe");

      // Execute the operation
      const result = await get(userOp, context);

      // Verify result
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: "new-id", name: "John Doe" });
    });

    test("methods can be composed with gen syntax", async () => {
      // Create a mock user service
      const mockUserService: UserService = {
        findById: (id: string) => F.ok({ id, name: `User ${id}` }),
        create: (name: string) => F.ok({ id: "new-id", name }),
      };

      // Create context with mock service
      const context = Context.provide(
        UserServiceTag,
        F.ok(mockUserService),
      )(Context.empty());

      // Compose operations using gen
      const composed = F.gen(function* () {
        const newUser = yield* userService.create("Jane Doe");
        const foundUser = yield* userService.findById(newUser.id);
        return foundUser;
      });

      // Execute the composed operation
      const result = await get(composed, context);

      // Verify result
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: "new-id", name: "User new-id" });
    });
  });
});
