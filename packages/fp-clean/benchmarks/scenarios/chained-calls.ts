/**
 * Benchmark: Chained Service Calls
 *
 * Compares the overhead of multiple sequential service calls using:
 * 1. Vanilla JS: Direct function calls
 * 2. Manual flatMap: Using gen with manual askFor
 * 3. Service proxy: Using Service.proxy with gen
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

// Define a MathService with multiple operations
interface MathService {
  add: (a: number, b: number) => F.Operation<number>;
  multiply: (a: number, b: number) => F.Operation<number>;
  subtract: (a: number, b: number) => F.Operation<number>;
}

// Create the tag and proxy
class MathTag extends Env.Tag("math")<MathService>() {}
const mathService = Service.proxy(MathTag);

// Create test context
const mockMathService: MathService = {
  add: (a, b) => F.ok(a + b),
  multiply: (a, b) => F.ok(a * b),
  subtract: (a, b) => F.ok(a - b),
};

const testContext = Env.provide(MathTag, F.ok(mockMathService))(Env.empty());

// Vanilla JS: ((5 + 3) * 2) - 4 = 12
function vanillaChained(): number {
  const sum = 5 + 3; // 8
  const product = sum * 2; // 16
  return product - 4; // 12
}

// Factory functions to create fresh operations (gen creates consumable generators)
const createManualChainedOp = () =>
  F.gen(function* () {
    const math = yield* F.askFor(MathTag);
    const sum = yield* math.add(5, 3);
    const product = yield* math.multiply(sum, 2);
    const result = yield* math.subtract(product, 4);
    return result;
  });

const createProxyChainedOp = () =>
  F.gen(function* () {
    const sum = yield* mathService.add(5, 3);
    const product = yield* mathService.multiply(sum, 2);
    const result = yield* mathService.subtract(product, 4);
    return result;
  });

export async function runChainedCallsBenchmark(): Promise<BenchmarkResult[]> {
  console.log("\n🏃 Running Chained Service Calls Benchmark...\n");

  const results: BenchmarkResult[] = [];

  // Benchmark 1: Vanilla JS (baseline)
  results.push(
    await runBenchmark(
      "Chained Calls: Vanilla JS",
      () => {
        const result = vanillaChained();
        if (result !== 12) throw new Error("Unexpected result");
      },
      { warmupIterations: 10000, minSamples: 50000 },
    ),
  );

  // Benchmark 2: Manual flatMap pattern
  results.push(
    await runBenchmark(
      "Chained Calls: Manual flatMap",
      async () => {
        const op = createManualChainedOp();
        const result = await get(op, testContext);
        if (!result.ok || result.value !== 12)
          throw new Error("Unexpected result");
      },
      { warmupIterations: 1000, minSamples: 5000 },
    ),
  );

  // Benchmark 3: Service proxy pattern
  results.push(
    await runBenchmark(
      "Chained Calls: Service Proxy",
      async () => {
        const op = createProxyChainedOp();
        const result = await get(op, testContext);
        if (!result.ok || result.value !== 12)
          throw new Error("Unexpected result");
      },
      { warmupIterations: 1000, minSamples: 5000 },
    ),
  );

  // Print comparison
  const comparison = compareResults(results);
  if (comparison) {
    printComparisonTable(comparison);
  }

  return results;
}
