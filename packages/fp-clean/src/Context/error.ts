export class CircularDependencyError extends Error {
  constructor(public readonly key: string) {
    super(
      `Circular dependency detected for service: ${key}. Refactor your services to avoid circular dependencies.`,
    );
    this.name = "CircularDependencyError";
  }
}
