/**
 * Ambient declaration so TypeScript resolves 'prom-client' when using moduleResolution nodenext.
 * The package ships its own types; this file is a fallback if the IDE or compiler cannot resolve them.
 */
declare module 'prom-client' {
  export class Registry {
    metrics(): Promise<string>;
    clear(): void;
    resetMetrics(): void;
  }

  export function collectDefaultMetrics(options: { register: Registry }): void;

  export class Counter<L extends string = string> {
    constructor(config: {
      name: string;
      help: string;
      labelNames?: L[];
      registers?: Registry[];
    });
    inc(labels: Record<L, string | number>): void;
  }

  export class Histogram<L extends string = string> {
    constructor(config: {
      name: string;
      help: string;
      labelNames?: L[];
      buckets?: number[];
      registers?: Registry[];
    });
    observe(labels: Record<L, string | number>, value: number): void;
  }
}
