import { benchmarkServiceProxy } from './service-proxy.ts';
import { benchmarkFrameworkOverhead } from './framework-overhead.ts';
import { benchmarkMicroOperations } from './micro-operations.ts';

async function main() {
  console.log('🚀 Running fp-clean Performance Benchmarks\n');
  
  // Run service proxy benchmarks
  await benchmarkServiceProxy();
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Run framework overhead benchmarks
  await benchmarkFrameworkOverhead();
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Run micro-operation benchmarks
  await benchmarkMicroOperations();
  
  console.log('\n📊 All benchmarks completed!');
}

if (import.meta.main) {
  main().catch(console.error);
}

export { benchmarkServiceProxy, benchmarkFrameworkOverhead, benchmarkMicroOperations };
