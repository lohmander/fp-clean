export type Attr = string | number | boolean;
export type Attrs = Record<string, Attr>;

export interface SpanStart {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  timestamp: number;
  attributes?: Attrs;
}

export interface SpanEnd {
  traceId: string;
  spanId: string;
  timestamp: number;
  attributes?: Attrs;
}

/**
 * Observer interface for handling span start and end events.
 *
 * This interface defines callbacks that can be implemented to observe
 * the beginning and ending of spans in an Operation. Implementers
 * can use these callbacks to process span data as it's generated.
 *
 * @interface Observer
 * @see {@link OperationRuntime} for how to access the observer in the operation runtime.
 * @see {@link SpanStart} for the structure of span start events.
 * @see {@link SpanEnd} for the structure of span end events.
 */
export interface Observer {
  onSpanStart?: (span: SpanStart) => void;
  onSpanEnd?: (span: SpanEnd) => void;
}
