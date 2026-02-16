/**
 * Benchmark: Proxy Creation Overhead
 *
 * Measures the cost of creating the Service.proxy vs reusing it.
 */

import * as F from "~/Operation";
import * as Env from "~/Env";
import * as Service from "~/Service";
import { get } from "~/Runner";
import {
  runBenchmark,
  printBenchmarkResult,
  type BenchmarkResult,
} from "../utils";

// Define a simple service
interface MathService {
  add: (a: number, b: number) => F.Operation<number>;
}

class MathTag extends Env.Tag("math")<MathService>() {}

// Pre-created proxy (reused)
const cachedProxy = Service.proxy(MathTag);

// Test context
const mockMathService: MathService = {
  add: (a, b) => F.ok(a + b),
};

const testContext = Env.provide(MathTag, F.ok(mockMathService))(Env.empty());

export async function runProxyCreationBenchmark(): Promise<BenchmarkResult[]> {
  console.log("\n🏃 Running Proxy Creation Overhead Benchmark...\n");

  const results: BenchmarkResult[] = [];

  // Benchmark 1: Creating proxy each time (worst case)
  results.push(
    await runBenchmark(
      "Proxy Creation: New each call",
      async () => {
        const newProxy = Service.proxy(MathTag);
        const op = newProxy.add(3, 4);
        const result = await get(op, testContext);
        if (!result.ok || result.value !== 7)
          throw new Error("Unexpected result");
      },
      { warmupIterations: 100, minSamples: 1000 },
    ),
  );

  // Benchmark 2: Reusing cached proxy (best case)
  results.push(
    await runBenchmark(
      "Proxy Creation: Reused proxy",
      async () => {
        const op = cachedProxy.add(3, 4);
        const result = await get(op, testContext);
        if (!result.ok || result.value !== 7)
          throw new Error("Unexpected result");
      },
      { warmupIterations: 1000, minSamples: 10000 },
    ),
  );

  // Print individual results
  console.log("\n📊 Proxy Creation Overhead Results:");
  console.log("=".repeat(80));

  for (const result of results) {
    printBenchmarkResult(result);
  }

  // Calculate and print overhead
  const newEachTime = results.find((r) => r.name.includes("New"));
  const reused = results.find((r) => r.name.includes("Reused"));

  if (newEachTime && reused) {
    const overhead = ((newEachTime.mean - reused.mean) / reused.mean) * 100;
    const creationCost = newEachTime.mean - reused.mean;

    console.log("\n📉 Analysis:");
    console.log(
      `   Creating a new proxy adds ${overhead.toFixed(2)}% overhead`,
    );
    console.log(
      `   Proxy creation cost: ${(creationCost / 1000).toFixed(2)} µs per creation`,
    );

    if (overhead > 50) {
      console.log(
        "   ⚠️  Recommendation: Cache proxy instances at module level",
      );
      console.log(
        "      const MyService = Service.proxy(MyTag); // Do this once",
      );
    } else {
      console.log(
        "   ✅ Proxy creation overhead is acceptable for on-demand use",
      );
    }
  }

  return results;
}
