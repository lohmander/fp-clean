import { Bench } from 'tinybench';
import * as F from '../src/Operation';
import { get } from '../src/Runner';

async function benchmarkFrameworkOverhead() {
  const bench = new Bench({ time: 200 });
  
  console.log('=== Framework Overhead Benchmarks ===\n');
  console.log('Comparing fp-clean operations with plain JavaScript equivalents\n');

  // 1. Value wrapping
  bench.add('1. Plain JS - return value', () => {
    return 42;
  });

  bench.add('2. F.ok - wrap value in Operation', () => {
    F.ok(42);
  });

  bench.add('3. F.err - wrap error in Operation', () => {
    F.err('error');
  });

  // 2. Function application
  const increment = (x: number) => x + 1;
  
  bench.add('4. Plain JS - function application', () => {
    increment(42);
  });

  bench.add('5. F.map - map over Operation', () => {
    F.map(increment)(F.ok(42));
  });

  bench.add('6. F.flatMap - flatMap over Operation', () => {
    F.flatMap((x: number) => F.ok(increment(x)))(F.ok(42));
  });

  // 3. Composition
  const add = (a: number, b: number) => a + b;
  const multiply = (a: number, b: number) => a * b;
  
  bench.add('7. Plain JS - function composition', () => {
    const result = add(5, 3);
    multiply(result, 2);
  });

  bench.add('8. F.gen - generator composition', () => {
    F.gen(function* () {
      const sum = yield* F.ok(add(5, 3));
      const product = yield* F.ok(multiply(sum, 2));
      return product;
    });
  });

  bench.add('9. Manual composition with flatMap', () => {
    F.flatMap((sum: number) => F.ok(multiply(sum, 2)))(F.ok(add(5, 3)));
  });

  // 4. Execution overhead
  bench.add('10. Execute plain JS', () => {
    add(5, 3);
  });

  bench.add('11. Execute Operation via get', async () => {
    const op = F.ok(add(5, 3));
    await get(op, {});
  });

  // 5. Environment (Reader) overhead
  bench.add('12. Plain JS - use environment', () => {
    const env = { value: 42 };
    env.value + 1;
  });

  bench.add('13. F.asks - read from environment', () => {
    F.asks((env: { value: number }) => env.value + 1);
  });

  await bench.run();

  console.table(bench.table());

  // Analysis
  console.log('\n=== Framework Overhead Analysis ===\n');
  
  const tasks = bench.tasks;
  
  // Group results by category
  const categories = {
    'Value Wrapping': ['Plain JS - return value', 'F.ok - wrap value in Operation', 'F.err - wrap error in Operation'],
    'Function Application': ['Plain JS - function application', 'F.map - map over Operation', 'F.flatMap - flatMap over Operation'],
    'Composition': ['Plain JS - function composition', 'F.gen - generator composition', 'Manual composition with flatMap'],
    'Execution': ['Execute plain JS', 'Execute Operation via get'],
    'Environment': ['Plain JS - use environment', 'F.asks - read from environment'],
  };

  for (const [category, taskNames] of Object.entries(categories)) {
    console.log(`\n${category}:`);
    console.log('─'.repeat(category.length + 1));
    
    for (const taskName of taskNames) {
      const task = tasks.find(t => t.name === taskName);
      if (task?.result) {
        const opsPerSec = task.result.hz.toFixed(0);
        const msPerOp = (task.result.mean * 1000).toFixed(3);
        console.log(`  ${taskName}: ${opsPerSec} ops/sec (${msPerOp} ms/op)`);
      }
    }
  }

  // Calculate overhead ratios
  console.log('\n=== Overhead Ratios ===\n');
  
  const plainJsValue = tasks.find(t => t.name === 'Plain JS - return value')?.result?.mean;
  const fOkValue = tasks.find(t => t.name === 'F.ok - wrap value in Operation')?.result?.mean;
  
  if (plainJsValue && fOkValue) {
    const overhead = (fOkValue / plainJsValue - 1) * 100;
    console.log(`F.ok is ${overhead.toFixed(0)}% slower than plain JS value return`);
  }

  const plainJsFunc = tasks.find(t => t.name === 'Plain JS - function application')?.result?.mean;
  const fMapValue = tasks.find(t => t.name === 'F.map - map over Operation')?.result?.mean;
  
  if (plainJsFunc && fMapValue) {
    const overhead = (fMapValue / plainJsFunc - 1) * 100;
    console.log(`F.map is ${overhead.toFixed(0)}% slower than plain JS function application`);
  }

  const plainJsExec = tasks.find(t => t.name === 'Execute plain JS')?.result?.mean;
  const fGetValue = tasks.find(t => t.name === 'Execute Operation via get')?.result?.mean;
  
  if (plainJsExec && fGetValue) {
    const overhead = (fGetValue / plainJsExec);
    console.log(`Operation execution (get) is ${overhead.toFixed(1)}x slower than plain JS execution`);
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  benchmarkFrameworkOverhead().catch(console.error);
}

export { benchmarkFrameworkOverhead };
