/**
 * Benchmark: isOperation Check Performance
 *
 * Tests the performance of the isOperation runtime check vs alternatives.
 */

import * as F from "~/Operation";
import { OperationBrand } from "~/Operation/types";
import {
  runBenchmark,
  printBenchmarkResult,
  type BenchmarkResult,
} from "../utils";

// Create test operations
const testOp = F.ok(42);
const testFn = () => 42;
const testObj = { [OperationBrand]: true };

// The actual isOperation implementation from Service.ts
const isOperation = (value: unknown): value is F.Operation<unknown> => {
  if (typeof value !== "function") {
    return false;
  }
  return (value as any)[OperationBrand] === true;
};

// Alternative implementations for comparison
const isOperationBrandOnly = (value: unknown): boolean => {
  return (value as any)?.[OperationBrand] === true;
};

const isOperationTypeof = (value: unknown): boolean => {
  return typeof value === "function";
};

const isOperationInstance = (value: unknown): boolean => {
  return value instanceof Function && (value as any)[OperationBrand] === true;
};

export async function runIsOperationBenchmark(): Promise<BenchmarkResult[]> {
  console.log("\n🏃 Running isOperation Check Benchmark...\n");

  const results: BenchmarkResult[] = [];

  // Benchmark 1: Current implementation with isOperation
  results.push(
    await runBenchmark(
      "isOperation: Full check (function + brand)",
      () => {
        const r1 = isOperation(testOp);
        const r2 = isOperation(testFn);
        const r3 = isOperation(testObj);
        const r4 = isOperation(null);
        const r5 = isOperation(undefined);
        // Prevent optimization
        if (
          r1 !== true ||
          r2 !== false ||
          r3 !== false ||
          r4 !== false ||
          r5 !== false
        ) {
          throw new Error("Unexpected result");
        }
      },
      { warmupIterations: 10000, minSamples: 50000 },
    ),
  );

  // Benchmark 2: Brand check only
  results.push(
    await runBenchmark(
      "isOperation: Brand check only",
      () => {
        const r1 = isOperationBrandOnly(testOp);
        const r2 = isOperationBrandOnly(testFn);
        const r3 = isOperationBrandOnly(testObj);
        const r4 = isOperationBrandOnly(null);
        const r5 = isOperationBrandOnly(undefined);
        if (
          r1 !== true ||
          r2 !== false ||
          r3 !== true ||
          r4 !== false ||
          r5 !== false
        ) {
          throw new Error("Unexpected result");
        }
      },
      { warmupIterations: 10000, minSamples: 50000 },
    ),
  );

  // Benchmark 3: typeof only
  results.push(
    await runBenchmark(
      "isOperation: typeof function only",
      () => {
        const r1 = isOperationTypeof(testOp);
        const r2 = isOperationTypeof(testFn);
        const r3 = isOperationTypeof(testObj);
        const r4 = isOperationTypeof(null);
        const r5 = isOperationTypeof(undefined);
        if (
          r1 !== true ||
          r2 !== true ||
          r3 !== false ||
          r4 !== false ||
          r5 !== false
        ) {
          throw new Error("Unexpected result");
        }
      },
      { warmupIterations: 10000, minSamples: 50000 },
    ),
  );

  // Benchmark 4: instanceof check
  results.push(
    await runBenchmark(
      "isOperation: instanceof Function",
      () => {
        const r1 = isOperationInstance(testOp);
        const r2 = isOperationInstance(testFn);
        const r3 = isOperationInstance(testObj);
        const r4 = isOperationInstance(null);
        const r5 = isOperationInstance(undefined);
        if (
          r1 !== true ||
          r2 !== false ||
          r3 !== false ||
          r4 !== false ||
          r5 !== false
        ) {
          throw new Error("Unexpected result");
        }
      },
      { warmupIterations: 10000, minSamples: 50000 },
    ),
  );

  // Benchmark 5: Direct property access (fastest possible)
  results.push(
    await runBenchmark(
      "isOperation: Direct property access",
      () => {
        const r1 = (testOp as any)[OperationBrand] === true;
        const r2 = (testFn as any)[OperationBrand] === true;
        const r3 = (testObj as any)[OperationBrand] === true;
        const r4 = (null as any)?.[OperationBrand] === true;
        const r5 = (undefined as any)?.[OperationBrand] === true;
        if (
          r1 !== true ||
          r2 !== false ||
          r3 !== true ||
          r4 !== false ||
          r5 !== false
        ) {
          throw new Error("Unexpected result");
        }
      },
      { warmupIterations: 10000, minSamples: 50000 },
    ),
  );

  // Print results
  console.log("\n📊 isOperation Check Performance Results:");
  console.log("=".repeat(80));

  for (const result of results) {
    printBenchmarkResult(result);
  }

  // Find baseline for comparison
  const fullCheck = results.find((r) => r.name.includes("Full check"));
  const directAccess = results.find((r) => r.name.includes("Direct property"));

  if (fullCheck && directAccess) {
    const overhead =
      ((fullCheck.mean - directAccess.mean) / directAccess.mean) * 100;

    console.log("\n📉 Analysis:");
    console.log(
      `   Full check overhead vs direct access: ${overhead.toFixed(2)}%`,
    );
    console.log(
      `   Full check adds ${((fullCheck.mean - directAccess.mean) / 1000).toFixed(2)} ns per check`,
    );

    // Find the fastest alternative that still maintains type safety
    const safeAlternatives = results.filter(
      (r) =>
        !r.name.includes("Brand check only") && // Would incorrectly identify objects
        !r.name.includes("Direct property") && // Would throw on null/undefined
        !r.name.includes("Full check"),
    );

    if (safeAlternatives.length > 0) {
      const fastest = safeAlternatives.reduce((min, r) =>
        r.mean < min.mean ? r : min,
      );
      const speedup = ((fullCheck.mean - fastest.mean) / fullCheck.mean) * 100;

      console.log(`\n   Fastest safe alternative: ${fastest.name}`);
      console.log(`   Potential speedup: ${speedup.toFixed(2)}%`);

      if (speedup > 20) {
        console.log("   💡 Consider optimizing the isOperation check");
      } else {
        console.log("   ✅ Current implementation is well-optimized");
      }
    }
  }

  return results;
}
