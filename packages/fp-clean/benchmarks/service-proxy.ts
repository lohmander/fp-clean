import { Bench } from "tinybench";
import * as F from "../src/Operation";
import * as Context from "../src/Context";
import * as Service from "../src/Service";
import { get } from "../src/Runner";

// Define a simple service interface for benchmarks
interface MathService {
  add: (a: number, b: number) => F.Operation<number>;
  multiply: (a: number, b: number) => F.Operation<number>;
}

class MathTag extends Context.Tag("math")<MathService>() {}

// Create a mock service implementation
const mockMathService: MathService = {
  add: (a, b) => F.ok(a + b),
  multiply: (a, b) => F.ok(a * b),
};

// Create context with the service
const mathContext = Context.provide(
  MathTag,
  F.ok(mockMathService),
)(Context.empty());

async function benchmarkServiceProxy() {
  const bench = new Bench({ time: 200 });

  console.log("=== Service Proxy Performance Benchmarks ===\n");

  // Scenario 1: Operation Creation Overhead
  bench.add("1. Vanilla - direct function call (baseline)", () => {
    mockMathService.add(5, 3);
  });

  bench.add("2. Manual flatMap - operation creation", () => {
    F.flatMap((service: MathService) => service.add(5, 3))(F.askFor(MathTag));
  });

  // Create proxy once
  const MathServiceProxy = Service.proxy(MathTag);

  bench.add("3. Service proxy - property access + call", () => {
    MathServiceProxy.add(5, 3);
  });

  // Store method reference
  const addViaProxy = MathServiceProxy.add;
  bench.add("4. Service proxy - stored method reference", () => {
    addViaProxy(5, 3);
  });

  // Store manual flatMap function for comparison
  const addViaFlatMap = (a: number, b: number) =>
    F.flatMap((service: MathService) => service.add(a, b))(F.askFor(MathTag));
  bench.add("5. Manual flatMap - stored function", () => {
    addViaFlatMap(5, 3);
  });

  // Scenario 2: Execution Overhead (including get)
  bench.add("6. Execute vanilla (mock only)", async () => {
    mockMathService.add(5, 3);
  });

  bench.add("7. Execute operation via get (manual flatMap)", async () => {
    const op = F.flatMap((service: MathService) => service.add(5, 3))(
      F.askFor(MathTag),
    );
    await get(op, mathContext);
  });

  bench.add("8. Execute operation via get (service proxy)", async () => {
    const op = MathServiceProxy.add(5, 3);
    await get(op, mathContext);
  });

  // Scenario 3: Proxy Creation Overhead
  bench.add("9. Create service proxy", () => {
    Service.proxy(MathTag);
  });

  await bench.run();

  console.table(bench.table());

  // Simple analysis using mean latency
  console.log("\n=== Performance Analysis (using mean latency) ===\n");

  const tasks = bench.tasks;
  const results = new Map();
  for (const task of tasks) {
    if (task.result) {
      results.set(task.name, task.result.mean); // mean in nanoseconds
    }
  }

  const vanilla = results.get("1. Vanilla - direct function call (baseline)");
  if (vanilla) {
    console.log(
      `Baseline (vanilla): ${(vanilla / 1000).toFixed(3)} µs per call`,
    );

    for (const [name, mean] of results) {
      if (name.includes("Vanilla")) continue;

      const ratio = mean / vanilla;
      const overheadNs = mean - vanilla;
      console.log(`\n${name}:`);
      console.log(
        `  ${(mean / 1000).toFixed(3)} µs per call (${ratio.toFixed(2)}x slower)`,
      );
      console.log(`  ${overheadNs.toFixed(0)} ns overhead`);

      if (name.includes("property access")) {
        console.log(`  (includes property access overhead)`);
      } else if (name.includes("stored method")) {
        console.log(`  (method reference stored)`);
      }
    }
  }

  // Compare manual flatMap vs service proxy (stored versions)
  const manual = results.get("5. Manual flatMap - stored function");
  const proxy = results.get("4. Service proxy - stored method reference");
  if (manual && proxy) {
    console.log("\n=== Service Proxy vs Manual flatMap ===");
    console.log(`Service proxy: ${(proxy / 1000).toFixed(3)} µs`);
    console.log(`Manual flatMap: ${(manual / 1000).toFixed(3)} µs`);
    console.log(
      `Overhead: ${(proxy - manual).toFixed(0)} ns (${(proxy / manual).toFixed(2)}x)`,
    );
  }

  // Compare execution
  const execManual = results.get(
    "7. Execute operation via get (manual flatMap)",
  );
  const execProxy = results.get("8. Execute operation via get (service proxy)");
  if (execManual && execProxy) {
    console.log("\n=== Execution Overhead ===");
    console.log(`Service proxy execution: ${(execProxy / 1000).toFixed(3)} µs`);
    console.log(
      `Manual flatMap execution: ${(execManual / 1000).toFixed(3)} µs`,
    );
    console.log(
      `Execution overhead: ${(execProxy - execManual).toFixed(0)} ns (${(execProxy / execManual).toFixed(2)}x)`,
    );
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  benchmarkServiceProxy().catch(console.error);
}

export { benchmarkServiceProxy };
