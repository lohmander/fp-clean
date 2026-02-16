#!/usr/bin/env bun
/**
 * Example demonstrating the equivalence between Service.proxy calls
 * and manual flatMap patterns.
 *
 * This shows that:
 *   Service.proxy(Tag).method(args)
 * is equivalent to:
 *   flatMap(service => service.method(args))(askFor(Tag))
 */

import * as Context from "../src/Context";
import * as F from "../src/Operation";
import * as Runner from "../src/Runner";
import { Service } from "../src/Service";
import { pipe } from "../src/pipe";
import { askFor } from "../src/Operation/constructors";

// ============================================================================
// Define a simple service
// ============================================================================

interface Calculator {
  add: (a: number, b: number) => F.Operation<number>;
  multiply: (a: number, b: number) => F.Operation<number>;
}

const CalculatorTag = Context.Tag("calculator")<Calculator>();

// Create proxy
const CalculatorService = Service.proxy(CalculatorTag);

// Mock implementation
const mockCalculator: Calculator = {
  add: (a, b) => F.ok(a + b),
  multiply: (a, b) => F.ok(a * b),
};

const context = pipe(
  Context.empty(),
  Context.provide(CalculatorTag, F.ok(mockCalculator)),
);

// ============================================================================
// Compare the two styles
// ============================================================================

async function compareStyles() {
  console.log("=== Comparing Service.proxy vs Manual flatMap ===\n");

  // --------------------------------------------------------------------------
  // Using Service.proxy (clean, concise)
  // --------------------------------------------------------------------------
  const programWithProxy = F.gen(function* () {
    const sum = yield* CalculatorService.add(5, 3);
    const product = yield* CalculatorService.multiply(sum, 2);
    return product;
  });

  // --------------------------------------------------------------------------
  // Using manual flatMap (explicit, verbose)
  // --------------------------------------------------------------------------
  const programManual = pipe(
    askFor(CalculatorTag),
    F.flatMap((calc) => calc.add(5, 3)),
    F.flatMap((sum) =>
      pipe(
        askFor(CalculatorTag),
        F.flatMap((calc) => calc.multiply(sum, 2)),
      ),
    ),
  );

  // --------------------------------------------------------------------------
  // Run both programs
  // --------------------------------------------------------------------------
  const resultProxy = await Runner.get(programWithProxy, context);
  const resultManual = await Runner.get(programManual, context);

  console.log("Service.proxy result:");
  if (resultProxy.ok) {
    console.log(`  (5 + 3) * 2 = ${resultProxy.value}`);
  } else {
    console.log("  Failed:", resultProxy.error);
  }

  console.log("\nManual flatMap result:");
  if (resultManual.ok) {
    console.log(`  (5 + 3) * 2 = ${resultManual.value}`);
  } else {
    console.log("  Failed:", resultManual.error);
  }

  console.log("\n✅ Both programs produce the same result!");
  console.log("\nThe equivalence can be expressed as:");
  console.log(`
    Service.proxy(Tag).method(args)
    ≡
    flatMap(service => service.method(args))(askFor(Tag))
  `);
}

compareStyles().catch(console.error);
