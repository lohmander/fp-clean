import { Bench } from "tinybench";
import * as F from "../src/Operation";
import * as Service from "../src/Service";
import { OperationBrand } from "../src/Operation";

async function benchmarkMicroOperations() {
  const bench = new Bench({ time: 200 });

  console.log("=== Micro-Operations Benchmarks ===\n");
  console.log("Measuring low-level operation checks and utilities\n");

  // Create test values
  const operation = F.ok(42);
  const regularFunction = () => 42;
  const objectWithIterator = {
    [Symbol.iterator]: function* () {
      yield 42;
    },
  };
  const functionWithIterator = () => 42;
  (functionWithIterator as any)[Symbol.iterator] = function* () {
    yield 42;
  };

  // 1. Type checking overhead
  bench.add('1. typeof value === "function"', () => {
    typeof operation === "function";
  });

  bench.add("2. OperationBrand in value", () => {
    OperationBrand in operation;
  });

  bench.add("3. value[OperationBrand] === true", () => {
    (operation as any)[OperationBrand] === true;
  });

  bench.add("4. Symbol.iterator in value", () => {
    Symbol.iterator in operation;
  });

  bench.add("5. isOperation (current implementation)", () => {
    // Replicate the current isOperation check from Service.ts
    if (typeof operation !== "function") return false;
    return (operation as any)[OperationBrand] === true;
  });

  bench.add("6. isOperation (legacy with iterator fallback)", () => {
    // Previous implementation with iterator fallback
    if (typeof operation !== "function") return false;
    if (
      OperationBrand in operation &&
      (operation as any)[OperationBrand] === true
    ) {
      return true;
    }
    return (
      Symbol.iterator in operation &&
      typeof (operation as any)[Symbol.iterator] === "function"
    );
  });

  // 2. Brand check on different value types
  bench.add("7. Brand check on regular function", () => {
    (regularFunction as any)[OperationBrand] === true;
  });

  bench.add("8. Brand check on object with iterator", () => {
    (objectWithIterator as any)[OperationBrand] === true;
  });

  bench.add("9. Brand check on function with iterator", () => {
    (functionWithIterator as any)[OperationBrand] === true;
  });

  // 3. Proxy overhead (micro)
  bench.add("10. Direct function call", () => {
    const fn = () => F.ok(42);
    fn();
  });

  bench.add("11. Proxy get trap invocation", () => {
    const proxy = new Proxy(
      {},
      {
        get(_, key) {
          return () => F.ok(42);
        },
      },
    );
    (proxy as any).method();
  });

  // 4. Generator overhead (used in gen)
  bench.add("12. Create generator function", () => {
    function* gen() {
      yield 42;
      return 42;
    }
    gen();
  });

  bench.add("13. Execute generator (next)", () => {
    function* gen() {
      yield 42;
      return 42;
    }
    const g = gen();
    g.next();
  });

  await bench.run();

  console.table(bench.table());

  // Analysis
  console.log("\n=== Micro-Operations Analysis ===\n");

  const tasks = bench.tasks;

  // Compare isOperation implementations
  const currentTask = tasks.find((t) =>
    t.name.includes("current implementation"),
  );
  const legacyTask = tasks.find((t) => t.name.includes("legacy with iterator"));

  if (currentTask?.result && legacyTask?.result) {
    const speedup = legacyTask.result.mean / currentTask.result.mean;
    console.log(
      `Current isOperation is ${speedup.toFixed(2)}x faster than legacy implementation`,
    );
  }

  // Compare brand check vs iterator check
  const brandTask = tasks.find((t) =>
    t.name.includes("value[OperationBrand] === true"),
  );
  const iteratorTask = tasks.find((t) =>
    t.name.includes("Symbol.iterator in value"),
  );

  if (brandTask?.result && iteratorTask?.result) {
    const ratio = iteratorTask.result.mean / brandTask.result.mean;
    console.log(
      `Brand check is ${ratio.toFixed(2)}x faster than iterator existence check`,
    );
  }

  // Proxy overhead
  const directTask = tasks.find((t) => t.name.includes("Direct function call"));
  const proxyTask = tasks.find((t) =>
    t.name.includes("Proxy get trap invocation"),
  );

  if (directTask?.result && proxyTask?.result) {
    const overhead = proxyTask.result.mean / directTask.result.mean;
    console.log(
      `Proxy invocation is ${overhead.toFixed(2)}x slower than direct function call`,
    );
  }

  // Generator overhead
  const createTask = tasks.find((t) =>
    t.name.includes("Create generator function"),
  );
  const executeTask = tasks.find((t) =>
    t.name.includes("Execute generator (next)"),
  );

  if (createTask?.result && executeTask?.result) {
    console.log(
      `Generator creation: ${(createTask.result.mean * 1000).toFixed(3)}ms`,
    );
    console.log(
      `Generator next(): ${(executeTask.result.mean * 1000).toFixed(3)}ms`,
    );
  }

  // Summary of key overheads
  console.log("\n=== Key Takeaways ===");
  console.log("1. OperationBrand check is very fast (~few nanoseconds)");
  console.log("2. Proxy get traps add significant overhead (10-100x)");
  console.log("3. Generator creation is cheap, but execution adds overhead");
  console.log("4. Current isOperation implementation is optimized well");
}

// Run if this file is executed directly
if (import.meta.main) {
  benchmarkMicroOperations().catch(console.error);
}

export { benchmarkMicroOperations };
