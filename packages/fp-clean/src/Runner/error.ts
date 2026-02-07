export class DependencyResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DependencyResolutionError";
  }
}
