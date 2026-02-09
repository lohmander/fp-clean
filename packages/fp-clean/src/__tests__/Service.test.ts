import { describe, expect, test } from "bun:test";
import * as F from "~/Operation";
import * as Context from "~/Context";
import * as Service from "~/Service";
import { get } from "~/Runner";

// Define test service interface with methods that return Operations
interface Clock {
  now: () => F.Operation<Date>;
  timezone: () => F.Operation<string>;
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
  describe("methods that return Operations", () => {
    test("creates proxy with correct method signatures", () => {
      // Verify proxy returns functions for all properties
      expect(typeof clockService.now).toBe("function");
      expect(typeof clockService.timezone).toBe("function");
      expect(typeof userService.findById).toBe("function");
      expect(typeof userService.create).toBe("function");
    });

    test("now method returns operation that resolves to date", async () => {
      // Create a mock clock service
      const mockClock: Clock = {
        now: () => F.ok(new Date("2026-02-08T10:00:00Z")),
        timezone: () => F.ok("UTC"),
      };

      // Create context with mock service
      const context = Context.provide(
        ClockTag,
        F.ok(mockClock),
      )(Context.empty());

      // Call the proxy method to get the Operation
      const nowOp = clockService.now();

      // Execute the operation
      const result = await get(nowOp, context);

      // Verify result
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value instanceof Date).toBe(true);
      expect(result.value.toISOString()).toBe("2026-02-08T10:00:00.000Z");
    });

    test("timezone method returns operation that resolves to string", async () => {
      // Create a mock clock service
      const mockClock: Clock = {
        now: () => F.ok(new Date("2026-02-08T10:00:00Z")),
        timezone: () => F.ok("UTC"),
      };

      // Create context with mock service
      const context = Context.provide(
        ClockTag,
        F.ok(mockClock),
      )(Context.empty());

      // Call the proxy method to get the Operation
      const tzOp = clockService.timezone();

      // Execute the operation
      const result = await get(tzOp, context);

      // Verify result
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("UTC");
    });

    test("proxy works with gen syntax", async () => {
      // Create a mock clock service
      const mockClock: Clock = {
        now: () => F.ok(new Date("2026-02-08T10:00:00Z")),
        timezone: () => F.ok("UTC"),
      };

      // Create context with mock service
      const context = Context.provide(
        ClockTag,
        F.ok(mockClock),
      )(Context.empty());

      // Create a composed operation using the proxy
      const composed = F.gen(function* () {
        const now = yield* clockService.now();
        const tz = yield* clockService.timezone();
        return { now, tz };
      });

      // Execute the composed operation
      const result = await get(composed, context);

      // Verify result
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.now instanceof Date).toBe(true);
      expect(result.value.tz).toBe("UTC");
    });

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
      if (!result.ok) return;
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
      if (!result.ok) return;
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
      if (!result.ok) return;
      expect(result.value).toEqual({ id: "new-id", name: "User new-id" });
    });

    test("throws helpful error when property is not a function", async () => {
      // Define a service with a non‑function property (should be a type error,
      // but we test runtime behavior anyway)
      interface BadService {
        value: number; // not a function
      }
      class BadServiceTag extends Context.Tag("bad")<BadService>() {}
      const badService = Service.proxy(BadServiceTag) as any; // cast to any to bypass type error

      const mockBadService: BadService = { value: 42 };
      const context = Context.provide(
        BadServiceTag,
        F.ok(mockBadService),
      )(Context.empty());

      const op = badService.value(); // This will call the proxy's function

      // The proxy will throw inside the Operation when executed
      const result = await get(op, context);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain("is not a function");
      }
    });
  });

  describe("equivalence with flatMap pattern", () => {
    interface MathService {
      add: (a: number, b: number) => F.Operation<number>;
      multiply: (a: number, b: number) => F.Operation<number>;
    }

    class MathTag extends Context.Tag("math")<MathService>() {}

    const mathService = Service.proxy(MathTag);

    test("proxy method is equivalent to flatMap(service => service.method(...))(askFor(tag))", async () => {
      const mockMath: MathService = {
        add: (a, b) => F.ok(a + b),
        multiply: (a, b) => F.ok(a * b),
      };

      const context = Context.provide(
        MathTag,
        F.ok(mockMath),
      )(Context.empty());

      // Using proxy
      const proxyOp = mathService.add(3, 4);
      const proxyResult = await get(proxyOp, context);

      // Using manual flatMap pattern
      const manualOp = F.flatMap((service: MathService) => service.add(3, 4))(
        F.askFor(MathTag),
      );
      const manualResult = await get(manualOp, context);

      // Both should yield the same result
      expect(proxyResult.ok).toBe(true);
      expect(manualResult.ok).toBe(true);
      if (proxyResult.ok && manualResult.ok) {
        expect(proxyResult.value).toBe(7);
        expect(manualResult.value).toBe(7);
        expect(proxyResult.value).toEqual(manualResult.value);
      }
    });

    test("composition equivalence", async () => {
      const mockMath: MathService = {
        add: (a, b) => F.ok(a + b),
        multiply: (a, b) => F.ok(a * b),
      };

      const context = Context.provide(
        MathTag,
        F.ok(mockMath),
      )(Context.empty());

      // Composed operation using proxy
      const proxyOp = F.gen(function* () {
        const sum = yield* mathService.add(5, 3);
        const product = yield* mathService.multiply(sum, 2);
        return product;
      });

      // Composed operation using manual pattern
      const manualOp = F.gen(function* () {
        const math = yield* F.askFor(MathTag);
        const sum = yield* math.add(5, 3);
        const product = yield* math.multiply(sum, 2);
        return product;
      });

      const proxyResult = await get(proxyOp, context);
      const manualResult = await get(manualOp, context);

      expect(proxyResult.ok).toBe(true);
      expect(manualResult.ok).toBe(true);
      if (proxyResult.ok && manualResult.ok) {
        expect(proxyResult.value).toBe(16); // (5 + 3) * 2
        expect(manualResult.value).toBe(16);
      }
    });
  });
});
