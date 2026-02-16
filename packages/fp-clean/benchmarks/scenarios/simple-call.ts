/**
 * Benchmark: Simple Service Call
 *
 * Compares the overhead of calling a simple service method using:
 * 1. Vanilla JS: Direct function call
 * 2. Manual flatMap: flatMap(service => service.method(...))(askFor(Tag))
 * 3. Service proxy: Service.proxy(Tag).method(...)
 */

import * as F from "~/Operation";
import * as Env from "~/Env";
import * as Service from "~/Service";
import { get } from "~/Runner";
import {
  runBenchmark,
  compareResults,
  printComparisonTable,
  type BenchmarkResult,
} from "../utils";

// Define a simple MathService interface
interface MathService {
  add: (a: number, b: number) => F.Operation<number>;
}

// Create the tag and proxy
class MathTag extends Env.Tag("math")<MathService>() {}
const mathService = Service.proxy(MathTag);

// Create test context
const mockMathService: MathService = {
  add: (a, b) => F.ok(a + b),
};

const testContext = Env.provide(MathTag, F.ok(mockMathService))(Env.empty());

// Vanilla JS baseline
function vanillaAdd(a: number, b: number): number {
  return a + b;
}

// Manual flatMap pattern
const manualAddOp = (a: number, b: number) =>
  F.flatMap((service: MathService) => service.add(a, b))(F.askFor(MathTag));

// Service proxy pattern
const proxyAddOp = (a: number, b: number) => mathService.add(a, b);

export async function runSimpleCallBenchmark(): Promise<BenchmarkResult[]> {
  console.log("\n🏃 Running Simple Service Call Benchmark...\n");

  const results: BenchmarkResult[] = [];

  // Benchmark 1: Vanilla JS (baseline)
  results.push(
    await runBenchmark(
      "Simple Call: Vanilla JS",
      () => {
        const result = vanillaAdd(3, 4);
        // Prevent optimization
        if (result !== 7) throw new Error("Unexpected result");
      },
      { warmupIterations: 10000, minSamples: 50000 },
    ),
  );

  // Benchmark 2: Manual flatMap pattern
  results.push(
    await runBenchmark(
      "Simple Call: Manual flatMap",
      async () => {
        const op = manualAddOp(3, 4);
        const result = await get(op, testContext);
        if (!result.ok || result.value !== 7)
          throw new Error("Unexpected result");
      },
      { warmupIterations: 1000, minSamples: 10000 },
    ),
  );

  // Benchmark 3: Service proxy pattern
  results.push(
    await runBenchmark(
      "Simple Call: Service Proxy",
      async () => {
        const op = proxyAddOp(3, 4);
        const result = await get(op, testContext);
        if (!result.ok || result.value !== 7)
          throw new Error("Unexpected result");
      },
      { warmupIterations: 1000, minSamples: 10000 },
    ),
  );

  // Print comparison
  const comparison = compareResults(results);
  if (comparison) {
    printComparisonTable(comparison);
  }

  return results;
}
