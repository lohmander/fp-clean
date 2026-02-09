/**
 * Benchmark utilities for statistical analysis and formatting
 */

export interface BenchmarkResult {
  name: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  samples: number;
  opsPerSecond: number;
}

export interface ComparisonResult {
  name: string;
  vanilla: BenchmarkResult;
  manualFlatMap: BenchmarkResult;
  serviceProxy: BenchmarkResult;
  overheadVsVanilla: {
    manualFlatMap: number;
    serviceProxy: number;
  };
  overheadVsManual: {
    serviceProxy: number;
  };
}

/**
 * Format a number with appropriate units
 */
export function formatTime(ns: number): string {
  if (ns < 1_000) return `${ns.toFixed(2)} ns`;
  if (ns < 1_000_000) return `${(ns / 1_000).toFixed(2)} µs`;
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(2)} ms`;
  return `${(ns / 1_000_000_000).toFixed(2)} s`;
}

/**
 * Format operations per second
 */
export function formatOps(opsPerSecond: number): string {
  if (opsPerSecond >= 1_000_000_000)
    return `${(opsPerSecond / 1_000_000_000).toFixed(2)}B ops/s`;
  if (opsPerSecond >= 1_000_000)
    return `${(opsPerSecond / 1_000_000).toFixed(2)}M ops/s`;
  if (opsPerSecond >= 1_000)
    return `${(opsPerSecond / 1_000).toFixed(2)}K ops/s`;
  return `${opsPerSecond.toFixed(2)} ops/s`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Calculate statistics from an array of timing samples (in nanoseconds)
 */
export function calculateStats(
  samples: number[],
): Omit<BenchmarkResult, "name"> {
  const n = samples.length;
  if (n === 0) {
    return {
      mean: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      samples: 0,
      opsPerSecond: 0,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);

  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance =
    samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    stdDev,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    samples: n,
    opsPerSecond: 1_000_000_000 / mean,
  };
}

/**
 * Run a benchmark function multiple times and collect statistics
 */
export async function runBenchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: {
    warmupIterations?: number;
    minSamples?: number;
    maxTime?: number;
  } = {},
): Promise<BenchmarkResult> {
  const {
    warmupIterations = 1000,
    minSamples = 10000,
    maxTime = 5000, // 5 seconds max
  } = options;

  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // Collect samples
  const samples: number[] = [];
  const startTime = performance.now();

  while (
    samples.length < minSamples &&
    performance.now() - startTime < maxTime
  ) {
    const sampleStart = process.hrtime.bigint();
    await fn();
    const sampleEnd = process.hrtime.bigint();
    samples.push(Number(sampleEnd - sampleStart));
  }

  const stats = calculateStats(samples);
  return {
    name,
    ...stats,
  };
}

/**
 * Compare multiple benchmark results
 */
export function compareResults(
  results: BenchmarkResult[],
): ComparisonResult | null {
  if (results.length < 3) return null;

  const vanilla = results.find(
    (r) => r.name.includes("vanilla") || r.name.includes("Vanilla"),
  );
  const manual = results.find(
    (r) => r.name.includes("manual") || r.name.includes("Manual"),
  );
  const proxy = results.find(
    (r) => r.name.includes("proxy") || r.name.includes("Proxy"),
  );

  if (!vanilla || !manual || !proxy) return null;

  const name = results[0]?.name.split(":")[0] || "Comparison";

  return {
    name,
    vanilla,
    manualFlatMap: manual,
    serviceProxy: proxy,
    overheadVsVanilla: {
      manualFlatMap: ((manual.mean - vanilla.mean) / vanilla.mean) * 100,
      serviceProxy: ((proxy.mean - vanilla.mean) / vanilla.mean) * 100,
    },
    overheadVsManual: {
      serviceProxy: ((proxy.mean - manual.mean) / manual.mean) * 100,
    },
  };
}

/**
 * Print a benchmark comparison table
 */
export function printComparisonTable(result: ComparisonResult): void {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 Benchmark: ${result.name}`);
  console.log("=".repeat(80));

  // Print results table
  console.log(
    "\n┌─────────────────────┬──────────────────┬──────────────────┬──────────────────┐",
  );
  console.log(
    "│ Metric              │ Vanilla JS       │ Manual flatMap   │ Service Proxy    │",
  );
  console.log(
    "├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤",
  );

  type Row = [string, number, number, number];
  const rows: Row[] = [
    [
      "Mean",
      result.vanilla.mean,
      result.manualFlatMap.mean,
      result.serviceProxy.mean,
    ],
    [
      "Std Dev",
      result.vanilla.stdDev,
      result.manualFlatMap.stdDev,
      result.serviceProxy.stdDev,
    ],
    [
      "Min",
      result.vanilla.min,
      result.manualFlatMap.min,
      result.serviceProxy.min,
    ],
    [
      "Max",
      result.vanilla.max,
      result.manualFlatMap.max,
      result.serviceProxy.max,
    ],
    [
      "Samples",
      result.vanilla.samples,
      result.manualFlatMap.samples,
      result.serviceProxy.samples,
    ],
  ];

  for (const [label, v, m, p] of rows) {
    if (label === "Samples") {
      console.log(
        `│ ${label.padEnd(19)} │ ${String(v).padStart(16)} │ ${String(m).padStart(16)} │ ${String(p).padStart(16)} │`,
      );
    } else {
      console.log(
        `│ ${label.padEnd(19)} │ ${formatTime(v).padStart(16)} │ ${formatTime(m).padStart(16)} │ ${formatTime(p).padStart(16)} │`,
      );
    }
  }

  console.log(
    "└─────────────────────┴──────────────────┴──────────────────┴──────────────────┘",
  );

  // Print operations per second
  console.log("\n📈 Operations per Second:");
  console.log(
    `   Vanilla:    ${formatOps(result.vanilla.opsPerSecond).padStart(15)}`,
  );
  console.log(
    `   Manual:     ${formatOps(result.manualFlatMap.opsPerSecond).padStart(15)}`,
  );
  console.log(
    `   Proxy:      ${formatOps(result.serviceProxy.opsPerSecond).padStart(15)}`,
  );

  // Print overhead analysis
  console.log("\n📉 Overhead Analysis:");
  console.log(
    `   Manual vs Vanilla:     ${formatPercent(result.overheadVsVanilla.manualFlatMap).padStart(10)}`,
  );
  console.log(
    `   Proxy vs Vanilla:      ${formatPercent(result.overheadVsVanilla.serviceProxy).padStart(10)}`,
  );
  console.log(
    `   Proxy vs Manual:       ${formatPercent(result.overheadVsManual.serviceProxy).padStart(10)}`,
  );

  // Print summary
  console.log("\n✅ Summary:");
  const proxyOverheadMs =
    (result.serviceProxy.mean - result.vanilla.mean) / 1_000_000;
  console.log(
    `   Service.proxy adds ${proxyOverheadMs.toFixed(3)}ms overhead per call`,
  );

  if (result.overheadVsVanilla.serviceProxy < 100) {
    console.log("   ✅ Low overhead - suitable for production use");
  } else if (result.overheadVsVanilla.serviceProxy < 500) {
    console.log("   ⚠️  Moderate overhead - acceptable for most use cases");
  } else {
    console.log(
      "   ❌ High overhead - consider using manual pattern in hot paths",
    );
  }
}

/**
 * Print a single benchmark result
 */
export function printBenchmarkResult(result: BenchmarkResult): void {
  console.log(`\n📊 ${result.name}`);
  console.log(
    `   Mean:   ${formatTime(result.mean)} (${formatOps(result.opsPerSecond)})`,
  );
  console.log(
    `   Range:  ${formatTime(result.min)} - ${formatTime(result.max)}`,
  );
  console.log(`   σ:      ${formatTime(result.stdDev)}`);
  console.log(`   n:      ${result.samples} samples`);
}
